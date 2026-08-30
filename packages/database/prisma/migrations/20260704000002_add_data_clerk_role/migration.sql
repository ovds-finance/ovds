-- §1.2 RBAC — Add DATA_CLERK role to the Role enum.
-- DATA_CLERK (alias: Secretary) is an intra-tenant operational role:
--   Permitted: input raw item data, log inventory, draft sales entries.
--   Blocked: approve transactions, access ledgers, file tax returns.

ALTER TABLE `user`
  MODIFY COLUMN `role` ENUM(
    'SPURADMIN','SUPERADMIN','ADMIN','HR','ovds','ACCOUNTING',
    'AUDITOR','EMPLOYEE','CRM','IFRS_OFFICER','BANK_LIAISON',
    'EXTERNAL_AUDITOR','DEVELOPER','CLIENT','PROJECT_MANAGER','PARTNER',
    'DATA_CLERK'
  ) NOT NULL DEFAULT 'EMPLOYEE';
