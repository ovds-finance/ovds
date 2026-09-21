-- CreateTable
CREATE TABLE `category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `color` VARCHAR(10) NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `category_companyId_idx`(`companyId`),
    UNIQUE INDEX `category_name_type_companyId_key`(`name`, `type`, `companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `currency` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(3) NOT NULL,
    `symbol` VARCHAR(5) NULL,
    `rate` DECIMAL(65, 30) NOT NULL DEFAULT 1.0,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `currency_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `revenue` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `currencyCode` VARCHAR(3) NOT NULL DEFAULT 'ETB',
    `accountId` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NULL,
    `categoryId` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `reference` VARCHAR(100) NULL,
    `companyId` VARCHAR(191) NULL,
    `journalEntryId` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `revenue_companyId_idx`(`companyId`),
    INDEX `revenue_customerId_idx`(`customerId`),
    INDEX `revenue_categoryId_idx`(`categoryId`),
    INDEX `revenue_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `currencyCode` VARCHAR(3) NOT NULL DEFAULT 'ETB',
    `accountId` VARCHAR(191) NULL,
    `vendorId` VARCHAR(191) NULL,
    `categoryId` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `reference` VARCHAR(100) NULL,
    `companyId` VARCHAR(191) NULL,
    `journalEntryId` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `payment_companyId_idx`(`companyId`),
    INDEX `payment_vendorId_idx`(`vendorId`),
    INDEX `payment_categoryId_idx`(`categoryId`),
    INDEX `payment_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `category` ADD CONSTRAINT `category_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `revenue` ADD CONSTRAINT `revenue_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `revenue` ADD CONSTRAINT `revenue_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `revenue` ADD CONSTRAINT `revenue_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `revenue` ADD CONSTRAINT `revenue_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `journalentry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `journalentry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
