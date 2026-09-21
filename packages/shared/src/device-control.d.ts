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
export type DeviceControlCategory = 'ENCRYPTION' | 'APP_PERMISSION' | 'NETWORK_POLICY' | 'ENFORCEMENT_RULE';
export declare const DEVICE_CONTROL_CATEGORIES: DeviceControlCategory[];
export interface DeviceControlCategoryMeta {
    key: DeviceControlCategory;
    label: string;
    description: string;
    /** Lucide icon name hint for UI rendering. */
    icon: string;
    /** Why a misconfiguration of this control is high-impact. */
    riskNote: string;
}
export declare const DEVICE_CONTROL_CATEGORY_META: Record<DeviceControlCategory, DeviceControlCategoryMeta>;
export type DeviceControlChangeStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED' | 'CANCELLED';
export declare const DEVICE_CONTROL_CHANGE_STATUSES: DeviceControlChangeStatus[];
export declare const DEVICE_CONTROL_PERMISSIONS: {
    readonly READ: "device_control:read";
    readonly PROPOSE: "device_control:propose";
    readonly APPROVE: "device_control:approve";
};
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
export declare const DEVICE_CONTROL_DEFAULT_SETTINGS: Record<DeviceControlCategory, DeviceControlSettings>;
/** Options used to render structured editors for each category. */
export declare const DEVICE_CONTROL_ENUM_FIELDS: Partial<Record<DeviceControlCategory, Record<string, string[]>>>;
//# sourceMappingURL=device-control.d.ts.map