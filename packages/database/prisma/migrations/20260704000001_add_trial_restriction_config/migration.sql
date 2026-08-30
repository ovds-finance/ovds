-- §4.2 Trial Restriction Matrices — adds restrictionConfig column to monetization_trial
-- This column stores JSON: { mode, maxDocuments, maxSkus, maxUsers, maxBranches, lockedFeatures[] }
-- Supports TIME_BOUND, VOLUME_CAP, and STRUCTURAL trial restriction modes.
-- Nullable: existing rows default to TIME_BOUND behaviour (expiry-based only).

ALTER TABLE `monetization_trial`
  ADD COLUMN `restrictionConfig` TEXT NULL
    COMMENT '§4.2 Trial restriction config JSON: {mode, maxDocuments, maxSkus, maxUsers, maxBranches, lockedFeatures[]}';
