-- ═══════════════════════════════════════════════════════════════════════════════
-- Enhanced Ovds-style Settings System
-- Adds: modules, company_modules, setting_inputs, setting_values
-- Provides: modular configuration storage, centralized UI inputs,
--           database-backed key-value mapping
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `module` (
  `id`          VARCHAR(36)  NOT NULL,
  `key`         VARCHAR(50)  NOT NULL,
  `name`        VARCHAR(100) NOT NULL,
  `description` VARCHAR(200) NULL,
  `icon`        VARCHAR(50)  NULL,
  `sort_order`  INT          NOT NULL DEFAULT 0,
  `is_active`   TINYINT(1)   NOT NULL DEFAULT 1,
  `is_core`     TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Module_key_key` (`key`),
  KEY `idx_module_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `company_module` (
  `id`         VARCHAR(36)  NOT NULL,
  `company_id` VARCHAR(36)  NOT NULL,
  `module_key` VARCHAR(50)  NOT NULL,
  `is_enabled` TINYINT(1)   NOT NULL DEFAULT 0,
  `settings`   LONGTEXT     NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `CompanyModule_companyId_moduleKey_key` (`company_id`, `module_key`),
  KEY `idx_company_module_company` (`company_id`),
  KEY `idx_company_module_module` (`module_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `setting_input` (
  `id`            VARCHAR(36)  NOT NULL,
  `setting_key`   VARCHAR(100) NOT NULL,
  `component`     VARCHAR(50)  NULL,
  `options`       LONGTEXT     NULL,
  `validation`    LONGTEXT     NULL,
  `placeholder`   VARCHAR(200) NULL,
  `hint`          VARCHAR(500) NULL,
  `help_url`      VARCHAR(500) NULL,
  `depends_on`    VARCHAR(100) NULL,
  `depends_value` VARCHAR(100) NULL,
  `sort_order`    INT          NOT NULL DEFAULT 0,
  `is_visible`    TINYINT(1)   NOT NULL DEFAULT 1,
  `is_readonly`   TINYINT(1)   NOT NULL DEFAULT 0,
  `is_required`   TINYINT(1)   NOT NULL DEFAULT 0,
  `layout`        VARCHAR(20)  NULL,
  `css_class`     VARCHAR(200) NULL,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SettingInput_settingKey_key` (`setting_key`),
  KEY `idx_setting_input_visible` (`is_visible`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `setting_value` (
  `id`          VARCHAR(36)  NOT NULL,
  `key`         VARCHAR(100) NOT NULL,
  `value`       LONGTEXT     NOT NULL,
  `company_id`  VARCHAR(36)  NULL,
  `scope`       VARCHAR(20)  NOT NULL DEFAULT 'global',
  `type`        VARCHAR(20)  NULL,
  `is_encrypted` TINYINT(1)  NOT NULL DEFAULT 0,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SettingValue_key_companyId_key` (`key`, `company_id`),
  KEY `idx_setting_value_key` (`key`),
  KEY `idx_setting_value_company` (`company_id`),
  KEY `idx_setting_value_scope` (`scope`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `company_module`
  ADD CONSTRAINT `CompanyModule_company_id_fk`
  FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE CASCADE;

ALTER TABLE `setting_value`
  ADD CONSTRAINT `SettingValue_company_id_fk`
  FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed: canonical application modules
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT IGNORE INTO `module` (`id`, `key`, `name`, `description`, `icon`, `sort_order`, `is_active`, `is_core`) VALUES
  ('mod-001', 'invoice',    'invoice',     'Create and send invoices, quotes, and credit notes',       'FILE_TEXT',       1, 1, 1),
  ('mod-002', 'accounting',   'Accounting',    'Double-entry bookkeeping and chart of accounts',           'BOOK_OPEN',       2, 1, 1),
  ('mod-003', 'banking',      'Banking',       'Bank accounts, reconciliation, and feeds',                 'LANDMARK',        3, 1, 0),
  ('mod-004', 'expenses',     'Expenses',      'Expense claims, bills, and purchase orders',               'RECEIPT',         4, 1, 0),
  ('mod-005', 'payroll',      'Payroll',       'Salary runs, payslips, and statutory deductions',          'BANKNOTE',        5, 1, 0),
  ('mod-006', 'attendance',   'Attendance',    'Biometric and mobile attendance tracking',                 'CLOCK',           6, 1, 0),
  ('mod-007', 'leaves',       'Leave Mgmt',    'Leave requests, approvals, and balances',                  'CALENDAR',        7, 1, 0),
  ('mod-008', 'projects',     'Projects',      'Project tracking, milestones, and timesheets',             'FOLDER',          8, 1, 0),
  ('mod-009', 'inventory',    'Inventory',     'Stock levels, warehouses, and stock adjustments',          'PACKAGE',         9, 1, 0),
  ('mod-010', 'crm',          'CRM',           'Customers, vendors, and interaction history',              'USERS',          10, 1, 0),
  ('mod-011', 'reports',      'Reports',       'Financial statements, tax reports, and dashboards',        'BAR_CHART_3',   11, 1, 0),
  ('mod-012', 'vat',          'VAT / TOT',     'VAT calculation, filing, and e-submission',                'SHIELD_CHECK',  12, 1, 0),
  ('mod-013', 'bit',          'BIT',           'Business income tax and advance payment',                  'PERCENT',       13, 1, 0),
  ('mod-014', 'pit',          'PIT',           'Pay-as-you-earn withholding and remittance',               'HASH',          14, 1, 0),
  ('mod-015', 'drrf',         'DRRF',          'Disaster risk financing contributions',                    'DISASTER',      15, 1, 0),
  ('mod-016', 'ifrs',         'IFRS Reports',  'IFRS-compliant financial statements and disclosures',      'GLOBE',         16, 1, 0),
  ('mod-017', 'manufacturing','Manufacturing', 'BOM, work orders, and production planning',                'WRENCH',        17, 1, 0),
  ('mod-018', 'treasury',     'Treasury',      'Cash forecasting, dunning, and collections',               'VAULT',         18, 1, 0),
  ('mod-019', 'notifications','Notifications', 'Email, SMS, and in-app notification templates',            'BELL',          19, 1, 0),
  ('mod-020', 'api',          'API Access',    'REST API keys and webhook configuration',                  'CODE',          20, 1, 0);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed: centralized UI input definitions for key settings
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT IGNORE INTO `setting_input` (`id`, `setting_key`, `component`, `options`, `validation`, `placeholder`, `hint`, `help_url`, `depends_on`, `depends_value`, `sort_order`, `is_visible`, `is_readonly`, `is_required`, `layout`, `css_class`) VALUES
  -- Company Profile
  ('inp-001', 'company_name',          'text',    NULL, '{"minLength":2,"maxLength":200}', 'e.g. Ovds Technologies PLC',  'Legal registered name', NULL, NULL, NULL, 1, 1, 0, 1, 'stack', NULL),
  ('inp-002', 'company_email',         'email',   NULL, '{"type":"email"}',               'info@company.com',             'Primary contact email', NULL, NULL, NULL, 2, 1, 0, 1, 'stack', NULL),
  ('inp-003', 'company_phone',         'text',    NULL, '{"pattern":"^[+0-9\\s-]{7,20}$"}', '+251911000000',              'Phone number with country code', NULL, NULL, NULL, 3, 1, 0, 0, 'stack', NULL),
  ('inp-004', 'company_address',       'textarea',NULL, '{"maxLength":500}',              'Addis Ababa, Ethiopia',        'Registered office address', NULL, NULL, NULL, 4, 1, 0, 1, 'stack', NULL),
  ('inp-005', 'company_tin',           'text',    NULL, '{"pattern":"^[0-9]{9,15}$"}',    '0012345678',                   'Tax identification number', NULL, NULL, NULL, 5, 1, 0, 1, 'stack', NULL),
  ('inp-006', 'company_vat_number',    'text',    NULL, '{"pattern":"^[0-9]{9,15}$"}',    '',                             'VAT registration number', NULL, 'vat_enabled', 'true', 6, 1, 0, 0, 'stack', NULL),
  ('inp-007', 'company_business_type', 'select',  '[{"label":"Private Limited Company (PLC)","value":"PLC"},{"label":"One Member PLC","value":"ONE_MEMBER_PLC"},{"label":"Share Company","value":"SHARE_COMPANY"},{"label":"Sole Proprietorship","value":"SOLE_PROPRIETORSHIP"},{"label":"Non-Profit / NGO","value":"NGO"},{"label":"Government Entity","value":"GOVERNMENT"}]', NULL, '', 'Legal business entity type', NULL, NULL, NULL, 7, 1, 0, 1, 'stack', NULL),
  ('inp-008', 'company_logo_url',      'image',   NULL, '{"type":"url"}',                 '',                             'Company logo URL (png/jpg/svg)', NULL, NULL, NULL, 1, 1, 0, 0, 'inline', 'w-32 h-32 object-cover'),
  -- Localisation
  ('inp-009',  'language',             'select',  '[{"label":"English","value":"en"},{"label":"Amharic","value":"am"},{"label":"Oromoo","value":"om"},{"label":"Af-Soomaali","value":"so"}]', NULL, '', 'Interface language', NULL, NULL, NULL, 1, 1, 0, 1, 'inline', NULL),
  ('inp-010',  'timezone',             'select',  '[{"label":"Addis Ababa (EAT)","value":"Africa/Addis_Ababa"},{"label":"Nairobi (EAT)","value":"Africa/Nairobi"},{"label":"Dubai (GST)","value":"Asia/Dubai"},{"label":"UTC","value":"UTC"}]', NULL, '', 'System timezone', NULL, NULL, NULL, 2, 1, 0, 1, 'inline', NULL),
  ('inp-011',  'date_format',          'select',  '[{"label":"YYYY-MM-DD","value":"Y-m-d"},{"label":"DD/MM/YYYY","value":"d/m/Y"},{"label":"MM/DD/YYYY","value":"m/d/Y"}]', NULL, '', 'Date display format', NULL, NULL, NULL, 3, 1, 0, 1, 'inline', NULL),
  ('inp-012',  'time_format',          'select',  '[{"label":"24-hour","value":"24"},{"label":"12-hour","value":"12"}]', NULL, '', 'Time display format', NULL, NULL, NULL, 4, 1, 0, 1, 'inline', NULL),
  ('inp-013',  'decimal_separator',    'select',  '[{"label":"Dot (1,000.00)","value":"."},{"label":"Comma (1.000,00)","value":","}]', NULL, '', 'Decimal separator', NULL, NULL, NULL, 1, 1, 0, 1, 'inline', NULL),
  ('inp-014',  'thousands_separator',  'select',  '[{"label":"Comma (1,000)","value":","},{"label":"Dot (1.000)","value":"."},{"label":"Space (1 000)","value":" "}]', NULL, '', 'Thousands separator', NULL, NULL, NULL, 2, 1, 0, 1, 'inline', NULL),
  -- Currencies
  ('inp-015',  'default_currency',     'select',  '[{"label":"ETB — Ethiopian Birr","value":"ETB"},{"label":"USD — US Dollar","value":"USD"},{"label":"EUR — Euro","value":"EUR"},{"label":"GBP — British Pound","value":"GBP"},{"label":"SAR — Saudi Riyal","value":"SAR"},{"label":"AED — UAE Dirham","value":"AED"},{"label":"KES — Kenyan Shilling","value":"KES"}]', NULL, '', 'Default currency for amounts', NULL, NULL, NULL, 1, 1, 0, 1, 'inline', NULL),
  ('inp-016',  'currency_position',    'select',  '[{"label":"Before amount (ETB 1,000)","value":"before"},{"label":"After amount (1,000 ETB)","value":"after"}]', NULL, '', 'Currency symbol position', NULL, NULL, NULL, 2, 1, 0, 1, 'inline', NULL),
  ('inp-017',  'currency_rate_provider','select', '[{"label":"Manual entry","value":"manual"},{"label":"ECX (Ethiopia)","value":"ecx"},{"label":"Open Exchange Rates","value":"openexchangerates"},{"label":"Fixer.io","value":"fixer"}]', NULL, '', 'Exchange rate data source', NULL, NULL, NULL, 1, 1, 0, 0, 'inline', NULL),
  ('inp-018',  'currency_auto_update', 'toggle',  NULL, NULL, '', 'Auto-update exchange rates', NULL, NULL, NULL, 2, 1, 0, 0, 'inline', NULL),
  -- Taxes
  ('inp-019',  'vat_enabled',          'toggle',  NULL, NULL, '', 'Enable VAT/TOT calculation', NULL, NULL, NULL, 1, 1, 0, 0, 'stack', NULL),
  ('inp-020',  'vat_rate',             'number',  NULL, '{"min":0,"max":99,"step":0.1}', '15', 'Standard VAT rate (%)', NULL, 'vat_enabled', 'true', 2, 1, 0, 0, 'stack', NULL),
  ('inp-021',  'tot_enabled',          'toggle',  NULL, NULL, '', 'Enable Turnover Tax', NULL, NULL, NULL, 3, 1, 0, 0, 'stack', NULL),
  ('inp-022',  'tot_rate',             'number',  NULL, '{"min":0,"max":99,"step":0.1}', '2', 'TOT rate (%)', NULL, 'tot_enabled', 'true', 4, 1, 0, 0, 'stack', NULL),
  ('inp-023',  'wht_enabled',          'toggle',  NULL, NULL, '', 'Enable Withholding Tax', NULL, NULL, NULL, 1, 1, 0, 0, 'stack', NULL),
  ('inp-024',  'wht_rate',             'number',  NULL, '{"min":0,"max":99,"step":0.1}', '3', 'WHT rate (%)', NULL, 'wht_enabled', 'true', 2, 1, 0, 0, 'stack', NULL),
  ('inp-025',  'bit_enabled',          'toggle',  NULL, NULL, '', 'Enable Business Income Tax', NULL, NULL, NULL, 1, 1, 0, 0, 'stack', NULL),
  ('inp-026',  'bit_rate',             'number',  NULL, '{"min":0,"max":99,"step":0.1}', '30', 'BIT rate (%)', NULL, 'bit_enabled', 'true', 2, 1, 0, 0, 'stack', NULL),
  ('inp-027',  'pit_enabled',          'toggle',  NULL, NULL, '', 'Enable Personal Income Tax', NULL, NULL, NULL, 3, 1, 0, 0, 'stack', NULL),
  ('inp-028',  'drrf_enabled',         'toggle',  NULL, NULL, '', 'Enable DRRF contribution', NULL, NULL, NULL, 1, 1, 0, 0, 'stack', NULL),
  ('inp-029',  'drrf_rate',            'number',  NULL, '{"min":0,"max":99,"step":0.1}', '1', 'DRRF rate (%)', NULL, 'drrf_enabled', 'true', 2, 1, 0, 0, 'stack', NULL),
  -- Appearance
  ('inp-030', 'theme',                 'select',  '[{"label":"Light","value":"light"},{"label":"Dark","value":"dark"},{"label":"System default","value":"system"}]', NULL, '', 'UI theme preference', NULL, NULL, NULL, 1, 1, 0, 0, 'inline', NULL),
  ('inp-031', 'sidebar_density',       'select',  '[{"label":"Compact","value":"compact"},{"label":"Default","value":"default"},{"label":"Comfortable","value":"comfortable"}]', NULL, '', 'Sidebar spacing density', NULL, NULL, NULL, 2, 1, 0, 0, 'inline', NULL);
