-- Migration: add securityPolicy column to company table
-- Stores per-tenant ABAC configuration as a JSON string.
-- NULL means "no policy overrides" — the system defaults apply.
ALTER TABLE `company`
  ADD COLUMN `securityPolicy` LONGTEXT NULL
    COMMENT 'Per-tenant ABAC config JSON: ipWhitelist, allowedHours, mfaRequired, sensitivePerms';
