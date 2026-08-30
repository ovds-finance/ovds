-- Migration: add_tot_filing
-- Adds TotFiling model for Turnover Tax (TOT) — Category B taxpayers
-- Proclamation No. 1395/2025: 2% on goods, 10% on services
-- Due: 30th of the following month

CREATE TABLE `totfiling` (
    `id`             VARCHAR(191) NOT NULL,
    `period`         VARCHAR(7)   NOT NULL,
    `goodsAmount`    DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `servicesAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `totGoods`       DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `totServices`    DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `netPayable`     DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `paid`           DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `status`         VARCHAR(30)  NOT NULL DEFAULT 'DRAFT',
    `filedAt`        DATETIME(3)  NULL,
    `dueDate`        DATETIME(3)  NULL,
    `eTaxReference`  VARCHAR(100) NULL,
    `notes`          TEXT         NULL,
    `companyId`      VARCHAR(191) NULL,
    `createdAt`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `totfiling_companyId_period_key`(`companyId`, `period`),
    INDEX `totfiling_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `totfiling` ADD CONSTRAINT `totfiling_companyId_fkey`
    FOREIGN KEY (`companyId`) REFERENCES `company`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
