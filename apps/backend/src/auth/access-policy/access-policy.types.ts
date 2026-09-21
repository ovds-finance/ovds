/**
 * Shared types for the ABAC / PBAC enforcement layer.
 *
 * CompanySecurityPolicy is the per-tenant configuration stored in the
 * `company.securityPolicy` JSON column.  When null / absent, sensible
 * defaults apply (no IP restriction, no time-window, no forced MFA).
 */

/** Allowed-hours window.  Both values are "HH:mm" in the tenant's timezone. */
export interface AllowedHours {
  /** e.g. "09:00" */
  start: string;
  /** e.g. "17:00" */
  end: string;
  /** IANA tz name, e.g. "Africa/Addis_Ababa" */
  timezone: string;
}

/**
 * Per-tenant ABAC policy.  Stored as JSON in company.securityPolicy.
 *
 * All fields are optional — omitted = "no restriction for this dimension".
 */
export interface CompanySecurityPolicy {
  /**
   * Allowed source IPs / CIDR blocks for sensitive write operations.
   * e.g. ["196.188.0.0/16", "10.0.0.1"]
   * Empty array or absent = all IPs permitted.
   */
  ipWhitelist?: string[];

  /**
   * Restrict sensitive mutations to a time window.
   * Absent = no time restriction.
   */
  allowedHours?: AllowedHours;

  /**
   * When true, every write / approve action requires the MFA flag on the
   * JWT (user.mfaEnrolled && user.mfaVerified).
   */
  mfaRequired?: boolean;

  /**
   * Override the default set of "sensitive" permissions that trigger
   * IP and time-window checks.  If absent, DEFAULT_SENSITIVE_PERMS is used.
   */
  sensitivePerms?: string[];
}

/**
 * Input bag passed to AccessPolicyService.enforce().
 * Built by AccessPolicyGuard from the live HTTP request.
 */
export interface PolicyEnforceInput {
  /** Decoded JWT user from request.user */
  user: {
    userId: string;
    role: string;
    companyId: string | null;
    mfaEnrolled?: boolean;
    /** Set by an MFA-verification step if present */
    mfaVerified?: boolean;
  };
  /** The permission(s) being exercised — taken from @CheckPolicy metadata */
  permissions: string[];
  /** Resource being accessed — body / params merged by the guard */
  resource?: {
    companyId?: string;
    ownerId?: string;
    createdBy?: string;
    status?: string;
    isSensitive?: boolean;
    [key: string]: unknown;
  };
  /** Network / environment metadata */
  environment: {
    /** Resolved client IP from X-Forwarded-For or socket.remoteAddress */
    ipAddress: string;
    /** Wall-clock time of the request */
    requestTime: Date;
  };
}

/** Result returned by AccessPolicyService.enforce() */
export interface PolicyDecision {
  allowed: boolean;
  /** Human-readable reason, logged on denial */
  reason?: string;
}
