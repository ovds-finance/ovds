-- ============================================================================
-- Universal Tax Configuration Migration
-- OVDS Ethiopian ERP — applies to ALL industries / sectors
-- ============================================================================
-- Legal basis:
--   Proc. 1341/2024 (VAT)     Proc. 1395/2025 (WHT/PIT/TOT/DRRF)
--   Proc.  979/2016 (BIT)     Proc. 1186/2020 (Excise)
--   Proc.  110/1998 (Stamp)   Proc. 1265/2021 (Customs)
--   Reg.   570/2025 (DRRF)    IAS 12 (Deferred Tax)
--   AABE (IFRS / EFRS tiers)  Commercial Code 1243/2021
--
-- Safe to re-run: uses INSERT IGNORE and IF NOT EXISTS throughout.
-- Run AFTER gap_fix_tax_settings.sql.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CANONICAL TAX RULE TABLE
--    Stores the master rate table — one row per tax type.
--    Backend reads this at startup; UI displays it in Settings > Tax Config.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tax_rule` (
  `id`              CHAR(36)     NOT NULL PRIMARY KEY,
  `code`            VARCHAR(30)  NOT NULL UNIQUE COMMENT 'TaxTypeCode enum value',
  `name`            VARCHAR(120) NOT NULL,
  `label`           VARCHAR(60)  NOT NULL,
  `rate`            DECIMAL(10,6) NOT NULL DEFAULT 0,
  `specific_rate_etb` DECIMAL(12,4) NULL    COMMENT 'ETB per unit (fuel, plastic bags)',
  `threshold_etb`   DECIMAL(16,2) NOT NULL DEFAULT 0,
  `annual_turnover_threshold_etb` DECIMAL(18,2) NULL,
  `direction`       ENUM('OUTPUT','INPUT','BOTH') NOT NULL DEFAULT 'BOTH',
  `ias12_treatment` ENUM('CURRENT_TAX','DEFERRED_TAX','NOT_INCOME_TAX') NOT NULL,
  `ifrs18_category` ENUM('OPERATING','INVESTING','FINANCING','INCOME_TAX','DISCONTINUED') NOT NULL DEFAULT 'OPERATING',
  `gl_debit_code`   VARCHAR(10)  NOT NULL,
  `gl_credit_code`  VARCHAR(10)  NOT NULL,
  `gl_debit_name`   VARCHAR(120) NOT NULL,
  `gl_credit_name`  VARCHAR(120) NOT NULL,
  `frequency`       ENUM('MONTHLY','QUARTERLY','ANNUAL','AT_TRANSACTION','AT_CLEARANCE') NOT NULL,
  `deadline`        VARCHAR(200) NOT NULL,
  `portal`          ENUM('ETAX','TASS','CUSTOMS','PFSA','MUNICIPALITY') NOT NULL DEFAULT 'ETAX',
  `automation`      ENUM('FULL','PARTIAL','MANUAL') NOT NULL DEFAULT 'MANUAL',
  `proclamation`    VARCHAR(300) NOT NULL,
  `enabled_default` TINYINT(1)  NOT NULL DEFAULT 1,
  `overridable`     TINYINT(1)  NOT NULL DEFAULT 1,
  `notes`           TEXT         NULL,
  `is_active`       TINYINT(1)  NOT NULL DEFAULT 1,
  `created_at`      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_tax_rule_code` (`code`),
  INDEX `idx_tax_rule_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Universal Ethiopian tax rules — all industries';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SEED THE CANONICAL TAX RULES
-- ─────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO `tax_rule`
  (`id`,`code`,`name`,`label`,`rate`,`threshold_etb`,`annual_turnover_threshold_etb`,
   `direction`,`ias12_treatment`,`ifrs18_category`,
   `gl_debit_code`,`gl_credit_code`,`gl_debit_name`,`gl_credit_name`,
   `frequency`,`deadline`,`portal`,`automation`,`proclamation`,
   `enabled_default`,`overridable`,`notes`)
VALUES
-- VAT
(UUID(),'VAT','Value Added Tax','VAT 15%',0.150000,0,2000000,
 'OUTPUT','NOT_INCOME_TAX','OPERATING','1130','2150',
 'VAT Receivable (Input VAT)','VAT Payable (Output VAT)',
 'MONTHLY','30th of following month','ETAX','FULL',
 'Proc. 1341/2024; Reg. 570/2025',1,0,
 'Standard 15%. Zero-rate: exports, basic food, medical. Exempt: financial services, education, health.'),
-- TOT
(UUID(),'TOT','Turnover Tax','TOT',0.020000,0,2000000,
 'OUTPUT','NOT_INCOME_TAX','OPERATING','5420','2155',
 'TOT Expense','TOT Payable',
 'MONTHLY','30th of following month','ETAX','FULL',
 'Proc. 1395/2025 Art. 35–38',0,1,
 '2% goods/construction; 10% services. Mutually exclusive with VAT.'),
-- BIT
(UUID(),'BIT','Business Income Tax','BIT 30%',0.300000,0,NULL,
 'INPUT','CURRENT_TAX','INCOME_TAX','8100','2160',
 'Income Tax Expense (Current)','Income Tax Payable',
 'ANNUAL','November 7 of following year','ETAX','PARTIAL',
 'Proc. 979/2016; Proc. 1395/2025',1,0,
 '30% flat. MAT=2.5% of gross turnover. max(BIT,MAT).'),
-- PIT
(UUID(),'PIT','Personal Income Tax (PAYE)','PIT/PAYE',0.350000,600,NULL,
 'INPUT','CURRENT_TAX','INCOME_TAX','5010','2161',
 'Salaries & Wages Expense','PAYE / PIT Payable',
 'MONTHLY','30th of following month','ETAX','FULL',
 'Proc. 1395/2025 Art. 7–11',1,0,
 'Progressive 0–35%. Monthly exemption ETB 600.'),
-- WHT_GOODS
(UUID(),'WHT_GOODS','WHT — Goods','WHT Goods 2%',0.020000,10000,NULL,
 'INPUT','NOT_INCOME_TAX','OPERATING','2162','1131',
 'WHT Payable to MoR','WHT Receivable',
 'MONTHLY','30th of following month','ETAX','FULL',
 'Proc. 1395/2025 Art. 94',0,1,
 '2% on goods payments ≥ ETB 10,000.'),
-- WHT_SERVICES
(UUID(),'WHT_SERVICES','WHT — Services','WHT Services 2%',0.020000,500,NULL,
 'INPUT','NOT_INCOME_TAX','OPERATING','2162','1131',
 'WHT Payable to MoR','WHT Receivable',
 'MONTHLY','30th of following month','ETAX','FULL',
 'Proc. 1395/2025 Art. 94',0,1,
 '2% on service payments ≥ ETB 500.'),
-- WHT_NR
(UUID(),'WHT_NR','WHT — Non-Resident','WHT Non-Resident 15%',0.150000,0,NULL,
 'INPUT','NOT_INCOME_TAX','OPERATING','2162','5440',
 'WHT Payable to MoR','Non-Resident Service Expense',
 'MONTHLY','30th of following month','ETAX','PARTIAL',
 'Proc. 1395/2025',0,1,'15% final WHT on non-resident payments.'),
-- WHT_RENT
(UUID(),'WHT_RENT','WHT — Rent','WHT Rent 30%',0.300000,0,NULL,
 'INPUT','NOT_INCOME_TAX','OPERATING','2162','5450',
 'WHT Payable to MoR','Rent Expense',
 'MONTHLY','30th of following month','ETAX','PARTIAL',
 'Proc. 1395/2025',0,1,'30% WHT on corporate rent.'),
-- WHT_DIVIDEND
(UUID(),'WHT_DIVIDEND','WHT — Dividend','WHT Dividend 15%',0.150000,0,NULL,
 'INPUT','NOT_INCOME_TAX','FINANCING','3200','2162',
 'Retained Earnings','WHT Payable (Dividend)',
 'AT_TRANSACTION','30 days after month-end','ETAX','PARTIAL',
 'Proc. 1395/2025 Art. 52',0,1,'15% WHT on dividends.'),
-- WHT_INTEREST
(UUID(),'WHT_INTEREST','WHT — Interest','WHT Interest 10%',0.100000,0,NULL,
 'INPUT','NOT_INCOME_TAX','FINANCING','7100','2162',
 'Interest Expense','WHT Payable (Interest)',
 'AT_TRANSACTION','30 days after month-end','ETAX','PARTIAL',
 'Proc. 1395/2025 Art. 54',0,1,'10% standard; 30% FI/credit interest.'),
-- DRRF
(UUID(),'DRRF','DRRF Quarterly Levy','DRRF 1%',0.010000,0,NULL,
 'BOTH','NOT_INCOME_TAX','OPERATING','5430','2163',
 'DRRF Levy Expense','DRRF Payable',
 'QUARTERLY','15th of last month of each Ethiopian quarter','ETAX','PARTIAL',
 'Reg. 570/2025; Proc. 1264/2021',1,0,'1% base; 5% service fees/airtime/fuel.'),
-- PENSION_EE
(UUID(),'PENSION_EE','Employee Pension (PFSA)','Pension EE 7%',0.070000,0,NULL,
 'INPUT','NOT_INCOME_TAX','OPERATING','5010','2164',
 'Salaries & Wages','Pension Payable (Employee)',
 'MONTHLY','30th of following month','PFSA','FULL',
 'Proc. 715/2011; Proc. 1268/2023',1,0,'7% of insurable earnings. Cap ETB 15,000/month.'),
-- PENSION_ER
(UUID(),'PENSION_ER','Employer Pension (PFSA)','Pension ER 11%',0.110000,0,NULL,
 'INPUT','NOT_INCOME_TAX','OPERATING','5030','2165',
 'Employer Pension Expense','Pension Payable (Employer)',
 'MONTHLY','30th of following month','PFSA','FULL',
 'Proc. 715/2011; Proc. 1268/2023',1,0,'11% of insurable earnings. IAS 19 accrual.'),
-- EXCISE
(UUID(),'EXCISE','Excise Tax','Excise',0.000000,0,NULL,
 'OUTPUT','NOT_INCOME_TAX','OPERATING','5410','2166',
 'Excise Tax Expense','Excise Tax Payable',
 'MONTHLY','30 days after production or at customs','ETAX','PARTIAL',
 'Proc. 1186/2020; Proc. 1239/2021',0,1,'Variable rate per EXCISE_RATES. See excise-tax.types.ts.'),
-- STAMP_DUTY
(UUID(),'STAMP_DUTY','Stamp Duty','Stamp Duty 1%',0.010000,500,NULL,
 'BOTH','NOT_INCOME_TAX','OPERATING','5460','2167',
 'Stamp Duty Expense','Stamp Duty Payable',
 'AT_TRANSACTION','At document execution','ETAX','PARTIAL',
 'Proc. 110/1998',0,1,'1% of contract value. Min ETB 500.'),
-- PROPERTY_TAX
(UUID(),'PROPERTY_TAX','Property Tax','Property Tax 1%',0.010000,0,NULL,
 'INPUT','NOT_INCOME_TAX','OPERATING','5470','2168',
 'Property Tax Expense','Property Tax Payable',
 'ANNUAL','Annual municipal deadline','MUNICIPALITY','MANUAL',
 'Proc. 1161/2019',0,1,'1% of assessed value.'),
-- CUSTOMS_DUTY
(UUID(),'CUSTOMS_DUTY','Customs Duty','Customs 0-35%',0.000000,0,NULL,
 'INPUT','NOT_INCOME_TAX','OPERATING','1220','2169',
 'Inventory (IAS 2 cost)','Customs Duty Payable',
 'AT_CLEARANCE','Before goods released','CUSTOMS','PARTIAL',
 'Proc. 1265/2021',0,1,'0–35% CIF. Part of IAS 2 inventory cost.'),
-- IMPORT_SURTAX
(UUID(),'IMPORT_SURTAX','Import Surtax','Surtax 10%',0.100000,0,NULL,
 'INPUT','NOT_INCOME_TAX','OPERATING','1220','2170',
 'Inventory (IAS 2 cost)','Import Surtax Payable',
 'AT_CLEARANCE','At customs clearance','CUSTOMS','PARTIAL',
 'Council of Ministers Regulation',0,1,'10% of (CIF+duty+excise).'),
-- ADVANCE_BIT
(UUID(),'ADVANCE_BIT','Advance BIT on Imports','Advance BIT 3%',0.030000,0,NULL,
 'INPUT','CURRENT_TAX','INCOME_TAX','1132','2170',
 'Prepaid Income Tax','Advance BIT Remitted',
 'AT_CLEARANCE','At customs clearance','CUSTOMS','PARTIAL',
 'Proc. 979/2016 Art. 89',0,1,'3% CIF. Credited against annual BIT.'),
-- CAPITAL_GAINS
(UUID(),'CAPITAL_GAINS','Capital Gains Tax','Capital Gains 15%',0.150000,0,NULL,
 'INPUT','CURRENT_TAX','INCOME_TAX','8110','2171',
 'Capital Gains Tax Expense','Capital Gains Tax Payable',
 'AT_TRANSACTION','2 months after disposal','ETAX','PARTIAL',
 'Proc. 1395/2025 Art. 58',0,1,'15% on disposal of shares/bonds/property.'),
-- SCHEDULE_D
(UUID(),'SCHEDULE_D','Schedule D — Other Income','Schedule D',0.150000,0,NULL,
 'INPUT','CURRENT_TAX','INCOME_TAX','8110','2171',
 'Schedule D Tax Expense','Schedule D Tax Payable',
 'AT_TRANSACTION','30 days after month-end','ETAX','PARTIAL',
 'Proc. 1395/2025 Art. 52–62',0,1,'Dividends 15%, interest 10%, royalties 5/10%.'),
-- SCHEDULE_D duplicate alias cleanup guard
(UUID(),'SCHEDULE_D_ALT','Schedule D (alias)','Schedule D',0.150000,0,NULL,
 'INPUT','CURRENT_TAX','INCOME_TAX','8110','2171',
 'Schedule D Tax Expense','Schedule D Tax Payable',
 'AT_TRANSACTION','30 days after month-end','ETAX','PARTIAL',
 'Proc. 1395/2025',0,1,'Internal alias — not displayed in UI');

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. COMPANY TAX PROFILE TABLE
--    One row per company (tenant). Stores the CompanyTaxProfile struct.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `company_tax_profile` (
  `id`                        CHAR(36)    NOT NULL PRIMARY KEY,
  `company_id`                CHAR(36)    NOT NULL UNIQUE,
  `tin`                       VARCHAR(20) NOT NULL,
  `vat_number`                VARCHAR(30) NULL,
  `srm_device_serial`         VARCHAR(50) NULL,
  `aabe_framework`            ENUM('FULL_IFRS','IFRS_FOR_SMES','EFRS_SMALL','EFRS_MICRO') NOT NULL DEFAULT 'EFRS_SMALL',
  `is_pie`                    TINYINT(1)  NOT NULL DEFAULT 0 COMMENT 'Public Interest Entity',
  `annual_turnover_etb`       DECIMAL(20,2) NOT NULL DEFAULT 0,
  `sector`                    VARCHAR(50) NOT NULL DEFAULT 'OTHER',
  `entity_type`               ENUM('SOLE_PROPRIETORSHIP','PLC','ONE_MEMBER_PLC','SHARE_COMPANY') NOT NULL DEFAULT 'PLC',
  `vat_tot_band`              CHAR(1)     NOT NULL DEFAULT 'C' COMMENT 'A=VAT, B=TOT 500K-2M, C=<500K',
  `income_tax_schedule`       CHAR(1)     NOT NULL DEFAULT 'C' COMMENT 'A>1M, B=500K-1M, C<500K',
  `is_vat_registered`         TINYINT(1)  NOT NULL DEFAULT 0,
  `is_tot_applicable`         TINYINT(1)  NOT NULL DEFAULT 1,
  -- Active tax flags (JSON boolean map)
  `active_taxes`              JSON        NOT NULL COMMENT 'Which taxes are enabled for this company',
  -- Rate overrides (JSON map TaxTypeCode→rate)
  `rate_overrides`            JSON        NULL,
  -- Filing calendar
  `fiscal_year_start_month`   TINYINT     NOT NULL DEFAULT 7,
  `vat_filing_day`            TINYINT     NOT NULL DEFAULT 30,
  `pit_filing_day`            TINYINT     NOT NULL DEFAULT 30,
  `drrf_filing_day`           TINYINT     NOT NULL DEFAULT 15,
  `bit_deadline_month`        TINYINT     NOT NULL DEFAULT 11,
  `bit_deadline_day`          TINYINT     NOT NULL DEFAULT 7,
  -- IAS 12 deferred tax settings
  `enable_deferred_tax`       TINYINT(1)  NOT NULL DEFAULT 0,
  `deferred_tax_rate`         DECIMAL(5,4) NOT NULL DEFAULT 0.3000,
  `pool_cat1`                 DECIMAL(5,4) NOT NULL DEFAULT 0.2500,
  `pool_cat2`                 DECIMAL(5,4) NOT NULL DEFAULT 0.2000,
  `pool_cat3`                 DECIMAL(5,4) NOT NULL DEFAULT 0.1500,
  `pool_cat4`                 DECIMAL(5,4) NOT NULL DEFAULT 0.1000,
  -- Materiality
  `materiality_threshold_etb` DECIMAL(12,2) NOT NULL DEFAULT 5000,
  `rounding_method`           ENUM('HALF_UP','HALF_EVEN') NOT NULL DEFAULT 'HALF_UP',
  -- Integration
  `etax_auto_submit`          TINYINT(1)  NOT NULL DEFAULT 0,
  `srm_integrated`            TINYINT(1)  NOT NULL DEFAULT 0,
  `cbe_reconciliation`        TINYINT(1)  NOT NULL DEFAULT 0,
  `created_at`                DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_ctp_company` (`company_id`),
  INDEX `idx_ctp_band` (`vat_tot_band`, `income_tax_schedule`),
  CONSTRAINT `fk_ctp_company` FOREIGN KEY (`company_id`) REFERENCES `company` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Per-tenant tax configuration profile';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SECTOR TAX OVERRIDE TABLE
--    Records sector-specific exemptions applied to companies.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `sector_tax_override` (
  `id`           CHAR(36)    NOT NULL PRIMARY KEY,
  `sector`       VARCHAR(50) NOT NULL,
  `tax_code`     VARCHAR(30) NOT NULL,
  `rate_override` DECIMAL(10,6) NULL COMMENT 'NULL = use universal rate',
  `exempt`       TINYINT(1)  NOT NULL DEFAULT 0,
  `condition_text` VARCHAR(500) NOT NULL,
  `authority`    VARCHAR(300) NOT NULL,
  `is_active`    TINYINT(1)  NOT NULL DEFAULT 1,
  `created_at`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sto_sector_code` (`sector`, `tax_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SEED SECTOR OVERRIDES
-- ─────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO `sector_tax_override`
  (`id`,`sector`,`tax_code`,`exempt`,`condition_text`,`authority`)
VALUES
-- Agriculture
(UUID(),'AGRICULTURE','VAT',1,'Basic unprocessed agricultural produce is VAT-exempt','VAT Proc. 1341/2024 Schedule 2'),
(UUID(),'AGRICULTURE','EXCISE',1,'Agricultural equipment & fertilisers exempt from excise','Proc. 1186/2020 exemption list'),
(UUID(),'AGRICULTURE','IMPORT_SURTAX',1,'Agricultural inputs exempt from import surtax','Investment incentive regulations'),
-- Financial Services
(UUID(),'FINANCIAL_SERVICES','VAT',1,'Banking/insurance/financial intermediation is VAT-exempt','VAT Proc. 1341/2024 Schedule 1'),
(UUID(),'FINANCIAL_SERVICES','TOT',1,'Exempt from TOT when VAT-exempt','Proc. 1395/2025 Art. 35'),
-- Education
(UUID(),'EDUCATION','VAT',1,'Educational services are VAT-exempt','VAT Proc. 1341/2024 Schedule 1'),
(UUID(),'EDUCATION','TOT',1,'Exempt from TOT when VAT-exempt','Proc. 1395/2025'),
-- Healthcare
(UUID(),'HEALTHCARE','VAT',1,'Medical services and pharmaceutical supplies are VAT-exempt','VAT Proc. 1341/2024 Schedule 1'),
-- NGO
(UUID(),'NGO_NONPROFIT','BIT',1,'Charitable organisations exempt from BIT on activities within mandate','Proc. 979/2016 Art. 8'),
-- Manufacturing
(UUID(),'MANUFACTURING','IMPORT_SURTAX',1,'Priority manufacturing sectors may receive surtax exemptions on capital goods','Investment Proc. 1180/2020'),
-- Government
(UUID(),'GOVERNMENT','VAT',1,'Government bodies are not VAT registrants for own activities','VAT Proc. 1341/2024'),
(UUID(),'GOVERNMENT','BIT',1,'Government enterprises may have BIT exemption per charter','Proc. 979/2016 Art. 8');

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. TAX GL ACCOUNTS — ensure these codes exist in the Account master
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tax_gl_account` (
  `id`              CHAR(36)    NOT NULL PRIMARY KEY,
  `code`            VARCHAR(10) NOT NULL UNIQUE,
  `name`            VARCHAR(120) NOT NULL,
  `type`            ENUM('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE') NOT NULL,
  `normal_balance`  ENUM('DEBIT','CREDIT') NOT NULL,
  `ifrs18_category` ENUM('OPERATING','INVESTING','FINANCING','INCOME_TAX','DISCONTINUED') NULL,
  `ias12_treatment` ENUM('CURRENT_TAX','DEFERRED_TAX','NOT_INCOME_TAX') NULL,
  `description`     TEXT NULL,
  `is_active`       TINYINT(1)  NOT NULL DEFAULT 1,
  `created_at`      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Canonical GL accounts for tax journal entries';

INSERT IGNORE INTO `tax_gl_account`
  (`id`,`code`,`name`,`type`,`normal_balance`,`ifrs18_category`,`ias12_treatment`,`description`)
VALUES
(UUID(),'1130','VAT Receivable (Input VAT)','ASSET','DEBIT','OPERATING',NULL,'Input VAT claimable from MoR'),
(UUID(),'1131','WHT Receivable','ASSET','DEBIT','OPERATING',NULL,'WHT deducted by customers — credit against BIT'),
(UUID(),'1132','Advance BIT Prepaid','ASSET','DEBIT','INCOME_TAX','CURRENT_TAX','Advance BIT at customs'),
(UUID(),'1133','Deferred Tax Asset','ASSET','DEBIT','INCOME_TAX','DEFERRED_TAX','IAS 12 DTA on deductible temp differences'),
(UUID(),'2150','VAT Payable (Output VAT)','LIABILITY','CREDIT','OPERATING',NULL,'Output VAT collected; remit monthly'),
(UUID(),'2155','TOT Payable','LIABILITY','CREDIT','OPERATING',NULL,'TOT payable monthly'),
(UUID(),'2160','Income Tax Payable (BIT)','LIABILITY','CREDIT','INCOME_TAX','CURRENT_TAX','Annual BIT/CIT payable'),
(UUID(),'2161','PAYE / PIT Payable','LIABILITY','CREDIT','INCOME_TAX','CURRENT_TAX','PAYE deducted from salaries'),
(UUID(),'2162','WHT Payable to MoR','LIABILITY','CREDIT','OPERATING',NULL,'WHT remit monthly'),
(UUID(),'2163','DRRF Levy Payable','LIABILITY','CREDIT','OPERATING',NULL,'DRRF quarterly levy'),
(UUID(),'2164','Pension Payable - Employee','LIABILITY','CREDIT','OPERATING',NULL,'7% pension remit to PFSA'),
(UUID(),'2165','Pension Payable - Employer','LIABILITY','CREDIT','OPERATING',NULL,'11% pension remit to PFSA'),
(UUID(),'2166','Excise Tax Payable','LIABILITY','CREDIT','OPERATING',NULL,'Excise duty payable'),
(UUID(),'2167','Stamp Duty Payable','LIABILITY','CREDIT','OPERATING',NULL,'Stamp duty on contracts'),
(UUID(),'2168','Property Tax Payable','LIABILITY','CREDIT','OPERATING',NULL,'Annual property tax'),
(UUID(),'2169','Customs Duty Payable','LIABILITY','CREDIT','OPERATING',NULL,'Customs duty at clearance'),
(UUID(),'2170','Import Surtax Payable','LIABILITY','CREDIT','OPERATING',NULL,'Import surtax + advance BIT'),
(UUID(),'2171','Capital Gains / Schedule D Payable','LIABILITY','CREDIT','INCOME_TAX','CURRENT_TAX','CGT and Schedule D'),
(UUID(),'2175','Deferred Tax Liability','LIABILITY','CREDIT','INCOME_TAX','DEFERRED_TAX','IAS 12 DTL on taxable temp differences'),
(UUID(),'5410','Excise Tax Expense (COGS)','EXPENSE','DEBIT','OPERATING',NULL,'Excise part of COGS'),
(UUID(),'5420','TOT Expense','EXPENSE','DEBIT','OPERATING',NULL,'TOT operating levy'),
(UUID(),'5430','DRRF Levy Expense','EXPENSE','DEBIT','OPERATING',NULL,'DRRF 1% levy'),
(UUID(),'5440','Non-Resident Service Expense','EXPENSE','DEBIT','OPERATING',NULL,'Gross NR fees; WHT deducted'),
(UUID(),'5450','Rent Expense','EXPENSE','DEBIT','OPERATING',NULL,'Rent; WHT 30% for corporates'),
(UUID(),'5460','Stamp Duty Expense','EXPENSE','DEBIT','OPERATING',NULL,'Stamp duty on contracts'),
(UUID(),'5470','Property Tax Expense','EXPENSE','DEBIT','OPERATING',NULL,'Annual property tax'),
(UUID(),'8100','Income Tax Expense - Current','EXPENSE','DEBIT','INCOME_TAX','CURRENT_TAX','IAS 12.46 current year BIT/CIT'),
(UUID(),'8105','Income Tax Expense - Deferred','EXPENSE','DEBIT','INCOME_TAX','DEFERRED_TAX','IAS 12.46 deferred movement'),
(UUID(),'8110','Capital Gains / Schedule D Expense','EXPENSE','DEBIT','INCOME_TAX','CURRENT_TAX','CGT and Schedule D charges');

SELECT CONCAT('universal_tax_config.sql applied — ', NOW()) AS status;
