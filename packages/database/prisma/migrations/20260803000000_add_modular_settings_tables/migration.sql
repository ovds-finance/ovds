-- Modular Settings System Tables
-- Migration: 20260803000000_add_modular_settings_tables
--
-- Adds: setting_category, setting_group, setting (modular definitions),
--       setting_value (KV store), setting_input (UI metadata),
--       module (app module registry), company_module (per-company enablement)

-- ── Setting Category ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `setting_category` (
  `id`          VARCHAR(36)   NOT NULL PRIMARY KEY,
  `key`         VARCHAR(50)   NOT NULL,
  `name`        VARCHAR(100)  NOT NULL,
  `description` VARCHAR(200)  NULL,
  `icon`        VARCHAR(50)   NULL,
  `sortOrder`   INT           NOT NULL DEFAULT 0,
  `isActive`    TINYINT(1)    NOT NULL DEFAULT 1,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `setting_category_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Setting Group ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `setting_group` (
  `id`          VARCHAR(36)   NOT NULL PRIMARY KEY,
  `categoryId`  VARCHAR(36)   NOT NULL,
  `key`         VARCHAR(50)   NOT NULL,
  `name`        VARCHAR(100)  NOT NULL,
  `description` VARCHAR(200)  NULL,
  `sortOrder`   INT           NOT NULL DEFAULT 0,
  `isActive`    TINYINT(1)    NOT NULL DEFAULT 1,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `setting_group_categoryId_idx` (`categoryId`),
  UNIQUE INDEX `setting_group_key_key` (`key`),
  CONSTRAINT `setting_group_categoryId_fkey`
    FOREIGN KEY (`categoryId`) REFERENCES `setting_category` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Setting (modular definitions) ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `setting` (
  `id`           VARCHAR(36)   NOT NULL PRIMARY KEY,
  `key`          VARCHAR(100)  NOT NULL,
  `value`        LONGTEXT      NOT NULL,
  `type`         VARCHAR(20)   NOT NULL DEFAULT 'text',
  `categoryId`   VARCHAR(36)   NOT NULL,
  `groupId`      VARCHAR(36)   NULL,
  `companyId`    VARCHAR(36)   NULL,
  `defaultValue` LONGTEXT      NULL,
  `options`      LONGTEXT      NULL,
  `isRequired`   TINYINT(1)    NOT NULL DEFAULT 0,
  `isGlobal`     TINYINT(1)    NOT NULL DEFAULT 0,
  `isEncrypted`  TINYINT(1)    NOT NULL DEFAULT 0,
  `sortOrder`    INT           NOT NULL DEFAULT 0,
  `placeholder`  VARCHAR(200)  NULL,
  `hint`         VARCHAR(500)  NULL,
  `module`       VARCHAR(50)   NULL,
  `createdAt`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `setting_key_key` (`key`),
  INDEX `setting_categoryId_idx` (`categoryId`),
  INDEX `setting_groupId_idx` (`groupId`),
  INDEX `setting_companyId_idx` (`companyId`),
  INDEX `setting_module_idx` (`module`),
  CONSTRAINT `setting_categoryId_fkey`
    FOREIGN KEY (`categoryId`) REFERENCES `setting_category` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `setting_groupId_fkey`
    FOREIGN KEY (`groupId`) REFERENCES `setting_group` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `setting_companyId_fkey`
    FOREIGN KEY (`companyId`) REFERENCES `company` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Setting Value (KV store) ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `setting_value` (
  `id`          VARCHAR(36)   NOT NULL PRIMARY KEY,
  `key`         VARCHAR(100)  NOT NULL,
  `value`       LONGTEXT      NOT NULL,
  `companyId`   VARCHAR(36)   NULL,
  `scope`       VARCHAR(20)   NOT NULL DEFAULT 'global',
  `type`        VARCHAR(20)   NULL,
  `isEncrypted` TINYINT(1)    NOT NULL DEFAULT 0,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `setting_value_key_companyId_key` (`key`, `companyId`),
  INDEX `setting_value_key_idx` (`key`),
  INDEX `setting_value_companyId_idx` (`companyId`),
  INDEX `setting_value_scope_idx` (`scope`),
  CONSTRAINT `setting_value_companyId_fkey`
    FOREIGN KEY (`companyId`) REFERENCES `company` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Setting Input (UI component metadata) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS `setting_input` (
  `id`           VARCHAR(36)   NOT NULL PRIMARY KEY,
  `settingKey`   VARCHAR(100)  NOT NULL,
  `component`    VARCHAR(50)   NOT NULL DEFAULT 'text',
  `options`      LONGTEXT      NULL,
  `validation`   LONGTEXT      NULL,
  `placeholder`  VARCHAR(200)  NULL,
  `hint`         VARCHAR(500)  NULL,
  `helpUrl`      VARCHAR(500)  NULL,
  `dependsOn`    VARCHAR(100)  NULL,
  `dependsValue` VARCHAR(200)  NULL,
  `sortOrder`    INT           NOT NULL DEFAULT 0,
  `isVisible`    TINYINT(1)    NOT NULL DEFAULT 1,
  `isReadonly`   TINYINT(1)    NOT NULL DEFAULT 0,
  `isRequired`   TINYINT(1)    NOT NULL DEFAULT 0,
  `layout`       VARCHAR(50)   NULL,
  `cssClass`     VARCHAR(200)  NULL,
  `createdAt`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `setting_input_settingKey_key` (`settingKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Module (app module registry) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `module` (
  `id`          VARCHAR(36)   NOT NULL PRIMARY KEY,
  `key`         VARCHAR(50)   NOT NULL,
  `name`        VARCHAR(100)  NOT NULL,
  `description` VARCHAR(200)  NULL,
  `icon`        VARCHAR(50)   NULL,
  `sortOrder`   INT           NOT NULL DEFAULT 0,
  `isActive`    TINYINT(1)    NOT NULL DEFAULT 1,
  `isCore`      TINYINT(1)    NOT NULL DEFAULT 0,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `module_key_key` (`key`),
  INDEX `module_sortOrder_idx` (`sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Company Module (per-company enablement) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS `company_module` (
  `id`         VARCHAR(36)   NOT NULL PRIMARY KEY,
  `companyId`  VARCHAR(36)   NOT NULL,
  `moduleKey`  VARCHAR(50)   NOT NULL,
  `isEnabled`  TINYINT(1)    NOT NULL DEFAULT 0,
  `settings`   LONGTEXT      NULL,
  `createdAt`  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `company_module_companyId_moduleKey_key` (`companyId`, `moduleKey`),
  INDEX `company_module_companyId_idx` (`companyId`),
  INDEX `company_module_moduleKey_idx` (`moduleKey`),
  CONSTRAINT `company_module_moduleKey_fkey`
    FOREIGN KEY (`moduleKey`) REFERENCES `module` (`key`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `company_module_companyId_fkey`
    FOREIGN KEY (`companyId`) REFERENCES `company` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed core modules ─────────────────────────────────────────────────────────
-- Insert the standard OVDS modules so the Settings > Modules tab has data.

INSERT IGNORE INTO `module` (`id`, `key`, `name`, `description`, `icon`, `sortOrder`, `isActive`, `isCore`) VALUES
  (UUID(), 'invoice',     'invoice',          'Sales invoices and customer billing',        'FileText',      1,  1, 1),
  (UUID(), 'accounting',    'Accounting',          'Double-entry general ledger and reporting',  'BookOpen',      2,  1, 1),
  (UUID(), 'banking',       'Banking',             'Bank accounts, reconciliation, and payments','CreditCard',    3,  1, 1),
  (UUID(), 'expenses',      'Expenses',            'Expense claims and reimbursements',          'Receipt',       4,  1, 0),
  (UUID(), 'payroll',       'Payroll',             'Employee payroll and PAYE/pension filing',   'Users',         5,  1, 0),
  (UUID(), 'projects',      'Projects',            'Project tracking and cost allocation',       'Briefcase',     6,  1, 0),
  (UUID(), 'inventory',     'Inventory',           'Stock items, warehouses, and movements',     'Package',       7,  1, 0),
  (UUID(), 'crm',           'CRM',                 'Contacts, leads, and pipeline management',   'UserCheck',     8,  1, 0),
  (UUID(), 'vat',           'VAT',                 'Value Added Tax filing and compliance',      'Shield',        9,  1, 1),
  (UUID(), 'bit',           'Business Income Tax', 'Corporate income tax and advance payments',  'DollarSign',   10,  1, 0),
  (UUID(), 'pit',           'Personal Income Tax', 'Employee income tax (PAYE)',                 'User',         11,  1, 1),
  (UUID(), 'drrf',          'DRRF',                'Disaster risk reduction fund levy',          'AlertTriangle',12,  1, 0),
  (UUID(), 'ifrs',          'IFRS Reporting',      'IFRS financial statements and disclosures',  'BarChart2',    13,  1, 0),
  (UUID(), 'manufacturing', 'Manufacturing',       'Production orders and BOM management',       'Settings',     14,  1, 0),
  (UUID(), 'treasury',      'Treasury',            'Cash pooling and FX management',             'Landmark',     15,  1, 0),
  (UUID(), 'notifications', 'Notifications',       'In-app and email notification system',       'Bell',         16,  1, 1),
  (UUID(), 'api',           'API Access',          'REST and oRPC API access for integrations',  'Code',         17,  1, 0);
