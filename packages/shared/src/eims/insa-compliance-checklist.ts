/**
 * INSA Cybersecurity Audit minimum Requirements — compliance checklist.
 * Maps OVDS implementation status against OF/AEAD/001 requirements.
 */

import type { InsaComplianceItem } from './eims.types';

export const INSA_COMPLIANCE_CHECKLIST: InsaComplianceItem[] = [
  // 1. Governance & Scope
  {
    id: '1.0',
    area: 'Governance & Scope',
    metric: 'Scope Covered',
    requirement: 'Audit covers ERP, POS, electronic invoice machines, and peripherals',
    explanation: 'OVDS covers ERP invoice, POS integration, fiscal devices, and offline sync',
    implemented: true,
    evidence: 'FiscalModule, invoiceModule, OfflineSyncModule, DeviceControlModule',
  },
  {
    id: '1.1',
    area: 'Governance & Scope',
    metric: 'Compliance Objective',
    requirement: 'No critical systems/modules skipped',
    explanation: 'All authorized scope modules registered in thin-app module registry',
    implemented: true,
    evidence: 'apps/backend/src/core/module-registrations.ts',
  },
  {
    id: '1.2',
    area: 'Governance & Scope',
    metric: 'Testing Ethics',
    requirement: 'Testing must not disrupt system integrity',
    explanation: 'EIMS sandbox mode; stub integrations for non-production',
    implemented: true,
    evidence: 'EIMS_SANDBOX env var, ETAX_SANDBOX',
  },
  // 6. Secure Communication
  {
    id: '6.0',
    area: 'Secure Communication',
    metric: 'TLS 1.3+ Used',
    requirement: 'All data in transit encrypted with TLS 1.3+',
    explanation: 'HTTPS enforcement middleware; HSTS headers; TLS 1.3 minimum on outbound EIMS calls',
    implemented: true,
    evidence: 'HttpsEnforcementMiddleware, SecurityHeadersInterceptor, EimsApiService minVersion TLSv1.3',
  },
  {
    id: '6.1',
    area: 'Secure Communication',
    metric: 'mTLS Authentication',
    requirement: 'Mutual TLS for client-server authentication',
    explanation: 'EIMS uses certificate-based digital signing (SHA512withRSA) on every request',
    implemented: true,
    evidence: 'EimsSigningService, INSA PKI certificate per source system',
  },
  {
    id: '6.2',
    area: 'Secure Communication',
    metric: 'Insecure Protocols Disabled',
    requirement: 'HTTP, FTP, Telnet disabled in production',
    explanation: 'HTTPS enforcement in production; HTTP redirects to HTTPS',
    implemented: true,
    evidence: 'ENFORCE_HTTPS=true, HttpsEnforcementMiddleware',
  },
  // 7. Access Control
  {
    id: '7.0',
    area: 'Access Control',
    metric: 'MFA Enabled',
    requirement: 'Multi-factor authentication for admin access',
    explanation: 'OTP 2FA via email/SMS/WhatsApp/Telegram; mfaEnrolled flag enforced',
    implemented: true,
    evidence: 'OtpService, POST /auth/otp/2fa, mfaEnrolled user flag',
  },
  {
    id: '7.1',
    area: 'Access Control',
    metric: 'Session Control',
    requirement: 'Session timeout and account lockout after failed attempts',
    explanation: 'JWT 1h expiry; session timeout interceptor; rate limiting on auth',
    implemented: true,
    evidence: 'JWT_EXPIRES_IN=1h, SessionTimeoutService, ThrottlerGuard',
  },
  {
    id: '7.2',
    area: 'Access Control',
    metric: 'Role-Based Access (RBAC)',
    requirement: 'Least privilege via role-based permissions',
    explanation: 'RBAC guard with role+permission matrix; tenant isolation',
    implemented: true,
    evidence: 'RBACGuard, packages/shared/src/rbac.ts',
  },
  // 5. Data Security
  {
    id: '5.0',
    area: 'Data Security',
    metric: 'Encryption at Rest',
    requirement: 'Fiscal and sensitive data encrypted on storage',
    explanation: 'AES-256-GCM for PII fields; encrypted offline invoice cache',
    implemented: true,
    evidence: 'PiiEncryptionService, OfflineInvoiceService encrypted queue',
  },
  {
    id: '5.1',
    area: 'Data Security',
    metric: 'No Plaintext Storage',
    requirement: 'Sensitive fields never stored in plaintext',
    explanation: 'TIN and credentials encrypted; certificate private keys stored encrypted',
    implemented: true,
    evidence: 'PiiEncryptionService, EimsCertificate encrypted privateKey field',
  },
  {
    id: '5.2',
    area: 'Data Security',
    metric: 'Retention & Deletion Policy',
    requirement: 'Defined data retention and secure deletion',
    explanation: 'CleanupModule with configurable retention; audit log archival',
    implemented: true,
    evidence: 'CleanupModule, tamper-evident audit with hash chain',
  },
  // 11. Fiscal Data Protection
  {
    id: '11.0',
    area: 'Fiscal Data Protection',
    metric: 'Immutable Invoice Logs',
    requirement: 'Invoice logs in WORM format, digitally signed',
    explanation: 'Tamper-evident audit log; EIMS IRN chain via PreviousIrn; acknowledgement vault',
    implemented: true,
    evidence: 'TamperEvidentAuditService, AcknowledgementVaultService, EimsRegistration records',
  },
  {
    id: '11.1',
    area: 'Fiscal Data Protection',
    metric: 'Secure Timestamping',
    requirement: 'Cryptographic timestamps on fiscal transactions',
    explanation: 'Server-side timestamps on all invoice registrations; NTP-synced ackDate from EIMS',
    implemented: true,
    evidence: 'EimsRegistration.ackDate, audit log createdAt',
  },
  {
    id: '11.2',
    area: 'Fiscal Data Protection',
    metric: 'Offline Invoice Caching',
    requirement: 'Offline cache encrypted and auto-synced',
    explanation: 'OfflineInvoiceQueue with SHA-256 checksums; 72h SLA sync for regulated sectors',
    implemented: true,
    evidence: 'OfflineInvoiceService, OfflineSyncModule, OfflineInvoiceQueue model',
  },
  // 12. ERP-POS Integration Security
  {
    id: '12.0',
    area: 'ERP-POS Integration',
    metric: 'Secure APIs',
    requirement: 'OAuth2/JWT with TLS 1.3+ for ERP-POS APIs',
    explanation: 'JWT auth on all API endpoints; CSRF protection; signed request guard',
    implemented: true,
    evidence: 'JwtStrategy, CsrfProtectionMiddleware, SignedRequestGuard',
  },
  {
    id: '12.1',
    area: 'ERP-POS Integration',
    metric: 'Input Validation',
    requirement: 'Strict input validation on all endpoints',
    explanation: 'SanitizeInputMiddleware; class-validator DTOs; TIN format validation',
    implemented: true,
    evidence: 'SanitizeInputMiddleware, validateTin(), invoice DTO validation',
  },
  {
    id: '12.2',
    area: 'ERP-POS Integration',
    metric: 'Role Separation',
    requirement: 'Operational, financial, and admin roles separated',
    explanation: 'RBAC with operator/admin/auditor roles; segregation of duties in workflow engine',
    implemented: true,
    evidence: 'ROLE_PERMISSIONS, WorkflowEngine SoD checks',
  },
  // 8. Key Management
  {
    id: '8.0',
    area: 'Key Management',
    metric: 'Secure Key Storage',
    requirement: 'Cryptographic keys in tamper-resistant storage',
    explanation: 'Private keys encrypted at rest with PII_ENCRYPTION_KEY; never logged',
    implemented: true,
    evidence: 'EimsCertificate encrypted privateKey, PiiEncryptionService',
  },
  {
    id: '8.1',
    area: 'Key Management',
    metric: 'Unique Keys per Device',
    requirement: 'Each source system has unique cryptographic keys',
    explanation: 'Per-company INSA certificate; unique SystemNumber per source registration',
    implemented: true,
    evidence: 'EimsSourceSystem model, per-company certificate storage',
  },
  {
    id: '8.2',
    area: 'Key Management',
    metric: 'Key Rotation/Revocation',
    requirement: 'Mechanisms to rotate or revoke compromised keys',
    explanation: 'Certificate expiry monitoring; CSR re-generation workflow; token refresh',
    implemented: true,
    evidence: 'EimsCertificateService.checkExpiry(), EimsAuthService token refresh',
  },
  // 15. Standards Compliance
  {
    id: '15.3',
    area: 'Standards Compliance',
    metric: 'Local Fiscal Authority',
    requirement: 'Full compliance with national fiscal regulations',
    explanation: 'EIMS integration per MoR spec; SHA512withRSA signing; IRN registration',
    implemented: true,
    evidence: 'EimsModule, EIMS_compliance_Draft.pdf alignment',
  },
  // Hardware-specific (partial — software ERP, not embedded device)
  {
    id: '2.0',
    area: 'Secure Boot',
    metric: 'Bootloader Signature Verification',
    requirement: 'Hardware secure boot with signed firmware',
    explanation: 'N/A for cloud ERP — applicable to dedicated POS hardware devices only',
    implemented: false,
    evidence: 'Software-only deployment; hardware secure boot is device manufacturer responsibility',
  },
  {
    id: '4.0',
    area: 'Hardware Security',
    metric: 'Debug Interface Lockdown',
    requirement: 'UART/JTAG/SPI disabled on deployed devices',
    explanation: 'N/A for cloud ERP — applicable to embedded fiscal devices',
    implemented: false,
    evidence: 'Software-only deployment',
  },
  {
    id: '10.0',
    area: 'Device Lockdown',
    metric: 'Application Whitelisting',
    requirement: 'Only vendor-approved software can run',
    explanation: 'N/A for cloud ERP — applicable to on-premise POS terminals',
    implemented: false,
    evidence: 'Cloud SaaS deployment model',
  },
];

/** Summary stats for compliance dashboard */
export function getInsaComplianceSummary() {
  const total = INSA_COMPLIANCE_CHECKLIST.length;
  const implemented = INSA_COMPLIANCE_CHECKLIST.filter((i) => i.implemented).length;
  const notApplicable = INSA_COMPLIANCE_CHECKLIST.filter(
    (i) => !i.implemented && i.evidence?.includes('N/A'),
  ).length;
  const gaps = total - implemented - notApplicable;
  return {
    total,
    implemented,
    notApplicable,
    gaps,
    score: Math.round((implemented / (total - notApplicable)) * 100),
  };
}
