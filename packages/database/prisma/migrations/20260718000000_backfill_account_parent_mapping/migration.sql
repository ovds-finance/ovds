-- Backfill parent-child mapping for the Chart of Accounts (Project Charter §2/§3).
--
-- The accounting module now ENFORCES a mandatory parent for every sub-account
-- (double-entry.service.ts createAccount). Any account created before that
-- guard existed may be an orphan (parentId IS NULL) and would distort the Trial
-- Balance. This migration repairs existing orphans by binding each sub-account
-- code to its charter parent group (1000/1100/2000/3000/4000/5000) within the
-- same company, using the same mapping as seedDefaultAccounts().
--
-- Idempotent & safe: only orphans whose code has a known parent mapping AND
-- whose parent account exists in the same company are updated. Accounts that
-- are already mapped, are root groups themselves, or have no resolvable parent
-- are left untouched.

-- 1) Temporary mapping table: child account code -> parent account code
CREATE TEMPORARY TABLE `_account_parent_map` (
  `childCode` VARCHAR(50) NOT NULL,
  `parentCode` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`childCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `_account_parent_map` (`childCode`, `parentCode`) VALUES
  -- 1000 Fixed Assets
  ('1001', '1000'),
  -- 1100 Current Assets
  ('1010', '1100'),
  ('1020', '1100'),
  ('1101', '1100'),
  ('1105', '1100'),
  ('1200', '1100'),
  ('1290', '1100'),
  -- 2000 Current Liabilities
  ('2001', '2000'),
  ('2010', '2000'),
  ('2020', '2000'),
  ('2100', '2000'),
  ('2130', '2000'),
  ('2140', '2000'),
  ('2150', '2000'),
  ('2155', '2000'),
  ('2160', '2000'),
  ('2170', '2000'),
  ('2180', '2000'),
  ('2190', '2000'),
  -- 3000 Equity & Capital
  ('3001', '3000'),
  ('3010', '3000'),
  -- 4000 Operating Revenue
  ('4001', '4000'),
  ('4010', '4000'),
  ('4020', '4000'),
  ('5040', '4000'),
  -- 5000 Administrative Expenses
  ('5001', '5000'),
  ('5010', '5000'),
  ('5020', '5000'),
  ('5030', '5000'),
  ('5050', '5000'),
  ('6000', '5000'),
  ('6010', '5000'),
  ('6020', '5000'),
  ('6030', '5000');

-- 2) Backfill: link each orphaned sub-account to its parent account (same company)
UPDATE `account` AS child
  INNER JOIN `_account_parent_map` AS m ON m.`childCode` = child.`code`
  INNER JOIN `account` AS parent
    ON parent.`code` = m.`parentCode`
   AND (parent.`companyId` <=> child.`companyId`)
SET child.`parentId` = parent.`id`
WHERE child.`parentId` IS NULL;

-- 3) Cleanup
DROP TEMPORARY TABLE `_account_parent_map`;
