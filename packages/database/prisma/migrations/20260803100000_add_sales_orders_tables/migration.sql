-- Sales Orders Module Tables
-- Migration: 20260803100000_add_sales_orders_tables
--
-- Adds: sales_order, sales_order_line, sales_order_ship_to_address,
--       dispatch_docket, dispatch_docket_line, delivery_performance,
--       stock_demand_by_order, sales_order_credit_note,
--       sales_order_credit_note_item

-- ── Sales Order header ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `sales_order` (
  `id`                    VARCHAR(36)   NOT NULL PRIMARY KEY,
  `companyId`             VARCHAR(36)   NULL,
  `OrderNumber`           VARCHAR(50)   NOT NULL,
  `CustomerId`            VARCHAR(36)   NULL,
  `CustomerName`          VARCHAR(200)  NULL,
  `SalesType`             VARCHAR(30)   NULL COMMENT 'STANDARD | DIRECT | CONSIGNMENT | TRANSFER',
  `OrderDate`             DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `RequestedDeliveryDate` DATETIME(3)   NULL,
  `CurrencyCode`          VARCHAR(3)    NULL,
  `CurrencyRate`          DECIMAL(18,6) NULL,
  `ShipToAddressText`     VARCHAR(500)  NULL,
  `ShipToWarehouseId`     VARCHAR(36)   NULL,
  `notes`                 LONGTEXT      NULL,
  `CreatedBy`             VARCHAR(36)   NULL,
  `status`                VARCHAR(30)   NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT | CONFIRMED | PARTIALLY_SHIPPED | SHIPPED | DELIVERED | CANCELLED',
  `createdAt`             DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`             DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `sales_order_companyId_idx` (`companyId`),
  INDEX `sales_order_OrderNumber_idx` (`OrderNumber`),
  INDEX `sales_order_status_idx` (`status`),
  INDEX `sales_order_CustomerId_idx` (`CustomerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Sales Order Line items ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `sales_order_line` (
  `id`                VARCHAR(36)   NOT NULL PRIMARY KEY,
  `SalesOrderId`      VARCHAR(36)   NOT NULL,
  `LineNo`            INT           NOT NULL,
  `ItemId`            VARCHAR(36)   NULL,
  `ItemType`          VARCHAR(20)   NULL COMMENT 'GOODS | SERVICES | DIGITAL',
  `description`       VARCHAR(500)  NULL,
  `OrderedQty`        DECIMAL(18,4) NOT NULL DEFAULT 0,
  `InvoicedQty`       DECIMAL(18,4) NOT NULL DEFAULT 0,
  `UnitOfMeasure`     VARCHAR(20)   NULL,
  `SalePriceSnapshot` DECIMAL(18,4) NULL,
  `DiscountType`      VARCHAR(15)   NULL COMMENT 'PERCENTAGE | FIXED',
  `DiscountValue`     DECIMAL(18,4) NULL,
  `OrderedWeight`     DECIMAL(18,4) NULL,
  `OrderedCubic`      DECIMAL(18,4) NULL,
  `createdAt`         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `sales_order_line_SalesOrderId_idx` (`SalesOrderId`),
  INDEX `sales_order_line_ItemId_idx` (`ItemId`),
  CONSTRAINT `sales_order_line_SalesOrderId_fkey`
    FOREIGN KEY (`SalesOrderId`) REFERENCES `sales_order` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Sales Order Ship-to Addresses ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `sales_order_ship_to_address` (
  `id`            VARCHAR(36)   NOT NULL PRIMARY KEY,
  `SalesOrderId`  VARCHAR(36)   NOT NULL,
  `label`         VARCHAR(100)  NULL,
  `addressLine1`  VARCHAR(200)  NULL,
  `addressLine2`  VARCHAR(200)  NULL,
  `city`          VARCHAR(100)  NULL,
  `region`        VARCHAR(100)  NULL,
  `country`       VARCHAR(50)   NULL,
  `postalCode`    VARCHAR(20)   NULL,
  `contactName`   VARCHAR(100)  NULL,
  `contactPhone`  VARCHAR(30)   NULL,
  `isDefault`     TINYINT(1)    NOT NULL DEFAULT 0,
  `createdAt`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `sales_order_ship_to_address_SalesOrderId_idx` (`SalesOrderId`),
  CONSTRAINT `sales_order_ship_to_address_SalesOrderId_fkey`
    FOREIGN KEY (`SalesOrderId`) REFERENCES `sales_order` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Dispatch Docket header ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `dispatch_docket` (
  `id`                      VARCHAR(36)   NOT NULL PRIMARY KEY,
  `SalesOrderId`            VARCHAR(36)   NOT NULL,
  `companyId`               VARCHAR(36)   NULL,
  `DispatchNumber`          VARCHAR(50)   NOT NULL,
  `DispatchDate`            DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `DispatchFromWarehouseId` VARCHAR(36)   NULL,
  `ShipToAddressId`         VARCHAR(36)   NULL,
  `notes`                   LONGTEXT      NULL,
  `CreatedBy`               VARCHAR(36)   NULL,
  `status`                  VARCHAR(30)   NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT | CONFIRMED | POSTED | DELIVERED | CANCELLED',
  `createdAt`               DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`               DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `dispatch_docket_SalesOrderId_idx` (`SalesOrderId`),
  INDEX `dispatch_docket_companyId_idx` (`companyId`),
  INDEX `dispatch_docket_status_idx` (`status`),
  INDEX `dispatch_docket_DispatchNumber_idx` (`DispatchNumber`),
  CONSTRAINT `dispatch_docket_SalesOrderId_fkey`
    FOREIGN KEY (`SalesOrderId`) REFERENCES `sales_order` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Dispatch Docket Line items ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `dispatch_docket_line` (
  `id`                    VARCHAR(36)   NOT NULL PRIMARY KEY,
  `DispatchDocketId`      VARCHAR(36)   NOT NULL,
  `SalesOrderLineId`      VARCHAR(36)   NULL,
  `LineNo`                INT           NOT NULL,
  `ItemId`                VARCHAR(36)   NULL,
  `description`           VARCHAR(500)  NULL,
  `DispatchedQty`         DECIMAL(18,4) NOT NULL DEFAULT 0,
  `OrderedQtyAtDispatch`  DECIMAL(18,4) NULL,
  `VarianceQty`           DECIMAL(18,4) NOT NULL DEFAULT 0,
  `VarianceReason`        VARCHAR(200)  NULL,
  `UnitWeight`            DECIMAL(18,4) NULL,
  `UnitCubic`             DECIMAL(18,4) NULL,
  `companyId`             VARCHAR(36)   NULL,
  `createdAt`             DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`             DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `dispatch_docket_line_DispatchDocketId_idx` (`DispatchDocketId`),
  INDEX `dispatch_docket_line_SalesOrderLineId_idx` (`SalesOrderLineId`),
  INDEX `dispatch_docket_line_ItemId_idx` (`ItemId`),
  CONSTRAINT `dispatch_docket_line_DispatchDocketId_fkey`
    FOREIGN KEY (`DispatchDocketId`) REFERENCES `dispatch_docket` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `dispatch_docket_line_SalesOrderLineId_fkey`
    FOREIGN KEY (`SalesOrderLineId`) REFERENCES `sales_order_line` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Delivery Performance (DIFOT tracking) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS `delivery_performance` (
  `id`                  VARCHAR(36)   NOT NULL PRIMARY KEY,
  `companyId`           VARCHAR(36)   NULL,
  `SalesOrderId`        VARCHAR(36)   NOT NULL,
  `DispatchDocketId`    VARCHAR(36)   NULL,
  `PromisedDeliveryDate` DATETIME(3)  NULL,
  `ActualDeliveryDate`  DATETIME(3)   NULL,
  `IsDeliveredInFull`   TINYINT(1)    NOT NULL DEFAULT 0,
  `IsDeliveredOnTime`   TINYINT(1)    NOT NULL DEFAULT 0,
  `createdAt`           DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`           DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `delivery_performance_SalesOrderId_idx` (`SalesOrderId`),
  INDEX `delivery_performance_companyId_idx` (`companyId`),
  CONSTRAINT `delivery_performance_SalesOrderId_fkey`
    FOREIGN KEY (`SalesOrderId`) REFERENCES `sales_order` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `delivery_performance_DispatchDocketId_fkey`
    FOREIGN KEY (`DispatchDocketId`) REFERENCES `dispatch_docket` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Stock Demand by Order ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `stock_demand_by_order` (
  `id`                    VARCHAR(36)   NOT NULL PRIMARY KEY,
  `companyId`             VARCHAR(36)   NULL,
  `warehouseId`           VARCHAR(36)   NULL,
  `itemId`                VARCHAR(36)   NULL,
  `sourceType`            VARCHAR(20)   NOT NULL DEFAULT 'ORDER' COMMENT 'ORDER | TRANSFER | PURCHASE_RETURN',
  `sourceOrderId`         VARCHAR(36)   NULL,
  `sourceDispatchId`      VARCHAR(36)   NULL,
  `salesOrderId`          VARCHAR(36)   NULL,
  `dispatchDocketId`      VARCHAR(36)   NULL,
  `demandedQty`           DECIMAL(18,4) NOT NULL DEFAULT 0,
  `remainingQtyToInvoice` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `createdAt`             DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`             DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `stock_demand_by_order_companyId_idx` (`companyId`),
  INDEX `stock_demand_by_order_salesOrderId_idx` (`salesOrderId`),
  INDEX `stock_demand_by_order_dispatchDocketId_idx` (`dispatchDocketId`),
  INDEX `stock_demand_by_order_itemId_idx` (`itemId`),
  CONSTRAINT `stock_demand_by_order_salesOrderId_fkey`
    FOREIGN KEY (`salesOrderId`) REFERENCES `sales_order` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `stock_demand_by_order_dispatchDocketId_fkey`
    FOREIGN KEY (`dispatchDocketId`) REFERENCES `dispatch_docket` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Sales Order Credit Note ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `sales_order_credit_note` (
  `id`            VARCHAR(36)   NOT NULL PRIMARY KEY,
  `SalesOrderId`  VARCHAR(36)   NOT NULL,
  `companyId`     VARCHAR(36)   NULL,
  `CreditNoteNo`  VARCHAR(50)   NOT NULL,
  `reason`        VARCHAR(500)  NULL,
  `totalAmount`   DECIMAL(18,2) NOT NULL DEFAULT 0,
  `currencyCode`  VARCHAR(3)    NOT NULL DEFAULT 'ETB',
  `status`        VARCHAR(20)   NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT | APPROVED | APPLIED | CANCELLED',
  `issuedAt`      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `sales_order_credit_note_SalesOrderId_idx` (`SalesOrderId`),
  INDEX `sales_order_credit_note_companyId_idx` (`companyId`),
  CONSTRAINT `sales_order_credit_note_SalesOrderId_fkey`
    FOREIGN KEY (`SalesOrderId`) REFERENCES `sales_order` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Sales Order Credit Note Items ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `sales_order_credit_note_item` (
  `id`                VARCHAR(36)   NOT NULL PRIMARY KEY,
  `CreditNoteId`      VARCHAR(36)   NOT NULL,
  `SalesOrderLineId`  VARCHAR(36)   NULL,
  `description`       VARCHAR(500)  NULL,
  `qty`               DECIMAL(18,4) NOT NULL DEFAULT 0,
  `unitPrice`         DECIMAL(18,4) NOT NULL DEFAULT 0,
  `amount`            DECIMAL(18,2) NOT NULL DEFAULT 0,
  `createdAt`         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `sales_order_credit_note_item_CreditNoteId_idx` (`CreditNoteId`),
  CONSTRAINT `sales_order_credit_note_item_CreditNoteId_fkey`
    FOREIGN KEY (`CreditNoteId`) REFERENCES `sales_order_credit_note` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sales_order_credit_note_item_SalesOrderLineId_fkey`
    FOREIGN KEY (`SalesOrderLineId`) REFERENCES `sales_order_line` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
