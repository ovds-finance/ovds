-- Migration: 20260702000001_add_iot_fiscal_event
--
-- Creates the iot_fiscal_event table — the immutable fiscal audit log for
-- IoT-sourced transactions in the three-tier IoT → AIS → MoR pipeline.
--
-- Legal basis:
--   • MoR fiscal-timestamp requirement: all sales/billing events must carry
--     unalterable, synchronised timestamps to prevent backdating or tax fraud.
--   • The SHA-256 fiscalSignature column makes any post-hoc tampering detectable.
--   • Records in this table feed directly into VAT/TOT period reconciliation
--     and the monthly TaxpayerDeclaration submitted to etax.mor.gov.et.
--
-- Industry contexts stored per record:
--   SMART_VENDING_RETAIL   — smart PoS / telebirr / CBE Birr kiosk transactions
--   LOGISTICS_FLEET        — fuel dispensed, GPS distance → BIT deductible costs
--   MANUFACTURING_AGRI     — weight / yield sensors → COGS for corporate tax
--   ENERGY_UTILITY         — electricity, water, gas metering
--   TELECOM_DIGITAL        — data, airtime (DRRF applicable)
--   GENERAL                — uncategorised

CREATE TABLE IF NOT EXISTS `iot_fiscal_event` (
  `id`               VARCHAR(48)    NOT NULL,
  `deviceId`         VARCHAR(36)    NOT NULL,
  `companyId`        VARCHAR(36)    NOT NULL,
  `billingTriggerId` VARCHAR(36)    NOT NULL,

  -- Monetary amounts (ETB, 2 decimal places per MoR spec)
  `grossAmount`      DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  `taxAmount`        DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  `taxRate`          DECIMAL(6,  4) NOT NULL DEFAULT 0.0000,
  `netPayable`       DECIMAL(18, 2) NOT NULL DEFAULT 0.00,

  -- Tax classification
  -- VAT_15            — 15% VAT (Proclamation No. 1341/2024), company turnover ≥ ETB 2M
  -- TOT_GOODS_2       — 2% TOT on goods (Proclamation No. 1395/2025)
  -- TOT_SERVICES_10   — 10% TOT on services (Proclamation No. 1395/2025)
  -- EXEMPT            — tax-exempt transaction
  `taxType`          VARCHAR(30)    NOT NULL DEFAULT 'EXEMPT',

  -- Industry context for COGS / deduction classification
  `industryContext`  VARCHAR(30)    NOT NULL DEFAULT 'GENERAL',

  -- Immutable fiscal integrity fields
  -- fiscalSignature: sha256-<hex> of (deviceId + billingTriggerId + grossAmount + recordedAt)
  -- Any mismatch signals tampering — MoR audit-trail requirement
  `fiscalSignature`  VARCHAR(200)   NOT NULL,

  -- recordedAt: set by the server at ingestion time (UTC).
  -- Must NOT be updatable — prevents backdating.
  `recordedAt`       DATETIME(3)    NOT NULL,

  -- Gregorian period YYYY-MM — links to VatFiling / TotFiling for period-end filing
  `period`           VARCHAR(7)     NOT NULL,

  `createdAt`        DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `iot_fiscal_event_companyId_idx`        (`companyId`),
  INDEX `iot_fiscal_event_period_idx`           (`period`),
  INDEX `iot_fiscal_event_deviceId_idx`         (`deviceId`),
  INDEX `iot_fiscal_event_billingTriggerId_idx` (`billingTriggerId`),
  INDEX `iot_fiscal_event_taxType_idx`          (`taxType`),
  INDEX `iot_fiscal_event_industryContext_idx`  (`industryContext`)

) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  COMMENT='Immutable IoT fiscal event log — MoR audit trail (Proclamation No. 1341/2024)';

-- NOTE: recordedAt intentionally has NO DEFAULT and NO ON UPDATE clause.
--       The application sets it explicitly at event creation time.
--       There is no UPDATE path for this table — records are append-only.
