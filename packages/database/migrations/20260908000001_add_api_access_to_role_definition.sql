-- ═══════════════════════════════════════════════════════════════════════════════
-- Role Management — API Access Toggle
-- Adds apiAccess column to role_definition table.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE `role_definition`
  ADD COLUMN `apiAccess` TINYINT(1) NOT NULL DEFAULT 0 AFTER `isSystem`;
