CREATE TABLE IF NOT EXISTS `setting_category` (
  `id`          VARCHAR(36)  NOT NULL,
  `key`         VARCHAR(50)  NOT NULL,
  `name`        VARCHAR(100) NOT NULL,
  `description` VARCHAR(200) NULL,
  `icon`        VARCHAR(50)  NULL,
  `sort_order`  INT          NOT NULL DEFAULT 0,
  `is_active`   TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SettingCategory_key_key` (`key`),
  KEY `idx_setting_category_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `setting_group` (
  `id`          VARCHAR(36)  NOT NULL,
  `category_id` VARCHAR(36)  NOT NULL,
  `key`         VARCHAR(50)  NOT NULL,
  `name`        VARCHAR(100) NOT NULL,
  `description` VARCHAR(200) NULL,
  `sort_order`  INT          NOT NULL DEFAULT 0,
  `is_active`   TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SettingGroup_categoryId_key_key` (`category_id`, `key`),
  KEY `idx_setting_group_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `setting` (
  `id`            VARCHAR(36)  NOT NULL,
  `key`           VARCHAR(100) NOT NULL,
  `value`         LONGTEXT     NOT NULL,
  `type`          VARCHAR(20)  NOT NULL DEFAULT 'text',
  `category_id`   VARCHAR(36)  NOT NULL,
  `group_id`      VARCHAR(36)  NULL,
  `company_id`    VARCHAR(36)  NULL,
  `default_value` LONGTEXT     NULL,
  `options`       LONGTEXT     NULL,
  `is_required`   TINYINT(1)   NOT NULL DEFAULT 0,
  `is_global`     TINYINT(1)   NOT NULL DEFAULT 0,
  `is_encrypted`  TINYINT(1)   NOT NULL DEFAULT 0,
  `sort_order`    INT          NOT NULL DEFAULT 0,
  `placeholder`   VARCHAR(200) NULL,
  `hint`          VARCHAR(500) NULL,
  `module`        VARCHAR(50)  NULL,
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Setting_key_key` (`key`),
  KEY `idx_setting_category` (`category_id`),
  KEY `idx_setting_group` (`group_id`),
  KEY `idx_setting_company` (`company_id`),
  KEY `idx_setting_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `setting_group`
  ADD CONSTRAINT `setting_group_category_id_fk`
  FOREIGN KEY (`category_id`) REFERENCES `setting_category`(`id`) ON DELETE CASCADE;

ALTER TABLE `setting`
  ADD CONSTRAINT `setting_category_id_fk`
  FOREIGN KEY (`category_id`) REFERENCES `setting_category`(`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `setting_group_id_fk`
  FOREIGN KEY (`group_id`) REFERENCES `setting_group`(`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `setting_company_id_fk`
  FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE CASCADE;

INSERT IGNORE INTO `setting_category` (`id`, `key`, `name`, `description`, `icon`, `sort_order`, `is_active`) VALUES
  ('cat-001', 'company',       'Company Profile',      'Business information, logo, TIN and legal details',     'BUILDING',     1, 1),
  ('cat-002', 'localisation',  'Localisation',         'Language, timezone, date and number formatting',       'GLOBE',        2, 1),
  ('cat-003', 'currencies',    'Currencies',           'Base currency, exchange rates and formatting',         'BANKNOTE',     3, 1),
  ('cat-004', 'taxes',         'Taxes & Compliance',   'VAT, WHT, TOT, DRRF, BIT, PIT and filing calendars',  'SHIELD_CHECK', 4, 1),
  ('cat-005', 'modules',       'Modules',              'Enable or disable functional modules per company',     'PACKAGE',      5, 1),
  ('cat-006', 'appearance',    'Appearance',           'Theme, sidebar density, font size and branding',       'PALETTE',      6, 1);

INSERT IGNORE INTO `setting_group` (`id`, `category_id`, `key`, `name`, `description`, `sort_order`, `is_active`) VALUES
  ('grp-001', 'cat-001', 'profile',  'Business Profile', 'Name, address, contact and legal identifiers',  1, 1),
  ('grp-002', 'cat-001', 'branding', 'Branding',         'Logo, favicon and company colours',             2, 1),
  ('grp-003', 'cat-002', 'format',   'Date & Time',      'Timezone, date and time display formats',       1, 1),
  ('grp-004', 'cat-002', 'numbers',  'Numbers',          'Decimal, thousands separators and precision',   2, 1),
  ('grp-005', 'cat-003', 'format',   'Currency Format',  'Symbol position, decimals and rounding',        1, 1),
  ('grp-006', 'cat-003', 'rates',    'Exchange Rates',   'Live rate provider and auto-update schedule',   2, 1),
  ('grp-007', 'cat-004', 'vat',      'VAT / TOT',        'Rates, thresholds and filing deadlines',        1, 1),
  ('grp-008', 'cat-004', 'withholding', 'Withholding Tax','WHT rates and triggers',                       2, 1),
  ('grp-009', 'cat-004', 'bit_pit',  'Income Tax',       'BIT flat tax and PIT schedules',                3, 1),
  ('grp-010', 'cat-004', 'drrf',     'DRRF',             'Disaster Risk Financing contributions',         4, 1),
  ('grp-011', 'cat-005', 'ovds',  'ovds',          'invoice, accounting and banking modules',     1, 1),
  ('grp-012', 'cat-005', 'hr',       'Human Resources',  'Payroll, attendance, leave and shift modules',  2, 1),
  ('grp-013', 'cat-005', 'tax_mod',  'Tax Modules',      'VAT, BIT, PIT, TOT and DRRF engines',           3, 1),
  ('grp-014', 'cat-006', 'theme',    'Theme',            'Light, dark or system default theme',           1, 1),
  ('grp-015', 'cat-006', 'density',  'Density',          'Compact, default or comfortable spacing',       2, 1);

INSERT IGNORE INTO `setting` (`id`, `key`, `value`, `type`, `category_id`, `group_id`, `default_value`, `is_required`, `is_global`, `module`, `sort_order`) VALUES
  -- Company Profile
  ('set-001', 'company_name',            '',       'text',     'cat-001', 'grp-001', '',              1, 0, 'company',   1),
  ('set-002', 'company_email',           '',       'text',     'cat-001', 'grp-001', '',              1, 0, 'company',   2),
  ('set-003', 'company_phone',           '',       'text',     'cat-001', 'grp-001', '',              0, 0, 'company',   3),
  ('set-004', 'company_address',         '',       'textarea', 'cat-001', 'grp-001', '',              1, 0, 'company',   4),
  ('set-005', 'company_tin',             '',       'text',     'cat-001', 'grp-001', '',              1, 0, 'company',   5),
  ('set-006', 'company_vat_number',      '',       'text',     'cat-001', 'grp-001', '',              0, 0, 'company',   6),
  ('set-007', 'company_business_type',   '',       'select',   'cat-001', 'grp-001', 'PLC',            1, 0, 'company',   7),
  ('set-008', 'company_logo_url',        '',       'image',    'cat-001', 'grp-002', '',              0, 0, 'company',   1),
  ('set-009', 'company_favicon_url',     '',       'image',    'cat-001', 'grp-002', '',              0, 0, 'company',   2),
  -- Localisation
  ('set-010', 'language',                'en',     'select',   'cat-002', 'grp-003', 'en',             1, 0, 'localisation', 1),
  ('set-011', 'timezone',                'Africa/Addis_Ababa', 'select', 'cat-002', 'grp-003', 'Africa/Addis_Ababa', 1, 0, 'localisation', 2),
  ('set-012', 'date_format',             'Y-m-d', 'select',   'cat-002', 'grp-003', 'Y-m-d',          1, 0, 'localisation', 3),
  ('set-013', 'time_format',             '24',     'select',   'cat-002', 'grp-003', '24',             1, 0, 'localisation', 4),
  ('set-014', 'decimal_separator',       '.',      'select',   'cat-002', 'grp-004', '.',              1, 0, 'localisation', 1),
  ('set-015', 'thousands_separator',     ',',      'select',   'cat-002', 'grp-004', ',',              1, 0, 'localisation', 2),
  -- Currencies
  ('set-016', 'default_currency',        'ETB',    'select',   'cat-003', 'grp-005', 'ETB',            1, 0, 'ovds',    1),
  ('set-017', 'currency_position',       'before', 'select',   'cat-003', 'grp-005', 'before',         1, 0, 'ovds',    2),
  ('set-018', 'currency_rate_provider',  'manual', 'select',   'cat-003', 'grp-006', 'manual',         0, 0, 'ovds',    1),
  ('set-019', 'currency_auto_update',    'false',  'toggle',   'cat-003', 'grp-006', 'false',          0, 0, 'ovds',    2),
  -- Taxes
  ('set-020', 'vat_enabled',             'true',   'toggle',   'cat-004', 'grp-007', 'true',           0, 0, 'tax',        1),
  ('set-021', 'vat_rate',                '15',     'number',   'cat-004', 'grp-007', '15',             0, 0, 'tax',        2),
  ('set-022', 'tot_enabled',             'true',   'toggle',   'cat-004', 'grp-007', 'true',           0, 0, 'tax',        3),
  ('set-023', 'tot_rate',                '2',      'number',   'cat-004', 'grp-007', '2',              0, 0, 'tax',        4),
  ('set-024', 'wht_enabled',             'true',   'toggle',   'cat-004', 'grp-008', 'true',           0, 0, 'tax',        5),
  ('set-025', 'wht_rate',                '3',      'number',   'cat-004', 'grp-008', '3',              0, 0, 'tax',        6),
  ('set-026', 'bit_enabled',             'true',   'toggle',   'cat-004', 'grp-009', 'true',           0, 0, 'tax',        7),
  ('set-027', 'bit_rate',                '30',     'number',   'cat-004', 'grp-009', '30',             0, 0, 'tax',        8),
  ('set-028', 'pit_enabled',             'true',   'toggle',   'cat-004', 'grp-009', 'true',           0, 0, 'tax',        9),
  ('set-029', 'drrf_enabled',            'true',   'toggle',   'cat-004', 'grp-010', 'true',           0, 0, 'tax',        10),
  ('set-030', 'drrf_rate',               '1',      'number',   'cat-004', 'grp-010', '1',              0, 0, 'tax',        11),
  -- Modules
  ('set-031', 'module_invoice',        'true',   'toggle',   'cat-005', 'grp-011', 'true',           0, 0, 'modules',    1),
  ('set-032', 'module_accounting',       'true',   'toggle',   'cat-005', 'grp-011', 'true',           0, 0, 'modules',    2),
  ('set-033', 'module_banking',          'true',   'toggle',   'cat-005', 'grp-011', 'true',           0, 0, 'modules',    3),
  ('set-034', 'module_payroll',          'false',  'toggle',   'cat-005', 'grp-012', 'false',          0, 0, 'modules',    4),
  ('set-035', 'module_attendance',       'false',  'toggle',   'cat-005', 'grp-012', 'false',          0, 0, 'modules',    5),
  ('set-036', 'module_vat',              'true',   'toggle',   'cat-005', 'grp-013', 'true',           0, 0, 'modules',    6),
  ('set-037', 'module_bit',              'true',   'toggle',   'cat-005', 'grp-013', 'true',           0, 0, 'modules',    7),
  ('set-038', 'module_pit',              'true',   'toggle',   'cat-005', 'grp-013', 'true',           0, 0, 'modules',    8),
  ('set-039', 'module_drrf',             'true',   'toggle',   'cat-005', 'grp-013', 'true',           0, 0, 'modules',    9),
  -- Appearance
  ('set-040', 'theme',                   'light',  'select',   'cat-006', 'grp-014', 'light',          0, 0, 'appearance', 1),
  ('set-041', 'sidebar_density',         'default','select',   'cat-006', 'grp-015', 'default',        0, 0, 'appearance', 1);
