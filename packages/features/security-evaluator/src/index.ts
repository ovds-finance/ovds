/**
 * @ovds/features/security-evaluator — public API
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  securityEvaluatorApi
} from './services/securityEvaluatorApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useSecurityScore
} from './hooks/useSecurityScore';
