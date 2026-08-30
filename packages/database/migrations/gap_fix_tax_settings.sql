-- ============================================================================
-- Gap Fix Migration — Universal Tax Configuration System Settings
-- Run this against your MySQL database for existing installations.
-- Generated for OVDS IFRS (IAS 12) + MoR 2025 Universal Tax update.
--
-- Sources:
--   Proc. 1341/2024 (VAT), Proc. 1395/2025 (WHT/PIT/TOT/DRRF),
--   Proc. 979/2016 (BIT/CIT), Reg. 570/2025 (VAT threshold),
--   Proc. 1268/2023 (Pension), Proc. 1186/2020 (Excise),
--   Proc. 110/1998 (Stamp Duty), IAS 12 (Deferred Tax)
--
-- Safe to re-run: uses INSERT IGNORE so existing custom values are preserved.
-- ============================================================================

-- Phase 1 — VAT
INSERT IGNORE INTO `systemsetting` (`id`, `key`, `value`, `updatedAt`)
  VALUES (UUID(), 'vat_rate',                  '15',       NOW()),
         (UUID(), 'vat_threshold',             '2000000',  NOW());

-- Phase 2 — Turnover Tax (TOT)
INSERT IGNORE INTO `systemsetting` (`id`, `key`, `value`, `updatedAt`)
  VALUES (UUID(), 'tot_goods_rate',            '2',        NOW()),
         (UUID(), 'tot_services_rate',         '10',       NOW());

-- Phase 3–4 — Business Income Tax / Personal Income Tax
INSERT IGNORE INTO `systemsetting` (`id`, `key`, `value`, `updatedAt`)
  VALUES (UUID(), 'bit_rate',                  '30',       NOW()),
         (UUID(), 'mat_rate',                  '2.5',      NOW());

-- Phase 5 — Withholding Tax (2% on goods ≥ ETB 10,000, services ≥ ETB 500)
INSERT IGNORE INTO `systemsetting` (`id`, `key`, `value`, `updatedAt`)
  VALUES (UUID(), 'withholding_rate',          '2',        NOW()),
         (UUID(), 'wht_goods_rate',            '2',        NOW()),
         (UUID(), 'wht_goods_threshold',       '10000',    NOW()),
         (UUID(), 'wht_service_threshold',     '500',      NOW());

-- Phase 6 — DRRF Levy
INSERT IGNORE INTO `systemsetting` (`id`, `key`, `value`, `updatedAt`)
  VALUES (UUID(), 'drrf_rate',                 '1',        NOW()),
         (UUID(), 'drrf_service_rate',         '5',        NOW());

-- Phase 7 — Pension Contributions
INSERT IGNORE INTO `systemsetting` (`id`, `key`, `value`, `updatedAt`)
  VALUES (UUID(), 'pension_employee_rate',     '7',        NOW()),
         (UUID(), 'pension_employer_rate',     '11',       NOW()),
         (UUID(), 'pension_cap_etb',           '15000',    NOW());

-- Phase 9 — Import & Customs
INSERT IGNORE INTO `systemsetting` (`id`, `key`, `value`, `updatedAt`)
  VALUES (UUID(), 'import_surtax_rate',        '10',       NOW()),
         (UUID(), 'advance_bit_import_rate',   '3',        NOW());

-- Phase 10 — Stamp Duty
INSERT IGNORE INTO `systemsetting` (`id`, `key`, `value`, `updatedAt`)
  VALUES (UUID(), 'stamp_duty_rate',           '1',        NOW()),
         (UUID(), 'stamp_duty_min_etb',        '500',      NOW());

-- General / Invoice defaults
INSERT IGNORE INTO `systemsetting` (`id`, `key`, `value`, `updatedAt`)
  VALUES (UUID(), 'fiscal_year_start',         '7',        NOW()),
         (UUID(), 'default_currency',          'ETB',      NOW()),
         (UUID(), 'invoice_vat_enabled',       'true',     NOW()),
         (UUID(), 'invoice_drrf_enabled',      'false',    NOW()),
         (UUID(), 'invoice_wht_enabled',       'false',    NOW()),
         (UUID(), 'invoice_tot_enabled',       'false',    NOW()),
         (UUID(), 'invoice_require_tin',       'false',    NOW()),
         (UUID(), 'invoice_stamp_duty_prompt', 'false',    NOW()),
         (UUID(), 'invoice_show_qr',           'true',     NOW()),
         (UUID(), 'invoice_show_logo',         'true',     NOW()),
         (UUID(), 'invoice_show_bank_details', 'true',     NOW());

-- Correct WHT goods/service seed rate if an old value was previously inserted
-- (Updates only the seed row; does not override any user-customised rates)
UPDATE `systemsetting`
  SET `value` = '2', `updatedAt` = NOW()
  WHERE `key` = 'wht_goods_rate' AND `value` = '3';
UPDATE `systemsetting`
  SET `value` = '500', `updatedAt` = NOW()
  WHERE `key` = 'wht_service_threshold' AND `value` = '3000';

-- Also correct the WHT Goods/Services tax rate record if seeded incorrectly
UPDATE `taxrate`
  SET `rate` = 0.02,
      `description` = '2% WHT on domestic goods payments ≥ ETB 10,000'
  WHERE `name` IN ('WHT — Goods (2%)', 'Withholding Tax - Goods', 'WHT — Services (2%)')
    AND `rate` <> 0.02;

SELECT CONCAT('gap_fix_tax_settings.sql applied — ', NOW()) AS status;
