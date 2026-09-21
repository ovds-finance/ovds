# 91 — Digital Rights Management and Content Protection

## 1. DRM Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Digital Rights Management                             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Content   │  │   License   │  │   Protection Layer       │ │
│  │   Storage   │  │   Server    │  │                         │ │
│  │             │  │             │  │ - Encryption            │ │
│  │ - Encrypted │  │ - Policy    │  │ - Watermarking          │ │
│  │ - Segmented │  │   Engine    │  │ - Fingerprinting        │ │
│  │ - Versioned │  │ - Usage     │  │ - Secure Decryption     │ │
│  │             │  │   Tracking  │  │ - Domain Binding        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Rights Expression │                        │
│                   │   (XrML/ODRL)       │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. DRM Service

```typescript
// drm/drm.service.ts
@InjectInject()
export class DRMService {
  async protectContent(content: Content, policy: RightsPolicy): Promise<ProtectedContent> {
    // Step 1: Encrypt content
    const encrypted = await this.encrypt(content.data);

    // Step 2: Generate license
    const license = await this.generateLicense(content.id, policy);

    // Step 3: Apply watermarking
    const watermarked = await this.applyWatermark(encrypted, content.id);

    return {
      id: content.id,
      encrypted: watermarked,
      license,
      policy,
      metadata: {
        createdAt: new Date(),
        algorithm: 'AES-256-GCM',
        watermark: true,
      },
    };
  }

  async requestLicense(request: LicenseRequest): Promise<License> {
    const user = await this.getUser(request.userId);
    const content = await this.getContent(request.contentId);

    // Validate eligibility
    const eligible = await this.checkEligibility(user, content.policy);

    if (!eligible.allowed) {
      throw new LicenseDeniedException(eligible.reason);
    }

    // Generate license
    const license = await this.generateLicense(content.id, {
      ...content.policy,
      userId: user.id,
      issuedAt: new Date(),
      expiresAt: this.computeExpiry(content.policy),
    });

    return license;
  }
}
```

## 3. License Management

```typescript
// drm/license/license-manager.service.ts
@InjectInject()
export class LicenseManagerService {
  async issueLicense(contentId: string, userId: string, policy: RightsPolicy): Promise<License> {
    const licenseKey = await this.generateLicenseKey();

    const license: License = {
      id: v4(),
      contentId,
      userId,
      policy,
      key: licenseKey,
      issuedAt: new Date(),
      expiresAt: this.computeExpiry(policy),
      constraints: this.buildConstraints(policy),
    };

    await this.storeLicense(license);

    return license;
  }

  async validateLicense(license: License, context: UsageContext): Promise<ValidationResult> {
    // Check expiry
    if (license.expiresAt < new Date()) {
      return { valid: false, reason: 'expired' };
    }

    // Check constraints
    for (const constraint of license.constraints) {
      const valid = await this.checkConstraint(constraint, context);

      if (!valid) {
        return { valid: false, reason: `constraint_violated: ${constraint.type}` };
      }
    }

    return { valid: true };
  }

  private buildConstraints(policy: RightsPolicy): Constraint[] {
    const constraints: Constraint[] = [];

    if (policy.maxPlayCount) {
      constraints.push({
        type: 'play_count',
        limit: policy.maxPlayCount,
        current: 0,
      });
    }

    if (policy.expiryDate) {
      constraints.push({
        type: 'expiry',
        date: policy.expiryDate,
      });
    }

    if (policy.devices) {
      constraints.push({
        type: 'device_limit',
        limit: policy.devices,
        devices: [],
      });
    }

    return constraints;
  }
}
```

## 4. Content Encryption

```typescript
// drm/encryption/content-encryption.service.ts
@InjectInject()
export class ContentEncryptionService {
  async encryptContent(content: Buffer): Promise<EncryptedContent> {
    // Generate content key
    const contentKey = await this.generateContentKey();

    // Encrypt content with content key
    const encryptedContent = await this.aesGcmEncrypt(content, contentKey);

    // Encrypt content key with master key
    const masterKey = await this.getMasterKey();
    const encryptedKey = await this.rsaEncrypt(contentKey, masterKey.publicKey);

    return {
      encryptedContent,
      encryptedKey,
      algorithm: 'AES-256-GCM',
      keyAlgorithm: 'RSA-OAEP-256',
    };
  }

  async decryptContent(encrypted: EncryptedContent, license: License): Promise<Buffer> {
    // Decrypt content key
    const masterKey = await this.getMasterKey();
    const contentKey = await this.rsaDecrypt(encrypted.encryptedKey, masterKey.privateKey);

    // Decrypt content
    return this.aesGcmDecrypt(encrypted.encryptedContent, contentKey);
  }
}
```

## 5. Watermarking

```typescript
// drm/watermarking/watermarking.service.ts
@InjectInject()
export class WatermarkingService {
  async applyWatermark(content: Buffer, userId: string): Promise<WatermarkedContent> {
    // Invisible watermark
    const invisible = await this.applyInvisibleWatermark(content, userId);

    // Visible watermark (optional)
    const visible = await this.applyVisibleWatermark(invisible, userId);

    // Forensic watermark
    const forensic = await this.applyForensicWatermark(visible, userId);

    return {
      content: forensic,
      watermarks: {
        invisible: true,
        visible: true,
        forensic: true,
      },
    };
  }

  private async applyInvisibleWatermark(content: Buffer, userId: string): Promise<Buffer> {
    const watermark = this.encodeWatermark(userId);

    // Spread spectrum watermarking
    const watermarked = await this.spreadSpectrum(content, watermark);

    return watermarked;
  }

  private async applyForensicWatermark(content: Buffer, userId: string): Promise<Buffer> {
    const fingerprint = await this.generateFingerprint(content, userId);

    const watermarked = await this.embedFingerprint(content, fingerprint);

    return watermarked;
  }
}
```

## 6. Usage Tracking

```typescript
// drm/tracking/usage-tracker.service.ts
@InjectInject()
export class UsageTrackerService {
  async trackUsage(license: License, event: UsageEvent): Promise<void> {
    // Record usage
    await this.recordEvent(license.id, event);

    // Update constraints
    await this.updateConstraints(license, event);

    // Check limits
    const exceeded = await this.checkLimits(license);

    if (exceeded) {
      await this.handleLimitExceeded(license);
    }

    // Generate report
    await this.generateUsageReport(license);
  }

  async getUsageReport(licenseId: string): Promise<UsageReport> {
    const events = await this.getUsageEvents(licenseId);

    return {
      licenseId,
      totalPlays: events.filter((e) => e.type === 'play').length,
      totalTime: events.reduce((sum, e) => sum + (e.duration || 0), 0),
      devices: [...new Set(events.map((e) => e.deviceId))],
      locations: [...new Set(events.map((e) => e.location))],
      timeline: this.buildTimeline(events),
    };
  }
}
```

## 7. Secure Decryption

```typescript
// drm/decryption/secure-decryption.service.ts
@InjectInject()
export class SecureDecryptionService {
  async decryptInSecureEnclave(encrypted: EncryptedContent, license: License): Promise<Buffer> {
    // Load content into secure enclave
    const enclave = await this.secureEnclave.load(encrypted.encryptedContent);

    // Decrypt within enclave
    const decrypted = await enclave.execute((context) => {
      const key = context.decryptKey(license.encryptedKey);
      return context.decrypt(encrypted.encryptedContent, key);
    });

    // Clear sensitive data
    enclave.clear();

    return decrypted;
  }
}
```

## 8. Domain Binding

```typescript
// drm/domain/domain-binding.service.ts
@InjectInject()
export class DomainBindingService {
  async bindToDomain(content: ProtectedContent, domain: string): Promise<DomainBoundContent> {
    // Create domain-specific key
    const domainKey = await this.deriveDomainKey(domain);

    // Re-encrypt content for domain
    const reencrypted = await this.reencrypt(content, domainKey);

    return {
      content: reencrypted,
      domain,
      boundAt: new Date(),
    };
  }

  async checkDomainAccess(content: ProtectedContent, domain: string): Promise<boolean> {
    return content.domain === domain;
  }
}
```

## 9. Rights Expression Language

```typescript
// drm/rel/rights-expression.service.ts
@InjectInject()
export class RightsExpressionService {
  async parseRights(expression: string): Promise<RightsPolicy> {
    const odrl = new ODRLParser();

    const policy = odrl.parse(expression);

    return {
      permissions: policy.permissions.map((p) => ({
        action: p.action,
        constraints: p.constraints,
      })),
      duties: policy.duties,
      prohibitions: policy.prohibitions,
    };
  }

  async evaluateRights(policy: RightsPolicy, context: UsageContext): Promise<RightsEvaluation> {
    const results: PermissionResult[] = [];

    for (const permission of policy.permissions) {
      const allowed = await this.evaluatePermission(permission, context);

      results.push({
        action: permission.action,
        allowed,
        constraints: permission.constraints,
      });
    }

    return {
      allowed: results.every((r) => r.allowed),
      permissions: results,
    };
  }
}
```

## 10. DRM Dashboard

```typescript
// apps/web/src/features/drm/components/drm-dashboard.tsx
export function DRMDashboard() {
  const { data: licenses, isLoading } = useLicenses();
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Digital Rights Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => protectContent()}>Protect Content</Button>
          <Button onClick={() => issueLicense()}>Issue License</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle>Active Licenses</CardTitle></CardHeader>
          <CardContent>
            <Metric value={licenses?.active || 0} label="Licenses" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Content Protected</CardTitle></CardHeader>
          <CardContent>
            <Metric value={licenses?.contentCount || 0} label="Items" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Violations</CardTitle></CardHeader>
          <CardContent>
            <Metric value={licenses?.violations || 0} label="Alerts" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
          <CardContent>
            <Metric value={`$${(licenses?.revenue || 0).toFixed(2)}`} label="This Month" />
          </CardContent>
        </Card>
      </div>

      <DataTable data={licenses?.list || []} columns={licenseColumns}>
        <TableBody>
          {licenses?.list.map((license) => (
            <TableRow key={license.id}>
              <TableCell>{license.id}</TableCell>
              <TableCell>{license.contentId}</TableCell>
              <TableCell>{license.userId}</TableCell>
              <TableCell><Badge variant={getStatusVariant(license.status)}>{license.status}</Badge></TableCell>
              <TableCell>{formatDate(license.expiresAt)}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => setSelectedLicense(license)}>View</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </div>
  );
}
```
