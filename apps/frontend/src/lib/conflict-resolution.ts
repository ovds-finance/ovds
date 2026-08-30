/**
 * Conflict Resolution Policy for OVDS Offline/Online Sync
 *
 * Handles cases where an invoice modified offline conflicts with an online entry.
 * Strategies:
 *   - SERVER_WINS: Online version always takes precedence (default for tax compliance).
 *   - CLIENT_WINS: Offline version takes precedence if newer.
 *   - MANUAL: Flag for human review (Financial Controller must resolve).
 */

export type ConflictStrategy = 'SERVER_WINS' | 'CLIENT_WINS' | 'MANUAL';

export interface SyncDocument {
  id: string;
  documentReference: string;
  updatedAt: string;
  payload: Record<string, unknown>;
  companyId: string;
}

export interface ConflictResult {
  resolved: boolean;
  strategy: ConflictStrategy;
  winner: 'LOCAL' | 'CLOUD' | 'MANUAL';
  mergedPayload?: Record<string, unknown>;
  reason: string;
}

export class ConflictResolutionPolicy {
  private defaultStrategy: ConflictStrategy = 'SERVER_WINS';

  setDefaultStrategy(strategy: ConflictStrategy) {
    this.defaultStrategy = strategy;
  }

  /**
   * Resolve a conflict between local and cloud versions of a document.
   *
   * For AABE compliance, the default is SERVER_WINS to ensure that
   * any tax filing or approval done online takes precedence over stale offline data.
   */
  resolve(
    local: SyncDocument | null | undefined,
    cloud: SyncDocument | null | undefined,
    strategy: ConflictStrategy = this.defaultStrategy,
  ): ConflictResult {
    if (!local && !cloud) {
      return { resolved: true, strategy: 'MANUAL', winner: 'MANUAL', reason: 'Both versions missing' };
    }

    if (!local) {
      return { resolved: true, strategy, winner: 'CLOUD', reason: 'Local version missing, using cloud' };
    }

    if (!cloud) {
      return { resolved: true, strategy, winner: 'LOCAL', reason: 'Cloud version missing, using local' };
    }

    const localTime = new Date(local.updatedAt).getTime();
    const cloudTime = new Date(cloud.updatedAt).getTime();

    if (localTime === cloudTime) {
      return {
        resolved: false,
        strategy: 'MANUAL',
        winner: 'MANUAL',
        reason: `Timestamp collision for ${local.documentReference} — requires manual review`,
      };
    }

    switch (strategy) {
      case 'SERVER_WINS':
        return {
          resolved: true,
          strategy: 'SERVER_WINS',
          winner: 'CLOUD',
          mergedPayload: cloud.payload,
          reason: `Server version wins for ${local.documentReference} (cloud updated ${cloud.updatedAt})`,
        };

      case 'CLIENT_WINS':
        if (localTime > cloudTime) {
          return {
            resolved: true,
            strategy: 'CLIENT_WINS',
            winner: 'LOCAL',
            mergedPayload: local.payload,
            reason: `Client version is newer for ${local.documentReference} (local updated ${local.updatedAt})`,
          };
        }
        return {
          resolved: true,
          strategy: 'CLIENT_WINS',
          winner: 'CLOUD',
          mergedPayload: cloud.payload,
          reason: `Cloud version is newer despite CLIENT_WINS strategy for ${local.documentReference}`,
        };

      case 'MANUAL':
        return {
          resolved: false,
          strategy: 'MANUAL',
          winner: 'MANUAL',
          reason: `Manual review required for ${local.documentReference} — local: ${local.updatedAt}, cloud: ${cloud.updatedAt}`,
        };

      default:
        return {
          resolved: true,
          strategy: this.defaultStrategy,
          winner: 'CLOUD',
          mergedPayload: cloud.payload,
          reason: `Default strategy ${this.defaultStrategy} applied for ${local.documentReference}`,
        };
    }
  }

  /**
   * Merge two payloads field by field.
   * For tax-critical fields (VAT, WHT, amounts), cloud wins.
   * For descriptive fields (notes, categories), local wins if newer.
   */
  mergePayloads(
    local: SyncDocument,
    cloud: SyncDocument,
  ): Record<string, unknown> {
    const criticalFields = ['taxableAmountEtb', 'calculatedVatEtb', 'whtAmountEtb', 'exchangeRate', 'transactionType'];
    const merged: Record<string, unknown> = { ...cloud.payload };

    const localTime = new Date(local.updatedAt).getTime();
    const cloudTime = new Date(cloud.updatedAt).getTime();
    const localIsNewer = localTime > cloudTime;

    for (const [key, localValue] of Object.entries(local.payload)) {
      if (criticalFields.includes(key)) {
        merged[key] = cloud.payload[key];
      } else if (localIsNewer) {
        merged[key] = localValue;
      }
    }

    return merged;
  }
}

export const conflictPolicy = new ConflictResolutionPolicy();
