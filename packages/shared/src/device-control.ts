/**
 * Device Control Governance — org-wide maker-checker controls
 *
 * Implements centralized, far-reaching enforcement of four high-impact device
 * control categories. Every change to an enforced policy must pass through a
 * maker-checker (four-eyes) review before it takes effect org-wide.
 *
 *   • ENCRYPTION       — device encryption settings
 *   • APP_PERMISSION    — app permissions
 *   • NETWORK_POLICY    — network policies
 *   • ENFORCEMENT_RULE  — enforcement rules
 */

export type DeviceControlCategory =
  | 'ENCRYPTION'
  | 'APP_PERMISSION'
  | 'NETWORK_POLICY'
  | 'ENFORCEMENT_RULE';

export const DEVICE_CONTROL_CATEGORIES: DeviceControlCategory[] = [
  'ENCRYPTION',
  'APP_PERMISSION',
  'NETWORK_POLICY',
  'ENFORCEMENT_RULE',
];

export interface DeviceControlCategoryMeta {
  key: DeviceControlCategory;
  label: string;
  description: string;
  /** Lucide icon name hint for UI rendering. */
  icon: string;
  /** Why a misconfiguration of this control is high-impact. */
  riskNote: string;
}

export const DEVICE_CONTROL_CATEGORY_META: Record<
  DeviceControlCategory,
  DeviceControlCategoryMeta
> = {
  ENCRYPTION: {
    key: 'ENCRYPTION',
    label: 'Device Encryption',
    description:
      'Disk and removable-media encryption policy enforced on every managed device.',
    icon: 'LOCK',
    riskNote:
      'An incorrect encryption policy can render devices inaccessible, trigger data-loss-protection events, or violate compliance requirements.',
  },
  APP_PERMISSION: {
    key: 'APP_PERMISSION',
    label: 'App Permissions',
    description:
      'Allow/block lists and OS permission grants applied to managed apps.',
    icon: 'SHIELD',
    riskNote:
      'Overly restrictive policies can break business-critical apps; overly permissive policies weaken the organization’s security posture.',
  },
  NETWORK_POLICY: {
    key: 'NETWORK_POLICY',
    label: 'Network Policies',
    description:
      'VPN, Wi-Fi, tethering and domain routing rules for managed devices.',
    icon: 'NETWORK',
    riskNote:
      'Misconfigurations can prevent remote access to critical systems, disconnect remote users, or route traffic outside secure paths.',
  },
  ENFORCEMENT_RULE: {
    key: 'ENFORCEMENT_RULE',
    label: 'Enforcement Rules',
    description:
      'Actions taken when a device drifts from compliance (quarantine, warn, block).',
    icon: 'SLIDERS',
    riskNote:
      'A minor misconfiguration can cause endpoints to drift out of compliance, resulting in potential fines and penalties.',
  },
};

export type DeviceControlChangeStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'APPLIED'
  | 'CANCELLED';

export const DEVICE_CONTROL_CHANGE_STATUSES: DeviceControlChangeStatus[] = [
  'DRAFT',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'APPLIED',
  'CANCELLED',
];

export const DEVICE_CONTROL_PERMISSIONS = {
  READ: 'device_control:read',
  PROPOSE: 'device_control:propose',
  APPROVE: 'device_control:approve',
} as const;

export type DeviceControlSettings = Record<string, unknown>;

export interface DeviceControlPolicyDTO {
  id?: string;
  companyId: string;
  category: DeviceControlCategory;
  version: number;
  settings: DeviceControlSettings;
  changeRequestId?: string | null;
  enforcedAt: string | null;
  enforcedById?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceControlChangeRequestDTO {
  id: string;
  companyId: string;
  category: DeviceControlCategory;
  settings: DeviceControlSettings;
  reason?: string | null;
  status: DeviceControlChangeStatus;
  makerId?: string | null;
  makerName?: string | null;
  submittedAt?: string | null;
  checkerId?: string | null;
  checkerName?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  resultingPolicyId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeviceControlChangeRequestDTO {
  category: DeviceControlCategory;
  settings: DeviceControlSettings;
  reason?: string;
  /** When true the request is created and submitted (PENDING) in one step. */
  submit?: boolean;
}

export interface ReviewDeviceControlChangeRequestDTO {
  decision: 'APPROVE' | 'REJECT';
  reviewNote?: string;
}

/**
 * Safe, org-wide default settings per category. Used as the effective policy
 * until a company enforces a custom policy, and as the baseline for the
 * settings editor.
 */
export const DEVICE_CONTROL_DEFAULT_SETTINGS: Record<
  DeviceControlCategory,
  DeviceControlSettings
> = {
  ENCRYPTION: {
    requireEncryption: true,
    method: 'AES_256_XTS',
    enforceOnRemovableMedia: true,
    recoveryKeyEscrow: true,
    keyRotationDays: 365,
    allowUnencryptedBoot: false,
  },
  APP_PERMISSION: {
    mode: 'ALLOWLIST',
    blockCamera: false,
    blockMicrophone: false,
    blockUnknownSources: true,
    allowedApps: [],
    blockedApps: [],
    requireApprovalForNewApps: true,
  },
  NETWORK_POLICY: {
    requireVpn: true,
    allowedWifiSsids: [],
    blockCellularData: false,
    blockTethering: true,
    allowedDomains: ['*.company.com'],
    blockPersonalHotspot: true,
  },
  ENFORCEMENT_RULE: {
    onEncryptionOff: 'QUARANTINE',
    onPolicyViolation: 'WARN',
    gracePeriodHours: 24,
    autoRemediate: true,
    offlineGraceHours: 72,
  },
};

/** Options used to render structured editors for each category. */
export const DEVICE_CONTROL_ENUM_FIELDS: Partial<
  Record<DeviceControlCategory, Record<string, string[]>>
> = {
  ENCRYPTION: { method: ['AES_256_XTS', 'AES_256_CBC', 'XTS_AES_256'] },
  APP_PERMISSION: { mode: ['ALLOWLIST', 'BLOCKLIST'] },
  ENFORCEMENT_RULE: {
    onEncryptionOff: ['QUARANTINE', 'WARN', 'BLOCK', 'NONE'],
    onPolicyViolation: ['QUARANTINE', 'WARN', 'BLOCK', 'NONE'],
  },
};
