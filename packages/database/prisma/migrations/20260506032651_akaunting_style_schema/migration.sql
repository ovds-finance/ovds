-- CreateTable
CREATE TABLE `financial_statement_template` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NULL,
    `isIfrs` BOOLEAN NOT NULL DEFAULT true,
    `templateJson` LONGTEXT NOT NULL,
    `previewHtml` LONGTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `financial_statement_template_companyId_idx`(`companyId`),
    UNIQUE INDEX `financial_statement_template_companyId_type_period_key`(`companyId`, `type`, `period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fund_transfer` (
    `id` VARCHAR(191) NOT NULL,
    `fromAccountId` VARCHAR(191) NULL,
    `toAccountId` VARCHAR(191) NULL,
    `fromAccount` VARCHAR(200) NOT NULL,
    `toAccount` VARCHAR(200) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'ETB',
    `type` VARCHAR(191) NOT NULL DEFAULT 'INTERNAL',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `reference` VARCHAR(200) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fund_transfer_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expense_claim` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'ETB',
    `category` VARCHAR(100) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `description` TEXT NULL,
    `receiptUrl` VARCHAR(500) NULL,
    `submittedBy` VARCHAR(100) NULL,
    `approvedBy` VARCHAR(100) NULL,
    `approvedAt` DATETIME(3) NULL,
    `companyId` VARCHAR(191) NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `expense_claim_status_idx`(`status`),
    INDEX `expense_claim_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_order` (
    `id` VARCHAR(191) NOT NULL,
    `poNumber` VARCHAR(100) NOT NULL,
    `vendorId` VARCHAR(191) NULL,
    `vendorName` VARCHAR(200) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `totalAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'ETB',
    `expectedDelivery` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `items` LONGTEXT NULL,
    `companyId` VARCHAR(191) NULL,
    `createdBy` VARCHAR(100) NULL,
    `approvedBy` VARCHAR(100) NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `purchase_order_poNumber_key`(`poNumber`),
    INDEX `purchase_order_status_idx`(`status`),
    INDEX `purchase_order_companyId_idx`(`companyId`),
    INDEX `purchase_order_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fixed_asset` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `purchaseDate` DATETIME(3) NOT NULL,
    `purchaseCost` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `salvageValue` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `usefulLifeYears` INTEGER NOT NULL DEFAULT 1,
    `depreciationMethod` VARCHAR(191) NOT NULL DEFAULT 'STRAIGHT_LINE',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `location` VARCHAR(200) NULL,
    `serialNumber` VARCHAR(100) NULL,
    `companyId` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fixed_asset_status_idx`(`status`),
    INDEX `fixed_asset_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE') NOT NULL,
    `category` ENUM('CASH', 'BANK', 'ACCOUNTS_RECEIVABLE', 'ACCOUNTS_PAYABLE', 'INVENTORY', 'FIXED_ASSET', 'CURRENT_ASSET', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY', 'EQUITY', 'REVENUE', 'OTHER_INCOME', 'OPERATING_EXPENSE', 'COST_OF_GOODS_SOLD', 'OTHER_EXPENSE') NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `parentId` VARCHAR(191) NULL,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Account_code_key`(`code`),
    INDEX `account_companyId_idx`(`companyId`),
    INDEX `account_parentId_fkey`(`parentId`),
    UNIQUE INDEX `account_code_companyId_key`(`code`, `companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admincreatedmenuitem` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(200) NOT NULL,
    `path` VARCHAR(500) NOT NULL,
    `to` VARCHAR(500) NULL,
    `icon` VARCHAR(100) NULL,
    `parentId` VARCHAR(191) NULL,
    `parentKey` VARCHAR(100) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `order` INTEGER NOT NULL DEFAULT 0,
    `adminId` VARCHAR(100) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `roles` VARCHAR(500) NULL,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AdminCreatedMenuItem_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `app` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `version` VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    `category` VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isFree` BOOLEAN NOT NULL DEFAULT true,
    `price` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `rating` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `downloads` INTEGER NOT NULL DEFAULT 0,
    `developer` VARCHAR(200) NULL,
    `downloadUrl` VARCHAR(500) NULL,
    `iconUrl` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `App_name_key`(`name`),
    UNIQUE INDEX `App_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `arrearconfig` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `arrearTypeId` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NULL,
    `fromDate` DATETIME(3) NOT NULL,
    `toDate` DATETIME(3) NOT NULL,
    `remarks` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'GENERATED',
    `amount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `paymentType` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ArrearConfig_name_key`(`name`),
    INDEX `ArrearConfig_arrearTypeId_idx`(`arrearTypeId`),
    INDEX `arrearconfig_employeeId_fkey`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `arreartype` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ArrearType_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `checkIn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `checkOut` DATETIME(3) NULL,
    `method` ENUM('MANUAL', 'BIOMETRIC', 'KIOSK', 'MOBILE', 'QR_CODE', 'SYSTEM') NOT NULL,
    `status` ENUM('PRESENT', 'LATE', 'ABSENT', 'HALF_DAY') NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `deviceInfo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedBy` VARCHAR(191) NULL,
    `overtimeHours` DOUBLE NULL,

    INDEX `Attendance_checkIn_idx`(`checkIn`),
    INDEX `Attendance_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditcomment` (
    `id` VARCHAR(191) NOT NULL,
    `engagementId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `authorName` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditComment_engagementId_idx`(`engagementId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditengagement` (
    `id` VARCHAR(191) NOT NULL,
    `firmId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(300) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'EXTERNAL',
    `auditType` VARCHAR(100) NULL,
    `riskLevel` VARCHAR(50) NULL,
    `scope` TEXT NULL,
    `notes` TEXT NULL,
    `budget` DECIMAL(65, 30) NULL,
    `actualCost` DECIMAL(65, 30) NULL,
    `reportSummary` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PLANNED',
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditEngagement_companyId_idx`(`companyId`),
    INDEX `AuditEngagement_firmId_idx`(`firmId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditfinding` (
    `id` VARCHAR(191) NOT NULL,
    `engagementId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(300) NOT NULL,
    `description` TEXT NULL,
    `severity` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `assignedTo` VARCHAR(100) NULL,
    `dueDate` DATETIME(3) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditFinding_engagementId_idx`(`engagementId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditfirm` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `licenseNo` VARCHAR(100) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `contactPerson` VARCHAR(200) NULL,
    `industry` VARCHAR(100) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `rating` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditFirm_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditlog` (
    `id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `details` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_companyId_idx`(`companyId`),
    INDEX `AuditLog_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bankaccount` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'ETB',
    `openingBalance` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `balance` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `accountId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `companyId` VARCHAR(191) NULL,

    INDEX `BankAccount_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banktransaction` (
    `id` VARCHAR(191) NOT NULL,
    `bankAccountId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `reference` VARCHAR(200) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `journalEntryId` VARCHAR(191) NULL,
    `bankName` VARCHAR(100) NULL,
    `counterparty` VARCHAR(200) NULL,
    `matchMethod` VARCHAR(30) NULL,
    `matchScore` INTEGER NOT NULL DEFAULT 0,
    `matchedBillId` VARCHAR(36) NULL,
    `matchedInvoiceId` VARCHAR(36) NULL,
    `notes` TEXT NULL,
    `qrCode` TEXT NULL,
    `telecomRef` VARCHAR(100) NULL,
    `type` VARCHAR(10) NOT NULL DEFAULT 'CREDIT',
    `voucherCode` VARCHAR(100) NULL,

    INDEX `BankTransaction_date_idx`(`date`),
    INDEX `BankTransaction_reference_idx`(`reference`),
    INDEX `BankTransaction_status_idx`(`status`),
    INDEX `BankTransaction_telecomRef_idx`(`telecomRef`),
    INDEX `banktransaction_bankAccountId_fkey`(`bankAccountId`),
    INDEX `banktransaction_journalEntryId_fkey`(`journalEntryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bill` (
    `id` VARCHAR(191) NOT NULL,
    `billNumber` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `dueDate` DATETIME(3) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `vatAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `total` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `accountId` VARCHAR(191) NULL,
    `journalEntryId` VARCHAR(36) NULL,
    `notes` TEXT NULL,
    `vendorId` VARCHAR(191) NULL,
    `vatRate` DECIMAL(65, 30) NULL,
    `vendorName` VARCHAR(200) NULL,
    `vendorTin` VARCHAR(15) NULL,
    `whtApplicable` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Bill_billNumber_key`(`billNumber`),
    INDEX `Bill_companyId_idx`(`companyId`),
    INDEX `Bill_dueDate_idx`(`dueDate`),
    INDEX `Bill_status_idx`(`status`),
    INDEX `bill_vendorId_fkey`(`vendorId`),
    INDEX `bill_journalEntryId_idx`(`journalEntryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `billitem` (
    `id` VARCHAR(191) NOT NULL,
    `billId` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NULL,
    `companyId` VARCHAR(191) NULL,
    `description` VARCHAR(500) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unitPrice` DECIMAL(65, 30) NOT NULL,
    `vatRate` DECIMAL(65, 30) NOT NULL DEFAULT 15.000000000000000000000000000000,
    `vatAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `totalAmount` DECIMAL(65, 30) NOT NULL,

    INDEX `BillItem_billId_idx`(`billId`),
    INDEX `BillItem_itemId_idx`(`itemId`),
    INDEX `billitem_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `biometricdata` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('FINGERPRINT', 'FACE', 'IRIS', 'CARD') NOT NULL,
    `template` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `registeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BiometricData_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `businessloan` (
    `id` VARCHAR(191) NOT NULL,
    `loanNumber` VARCHAR(100) NOT NULL,
    `bankName` VARCHAR(200) NOT NULL,
    `loanType` ENUM('TERM_LOAN', 'OVERDRAFT', 'WORKING_CAPITAL', 'EQUIPMENT_FINANCING', 'MORTGAGE', 'OTHER') NOT NULL DEFAULT 'TERM_LOAN',
    `status` ENUM('APPLIED', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED', 'ACTIVE', 'CLOSED', 'REJECTED') NOT NULL DEFAULT 'APPLIED',
    `appliedAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `approvedAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `disbursedAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `outstandingBalance` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `interestRate` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `applicationDate` DATETIME(3) NULL,
    `approvalDate` DATETIME(3) NULL,
    `disbursementDate` DATETIME(3) NULL,
    `maturityDate` DATETIME(3) NULL,
    `purpose` TEXT NULL,
    `collateral` TEXT NULL,
    `partnershipId` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NULL,
    `organizationStructureScore` INTEGER NOT NULL DEFAULT 0,
    `customerRelationshipScore` INTEGER NOT NULL DEFAULT 0,
    `financialTransparencyScore` INTEGER NOT NULL DEFAULT 0,
    `overallCreditScore` INTEGER NOT NULL DEFAULT 0,
    `monthlyInstallment` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `totalRepaid` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `nextPaymentDate` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `kycStatus` VARCHAR(20) NULL,
    `kycVerifiedAt` DATETIME(3) NULL,
    `personalGuarantee` BOOLEAN NOT NULL DEFAULT false,
    `guarantorName` VARCHAR(200) NULL,
    `guarantorTin` VARCHAR(50) NULL,
    `amlRiskLevel` VARCHAR(20) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BusinessLoan_loanNumber_key`(`loanNumber`),
    INDEX `BusinessLoan_customerId_idx`(`customerId`),
    INDEX `BusinessLoan_partnershipId_idx`(`partnershipId`),
    INDEX `BusinessLoan_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cashforecast` (
    `id` VARCHAR(191) NOT NULL,
    `period` VARCHAR(20) NOT NULL,
    `inflows` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `outflows` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `netCash` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `projected` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `low` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `high` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `confidence` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `notes` TEXT NULL,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CashForecast_period_key`(`period`),
    INDEX `CashForecast_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `collectioncase` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NULL,
    `amount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `stage` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `notes` TEXT NULL,
    `assignedTo` VARCHAR(100) NULL,
    `promiseDate` DATETIME(3) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CollectionCase_companyId_idx`(`companyId`),
    INDEX `CollectionCase_customerId_idx`(`customerId`),
    INDEX `CollectionCase_invoiceId_idx`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('MANUFACTURING', 'LARGE_ENTERPRISE', 'MEDIUM_ENTERPRISE', 'SMALL_BUSINESS', 'FREELANCER', 'GOVERNMENT') NOT NULL,
    `settings` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ifrsConfig` LONGTEXT NULL,
    `autoUpdate` BOOLEAN NOT NULL DEFAULT false,
    `currentVersion` VARCHAR(191) NULL DEFAULT '2.0.0',
    `environment` ENUM('STAGING', 'PRODUCTION', 'DEVELOPMENT') NOT NULL DEFAULT 'PRODUCTION',

    UNIQUE INDEX `Company_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `release` (
    `id` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `changelog` TEXT NULL,
    `isMandatory` BOOLEAN NOT NULL DEFAULT false,
    `releasedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('DRAFT', 'RELEASED', 'REVOKED') NOT NULL DEFAULT 'RELEASED',
    `type` ENUM('STAGING', 'PRODUCTION') NOT NULL DEFAULT 'PRODUCTION',

    UNIQUE INDEX `release_version_key`(`version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feature_flag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `feature_flag_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_feature_flag` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `flagId` VARCHAR(191) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT false,

    INDEX `company_feature_flag_flagId_fkey`(`flagId`),
    UNIQUE INDEX `company_feature_flag_companyId_flagId_key`(`companyId`, `flagId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_release` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `status` ENUM('AVAILABLE', 'APPLIED', 'SKIPPED', 'FAILED') NOT NULL DEFAULT 'AVAILABLE',
    `appliedAt` DATETIME(3) NULL,

    INDEX `company_release_releaseId_fkey`(`releaseId`),
    UNIQUE INDEX `company_release_companyId_releaseId_key`(`companyId`, `releaseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credithold` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `reason` TEXT NULL,
    `heldBy` VARCHAR(100) NULL,
    `heldAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `releasedAt` DATETIME(3) NULL,
    `companyId` VARCHAR(191) NULL,

    INDEX `CreditHold_companyId_idx`(`companyId`),
    INDEX `CreditHold_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(200) NULL,
    `phone` VARCHAR(50) NULL,
    `address` VARCHAR(500) NULL,
    `tin` VARCHAR(50) NULL,
    `companyId` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `paymentTerms` VARCHAR(20) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creditScore` INTEGER NULL,
    `kycStatus` VARCHAR(20) NULL,
    `kycVerifiedAt` DATETIME(3) NULL,
    `nationalId` VARCHAR(50) NULL,
    `businessType` VARCHAR(50) NULL,
    `paymentCurrency` VARCHAR(10) NULL DEFAULT 'ETB',
    `creditLimit` DECIMAL(18, 2) NULL,
    `riskLevel` VARCHAR(20) NULL DEFAULT 'MEDIUM',
    `vatNumber` VARCHAR(50) NULL,

    INDEX `Customer_companyId_idx`(`companyId`),
    INDEX `Customer_kycStatus_idx`(`kycStatus`),
    UNIQUE INDEX `Customer_name_companyId_key`(`name`, `companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customerinteraction` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `summary` TEXT NOT NULL,
    `outcome` VARCHAR(200) NULL,
    `performedBy` VARCHAR(100) NULL,
    `interactedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CustomerInteraction_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customerloyalty` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `currentTier` ENUM('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND') NOT NULL DEFAULT 'BRONZE',
    `tierConfigId` VARCHAR(191) NULL,
    `totalPoints` BIGINT NOT NULL DEFAULT 0,
    `lifetimePoints` BIGINT NOT NULL DEFAULT 0,
    `balance` BIGINT NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CustomerLoyalty_customerId_key`(`customerId`),
    INDEX `CustomerLoyalty_currentTier_idx`(`currentTier`),
    INDEX `CustomerLoyalty_customerId_idx`(`customerId`),
    INDEX `CustomerLoyalty_tierConfigId_fkey`(`tierConfigId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deduction` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NULL,
    `invoiceId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'OTHER',
    `reason` VARCHAR(200) NULL,
    `amount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `year` INTEGER NOT NULL DEFAULT 0,
    `month` INTEGER NOT NULL DEFAULT 0,
    `notes` VARCHAR(500) NULL,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Deduction_companyId_idx`(`companyId`),
    INDEX `Deduction_employeeId_idx`(`employeeId`),
    INDEX `Deduction_invoiceId_idx`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `department` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,

    UNIQUE INDEX `Department_name_key`(`name`),
    INDEX `Department_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disasterfundauditlog` (
    `id` VARCHAR(191) NOT NULL,
    `contributionId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(60) NOT NULL,
    `fromStatus` VARCHAR(20) NULL,
    `toStatus` VARCHAR(20) NULL,
    `performedBy` VARCHAR(100) NULL,
    `detail` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DisasterFundAuditLog_contributionId_idx`(`contributionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disasterfundcontribution` (
    `id` VARCHAR(191) NOT NULL,
    `category` ENUM('LOAN_VALUE', 'INSURANCE_PREMIUM', 'SERVICE_FEES', 'AIRTIME_SALES', 'TICKET_SALES', 'ANNUAL_SALES_REVENUE', 'FUEL_SALES', 'TOBACCO_ALCOHOL', 'GOVERNMENT_SERVICES', 'GOVERNMENT_BUDGET', 'SALARY_CONTRIBUTION', 'CONTRABAND_PROCEEDS', 'TELECOM_DIGITAL', 'DIVIDEND', 'OTHER') NOT NULL,
    `description` VARCHAR(500) NULL,
    `baseAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `levyAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `period` VARCHAR(20) NOT NULL,
    `status` ENUM('PENDING', 'REMITTED', 'OVERDUE', 'PAID', 'ARCHIVED') NOT NULL DEFAULT 'PENDING',
    `remittedAt` DATETIME(3) NULL,
    `dueDate` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DisasterFundContribution_category_idx`(`category`),
    INDEX `DisasterFundContribution_period_idx`(`period`),
    INDEX `DisasterFundContribution_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disasterfundnote` (
    `id` VARCHAR(191) NOT NULL,
    `contributionId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `authorName` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DisasterFundNote_contributionId_idx`(`contributionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disasterfundremittance` (
    `id` VARCHAR(191) NOT NULL,
    `contributionId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `bankName` VARCHAR(100) NULL,
    `referenceNo` VARCHAR(100) NULL,
    `remittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `remittedBy` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DisasterFundRemittance_contributionId_idx`(`contributionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disasterfundreport` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `period` VARCHAR(20) NULL,
    `year` INTEGER NULL,
    `status` VARCHAR(20) NULL,
    `totalLevy` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `totalRemitted` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `totalPending` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `totalOverdue` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `recordCount` INTEGER NOT NULL DEFAULT 0,
    `generatedBy` VARCHAR(100) NULL,
    `snapshotJson` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DisasterFundReport_year_idx`(`year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disasterfundschedule` (
    `id` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `quarter` INTEGER NOT NULL,
    `category` VARCHAR(60) NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `estimatedLevy` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `status` VARCHAR(191) NOT NULL DEFAULT 'UPCOMING',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DisasterFundSchedule_year_quarter_idx`(`year`, `quarter`),
    UNIQUE INDEX `DisasterFundSchedule_year_quarter_category_key`(`year`, `quarter`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disasterfundtarget` (
    `id` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `category` VARCHAR(60) NOT NULL,
    `targetAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DisasterFundTarget_year_idx`(`year`),
    UNIQUE INDEX `DisasterFundTarget_year_category_key`(`year`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `shiftId` VARCHAR(191) NULL,
    `baseSalary` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `hourlyRate` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `monthlyDeductions` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `leaveEntitlement` INTEGER NOT NULL DEFAULT 22,
    `employmentNature` VARCHAR(191) NOT NULL DEFAULT 'Permanent',
    `cadre` VARCHAR(191) NOT NULL DEFAULT 'Non-Teaching',
    `designation` VARCHAR(191) NULL,
    `dateOfNextIncrement` DATETIME(3) NULL,
    `employeeContribution` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `employerContribution` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `employerPensionRate` DECIMAL(65, 30) NOT NULL DEFAULT 11.000000000000000000000000000000,
    `incomeTaxRate` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `loanBalance` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `loanMonthlyDeduction` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `pensionRate` DECIMAL(65, 30) NOT NULL DEFAULT 7.000000000000000000000000000000,
    `accountNumber` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `dateOfSuperannuation` DATETIME(3) NULL,
    `ifscCode` VARCHAR(191) NULL,
    `payrollStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_CONFIGURED',
    `pfAccountNumber` VARCHAR(191) NULL,
    `pfEmployeeRate` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `pfEmployerRate` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `pfSubscriptionType` VARCHAR(191) NULL,
    `pfmsNumber` VARCHAR(191) NULL,
    `businessType` ENUM('MANUFACTURING', 'LARGE_ENTERPRISE', 'MEDIUM_ENTERPRISE', 'SMALL_BUSINESS', 'FREELANCER', 'GOVERNMENT') NULL,
    `companyId` VARCHAR(191) NULL,
    `lastTransferDate` DATETIME(3) NULL,
    `subsidiary` VARCHAR(191) NULL,
    `transferReason` VARCHAR(191) NULL,
    `phone` VARCHAR(50) NULL,
    `userId` VARCHAR(191) NULL,

    UNIQUE INDEX `Employee_email_key`(`email`),
    UNIQUE INDEX `Employee_employeeId_key`(`employeeId`),
    UNIQUE INDEX `employee_userId_key`(`userId`),
    INDEX `Employee_companyId_idx`(`companyId`),
    INDEX `Employee_departmentId_idx`(`departmentId`),
    INDEX `Employee_shiftId_idx`(`shiftId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `financialcycle` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startMonth` INTEGER NOT NULL,
    `startYear` INTEGER NOT NULL,
    `endMonth` INTEGER NOT NULL,
    `endYear` INTEGER NOT NULL,
    `numberOfIncrements` INTEGER NOT NULL DEFAULT 1,
    `incrementInterval` INTEGER NOT NULL DEFAULT 12,
    `incrementPercentage` DECIMAL(65, 30) NOT NULL DEFAULT 5.000000000000000000000000000000,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FinancialCycle_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fraudlog` (
    `id` VARCHAR(191) NOT NULL,
    `customerLoyaltyId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `fraudScore` DOUBLE NOT NULL,
    `decision` ENUM('OK', 'SUSPECT', 'BLOCKED', 'REVIEW') NOT NULL,
    `rulesTriggered` VARCHAR(191) NULL,
    `aiModel` VARCHAR(100) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FraudLog_customerLoyaltyId_idx`(`customerLoyaltyId`),
    INDEX `FraudLog_decision_idx`(`decision`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `holiday` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `isAnnual` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Holiday_date_key`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `incometaxfiling` (
    `id` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `fiscalYear` INTEGER NOT NULL,
    `netProfit` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `taxRate` DECIMAL(65, 30) NOT NULL DEFAULT 30.000000000000000000000000000000,
    `taxPayable` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `taxableIncome` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `paid` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `balanceDue` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `filedAt` DATETIME(3) NULL,
    `dueDate` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `IncomeTaxFiling_fiscalYear_key`(`fiscalYear`),
    INDEX `IncomeTaxFiling_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `intercompanytransaction` (
    `id` VARCHAR(191) NOT NULL,
    `fromCompanyId` VARCHAR(191) NOT NULL,
    `toCompanyId` VARCHAR(191) NOT NULL,
    `journalEntryId` VARCHAR(191) NULL,
    `amount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `type` VARCHAR(191) NOT NULL DEFAULT 'TRANSFER',
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fxDifferenceId` VARCHAR(191) NULL,

    INDEX `IntercompanyTransaction_fromCompanyId_idx`(`fromCompanyId`),
    INDEX `IntercompanyTransaction_fxDifferenceId_idx`(`fxDifferenceId`),
    INDEX `IntercompanyTransaction_journalEntryId_idx`(`journalEntryId`),
    INDEX `IntercompanyTransaction_toCompanyId_idx`(`toCompanyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `investment` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `investorName` VARCHAR(200) NOT NULL,
    `investorType` VARCHAR(191) NOT NULL DEFAULT 'PRIVATE',
    `type` ENUM('EQUITY', 'DEBT', 'GRANT', 'VENTURE_CAPITAL', 'ANGEL', 'GOVERNMENT', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `status` ENUM('PROSPECTING', 'NEGOTIATING', 'COMMITTED', 'ACTIVE', 'EXITED') NOT NULL DEFAULT 'PROSPECTING',
    `amount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `equityPct` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `expectedReturn` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `commitmentDate` DATETIME(3) NULL,
    `startDate` DATETIME(3) NULL,
    `exitDate` DATETIME(3) NULL,
    `partnershipId` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NULL,
    `investmentPurpose` TEXT NULL,
    `dueDiligenceNotes` TEXT NULL,
    `regulatoryApproval` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Investment_partnershipId_idx`(`partnershipId`),
    INDEX `Investment_status_idx`(`status`),
    INDEX `investment_customerId_fkey`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `vatAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `qrData` TEXT NULL,
    `journalEntryId` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATETIME(3) NULL,
    `paymentSource` VARCHAR(191) NULL,
    `telecomReceiptRef` VARCHAR(100) NULL,
    `telecomAmount` DECIMAL(65, 30) NULL,
    `telecomPaidAt` DATETIME(3) NULL,
    `telecomRawData` TEXT NULL,
    `bankName` VARCHAR(100) NULL,
    `bankAccountNo` VARCHAR(100) NULL,
    `bankQrRawData` TEXT NULL,
    `notes` TEXT NULL,
    `receiptImageData` LONGTEXT NULL,
    `bankSlipImageData` LONGTEXT NULL,
    `customerEmail` VARCHAR(200) NULL,
    `subtotal` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `discountAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `sentAt` DATETIME(3) NULL,
    `isRecurring` BOOLEAN NOT NULL DEFAULT false,
    `recurringInterval` VARCHAR(20) NULL,
    `recurringNextDate` DATETIME(3) NULL,
    `recurringParentId` VARCHAR(191) NULL,
    `customerPhone` VARCHAR(50) NULL,
    `customerAddress` VARCHAR(500) NULL,
    `customerTin` VARCHAR(50) NULL,
    `scheduledSendAt` DATETIME(3) NULL,
    `paymentTerms` VARCHAR(20) NULL,
    `invoiceDiscount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `lateInterestRate` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `customerNotes` TEXT NULL,
    `shareToken` VARCHAR(191) NULL,
    `docType` VARCHAR(191) NOT NULL DEFAULT 'INVOICE',
    `ifrs15DisclosureNotes` TEXT NULL,
    `ifrs15Step1Complete` BOOLEAN NOT NULL DEFAULT false,
    `ifrs15Step2Complete` BOOLEAN NOT NULL DEFAULT false,
    `ifrs15Step3Complete` BOOLEAN NOT NULL DEFAULT false,
    `ifrs15Step4Complete` BOOLEAN NOT NULL DEFAULT false,
    `ifrs15Step5Complete` BOOLEAN NOT NULL DEFAULT false,
    `ifrsContingency` VARCHAR(50) NULL,
    `ifrsContractRef` VARCHAR(100) NULL,
    `ifrsCreditRisk` VARCHAR(20) NULL,
    `ifrsEclProvision` DECIMAL(65, 30) NULL,
    `ifrsFunctionalCurrency` VARCHAR(191) NOT NULL DEFAULT 'ETB',
    `ifrsHasWarranty` BOOLEAN NOT NULL DEFAULT false,
    `ifrsMeasurementCategory` VARCHAR(50) NULL,
    `ifrsPerformanceObligation` VARCHAR(500) NULL,
    `ifrsReceivableClass` VARCHAR(50) NULL,
    `ifrsRecognitionTiming` VARCHAR(100) NULL,
    `ifrsVariableConsideration` VARCHAR(50) NULL,
    `ifrsWarrantyProvision` DECIMAL(65, 30) NULL,
    `category` VARCHAR(100) NULL,
    `discountLocation` VARCHAR(191) NOT NULL DEFAULT 'TOTAL',
    `discountType` VARCHAR(191) NOT NULL DEFAULT 'FIXED',
    `discountValue` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `footer` TEXT NULL,
    `ingestionSource` VARCHAR(50) NULL,
    `ocrMetadata` LONGTEXT NULL,

    UNIQUE INDEX `Invoice_invoiceNumber_key`(`invoiceNumber`),
    UNIQUE INDEX `Invoice_shareToken_key`(`shareToken`),
    INDEX `Invoice_companyId_idx`(`companyId`),
    INDEX `Invoice_customerName_idx`(`customerName`),
    INDEX `Invoice_date_idx`(`date`),
    INDEX `Invoice_dueDate_idx`(`dueDate`),
    INDEX `Invoice_recurringNextDate_idx`(`recurringNextDate`),
    INDEX `Invoice_recurringParentId_idx`(`recurringParentId`),
    INDEX `Invoice_scheduledSendAt_idx`(`scheduledSendAt`),
    INDEX `Invoice_shareToken_idx`(`shareToken`),
    INDEX `Invoice_status_idx`(`status`),
    INDEX `invoice_journalEntryId_idx`(`journalEntryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoiceactivity` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `detail` VARCHAR(500) NULL,
    `performedBy` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InvoiceActivity_invoiceId_idx`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoiceitem` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `price` DECIMAL(65, 30) NOT NULL,
    `discount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `description` VARCHAR(500) NULL,
    `discountType` VARCHAR(191) NOT NULL DEFAULT 'FIXED',
    `discountValue` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,

    INDEX `InvoiceItem_invoiceId_idx`(`invoiceId`),
    INDEX `InvoiceItem_itemId_idx`(`itemId`),
    INDEX `invoiceitem_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoicepayment` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `method` VARCHAR(191) NOT NULL DEFAULT 'CASH',
    `reference` VARCHAR(200) NULL,
    `notes` VARCHAR(500) NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paymentSource` VARCHAR(30) NULL,
    `orderNo` VARCHAR(50) NULL,
    `orderType` VARCHAR(30) NULL,
    `mcc` VARCHAR(10) NULL,
    `mccDescription` VARCHAR(100) NULL,
    `qrType` VARCHAR(10) NULL,
    `tinValidated` BOOLEAN NOT NULL DEFAULT false,
    `isDuplicate` BOOLEAN NOT NULL DEFAULT false,
    `telecomRef` VARCHAR(100) NULL,
    `bankName` VARCHAR(100) NULL,
    `archType` VARCHAR(30) NULL,
    `bankAccountName` VARCHAR(100) NULL,
    `interactionType` VARCHAR(30) NULL,
    `processType` VARCHAR(30) NULL,
    `journalEntryId` VARCHAR(36) NULL,

    INDEX `InvoicePayment_invoiceId_idx`(`invoiceId`),
    INDEX `InvoicePayment_reference_idx`(`reference`),
    INDEX `InvoicePayment_telecomRef_idx`(`telecomRef`),
    INDEX `invoicepayment_journalEntryId_idx`(`journalEntryId`),
    INDEX `invoicepayment_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `billpayment` (
    `id` VARCHAR(191) NOT NULL,
    `billId` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `method` VARCHAR(191) NOT NULL DEFAULT 'CASH',
    `reference` VARCHAR(200) NULL,
    `notes` VARCHAR(500) NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `journalEntryId` VARCHAR(36) NULL,

    INDEX `billpayment_billId_idx`(`billId`),
    INDEX `billpayment_journalEntryId_idx`(`journalEntryId`),
    INDEX `billpayment_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `price` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `vatRate` DECIMAL(65, 30) NOT NULL DEFAULT 15.000000000000000000000000000000,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reorderLevel` INTEGER NOT NULL DEFAULT 5,
    `costPrice` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `description` TEXT NULL,
    `itemType` VARCHAR(20) NOT NULL DEFAULT 'PRODUCT',
    `groupId` VARCHAR(191) NULL,
    `warehouseId` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(500) NULL,
    `barcode` VARCHAR(100) NULL,
    `unit` VARCHAR(30) NULL DEFAULT 'UNIT',
    `minOrderQty` INTEGER NOT NULL DEFAULT 1,
    `maxOrderQty` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Item_code_key`(`code`),
    INDEX `Item_companyId_fkey`(`companyId`),
    INDEX `Item_groupId_idx`(`groupId`),
    INDEX `Item_warehouseId_idx`(`warehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itemgroup` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `companyId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ItemGroup_companyId_idx`(`companyId`),
    UNIQUE INDEX `itemgroup_name_companyId_key`(`name`, `companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itemvariant` (
    `id` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `sku` VARCHAR(100) NOT NULL,
    `price` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `costPrice` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `attributes` TEXT NULL,
    `imageUrl` VARCHAR(500) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `itemvariant_sku_key`(`sku`),
    INDEX `ItemVariant_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warehouse` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL DEFAULT 'Ethiopia',
    `phone` VARCHAR(50) NULL,
    `email` VARCHAR(200) NULL,
    `manager` VARCHAR(200) NULL,
    `companyId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `warehouse_code_key`(`code`),
    INDEX `Warehouse_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transferorder` (
    `id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(100) NOT NULL,
    `fromWarehouseId` VARCHAR(191) NOT NULL,
    `toWarehouseId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    `notes` TEXT NULL,
    `companyId` VARCHAR(191) NULL,
    `createdBy` VARCHAR(100) NULL,
    `approvedBy` VARCHAR(100) NULL,
    `approvedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `transferorder_reference_key`(`reference`),
    INDEX `TransferOrder_companyId_idx`(`companyId`),
    INDEX `TransferOrder_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transferorderitem` (
    `id` VARCHAR(191) NOT NULL,
    `transferOrderId` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitCost` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `notes` VARCHAR(300) NULL,

    INDEX `TransferOrderItem_transferOrderId_idx`(`transferOrderId`),
    INDEX `TransferOrderItem_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventoryadjustment` (
    `id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(100) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `reason` VARCHAR(300) NULL,
    `notes` TEXT NULL,
    `adjustedBy` VARCHAR(100) NULL,
    `companyId` VARCHAR(191) NULL,
    `warehouseId` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `inventoryadjustment_reference_key`(`reference`),
    INDEX `InventoryAdjustment_itemId_idx`(`itemId`),
    INDEX `InventoryAdjustment_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `journalentry` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reference` VARCHAR(191) NULL,
    `description` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'POSTED',
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `journalentry_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `journalline` (
    `id` VARCHAR(191) NOT NULL,
    `journalEntryId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `debit` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `credit` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `taxType` ENUM('VAT_EXCISE', 'STAMP_DUTY', 'PAYROLL_WITHHOLD', 'CUSTOMS_DUTY', 'EXCISE_ON_IMPORT') NULL,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `journalline_companyId_idx`(`companyId`),
    INDEX `journalline_accountId_fkey`(`accountId`),
    INDEX `journalline_journalEntryId_fkey`(`journalEntryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `type` ENUM('ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'UNPAID', 'EMERGENCY', 'OTHER') NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Leave_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loanrepayment` (
    `id` VARCHAR(191) NOT NULL,
    `loanId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `method` VARCHAR(191) NOT NULL DEFAULT 'BANK_TRANSFER',
    `reference` VARCHAR(200) NULL,
    `notes` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LoanRepayment_loanId_idx`(`loanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loanrequest` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'LOAN',
    `amount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `installments` INTEGER NOT NULL DEFAULT 1,
    `interestRate` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `startDate` DATETIME(3) NULL,
    `monthlyDeduction` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `paidAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `remainingBalance` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `purpose` TEXT NULL,
    `remarks` VARCHAR(500) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LoanRequest_companyId_idx`(`companyId`),
    INDEX `LoanRequest_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loyaltyredemption` (
    `id` VARCHAR(191) NOT NULL,
    `transactionId` VARCHAR(191) NOT NULL,
    `rewardId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `notes` VARCHAR(191) NULL,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customerLoyaltyId` VARCHAR(191) NULL,

    UNIQUE INDEX `LoyaltyRedemption_transactionId_key`(`transactionId`),
    INDEX `LoyaltyRedemption_customerLoyaltyId_fkey`(`customerLoyaltyId`),
    INDEX `LoyaltyRedemption_rewardId_idx`(`rewardId`),
    INDEX `LoyaltyRedemption_transactionId_idx`(`transactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loyaltytierconfig` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tier` ENUM('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND') NOT NULL,
    `minPoints` BIGINT NOT NULL DEFAULT 0,
    `maxPoints` BIGINT NULL,
    `benefits` TEXT NOT NULL,
    `multiplier` DOUBLE NOT NULL DEFAULT 1,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LoyaltyTierConfig_companyId_idx`(`companyId`),
    UNIQUE INDEX `LoyaltyTierConfig_companyId_tier_key`(`companyId`, `tier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loyaltytransaction` (
    `id` VARCHAR(191) NOT NULL,
    `customerLoyaltyId` VARCHAR(191) NOT NULL,
    `type` ENUM('EARN_PURCHASE', 'EARN_REFERRAL', 'EARN_BONUS', 'REDEEM_REWARD', 'ADJUST_MANUAL', 'EXPIRE', 'FRAUD_REVERSAL') NOT NULL,
    `points` BIGINT NOT NULL,
    `reason` VARCHAR(200) NOT NULL,
    `referenceId` VARCHAR(100) NULL,
    `fraudScore` DOUBLE NOT NULL DEFAULT 0,
    `status` ENUM('OK', 'SUSPECT', 'BLOCKED', 'REVIEW') NOT NULL DEFAULT 'OK',
    `metadata` LONGTEXT NULL,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LoyaltyTransaction_companyId_idx`(`companyId`),
    INDEX `LoyaltyTransaction_customerLoyaltyId_idx`(`customerLoyaltyId`),
    INDEX `LoyaltyTransaction_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'INFO',
    `title` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `link` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_employeeId_idx`(`employeeId`),
    INDEX `Notification_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificationcampaign` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `templateId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'EMAIL',
    `title` VARCHAR(300) NOT NULL,
    `targets` LONGTEXT NULL,
    `scheduledAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificationtemplate` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(300) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `variables` LONGTEXT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'EMAIL',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `NotificationTemplate_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `onboardingresponse` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `step` VARCHAR(100) NOT NULL,
    `data` LONGTEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `contactName` VARCHAR(200) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(50) NULL,
    `businessName` VARCHAR(200) NULL,
    `industry` VARCHAR(100) NULL,
    `mainGoals` TEXT NULL,
    `topChallenges` TEXT NULL,
    `valueProposition` TEXT NULL,
    `desiredTimeline` VARCHAR(100) NULL,
    `preferredContact` VARCHAR(50) NULL,
    `internalNotes` TEXT NULL,
    `assignedTo` VARCHAR(100) NULL,
    `address` TEXT NULL,
    `website` VARCHAR(500) NULL,
    `budget` DECIMAL(65, 30) NULL,
    `timezone` VARCHAR(50) NULL,
    `socialMedia` LONGTEXT NULL,
    `successDefinition` TEXT NULL,
    `idealCustomerProfile` TEXT NULL,
    `mainCompetitors` TEXT NULL,
    `currentBlockers` TEXT NULL,
    `usp` TEXT NULL,
    `kpis` TEXT NULL,
    `hasLogo` BOOLEAN NOT NULL DEFAULT false,
    `existingMaterials` TEXT NULL,
    `updateFrequency` VARCHAR(100) NULL,
    `brandLove` TEXT NULL,
    `submittedBy` VARCHAR(100) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OnboardingResponse_status_idx`(`status`),
    INDEX `OnboardingResponse_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otherpayment` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `headId` VARCHAR(191) NULL,
    `head` VARCHAR(100) NULL,
    `diaryNo` VARCHAR(50) NULL,
    `taxable` BOOLEAN NOT NULL DEFAULT false,
    `approvedBy` VARCHAR(100) NULL,
    `amount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `notes` VARCHAR(500) NULL,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OtherPayment_companyId_idx`(`companyId`),
    INDEX `OtherPayment_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otherpaymenthead` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `shortCode` VARCHAR(20) NOT NULL DEFAULT '',
    `isTaxable` BOOLEAN NOT NULL DEFAULT false,
    `taxable` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `OtherPaymentHead_name_key`(`name`),
    INDEX `OtherPaymentHead_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partnership` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'STRATEGIC_ALLIANCE',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `description` TEXT NULL,
    `tin` VARCHAR(50) NULL,
    `tinNumber` VARCHAR(50) NULL,
    `licenseNumber` VARCHAR(100) NULL,
    `contactName` VARCHAR(200) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `agreementRef` VARCHAR(200) NULL,
    `credibilityScore` INTEGER NOT NULL DEFAULT 50,
    `notes` TEXT NULL,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amlRiskLevel` VARCHAR(20) NULL,
    `kycStatus` VARCHAR(20) NULL,
    `kycVerifiedAt` DATETIME(3) NULL,

    INDEX `Partnership_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partnershipcustomer` (
    `id` VARCHAR(191) NOT NULL,
    `partnershipId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `relationshipType` VARCHAR(191) NOT NULL DEFAULT 'SERVED',
    `since` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PartnershipCustomer_customerId_idx`(`customerId`),
    INDEX `PartnershipCustomer_partnershipId_idx`(`partnershipId`),
    UNIQUE INDEX `PartnershipCustomer_partnershipId_customerId_key`(`partnershipId`, `customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partnershipmember` (
    `id` VARCHAR(191) NOT NULL,
    `partnershipId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(100) NULL,
    `ownershipPct` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `contribution` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `joinDate` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PartnershipMember_partnershipId_idx`(`partnershipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paymentbatch` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'VENDOR',
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `totalAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `notes` TEXT NULL,
    `exportedAt` DATETIME(3) NULL,
    `exportFormat` VARCHAR(20) NULL,
    `createdBy` VARCHAR(100) NULL,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PaymentBatch_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paymentbatchitem` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `billId` VARCHAR(191) NULL,
    `invoiceId` VARCHAR(191) NULL,
    `vendorId` VARCHAR(191) NULL,
    `amount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `notes` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PaymentBatchItem_batchId_idx`(`batchId`),
    INDEX `paymentbatchitem_billId_fkey`(`billId`),
    INDEX `pbi_invoiceId_idx`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payrollrecord` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'SALARY',
    `basicSalary` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `grossTotal` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `grossPay` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `netPay` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `incomeTax` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `employeePension` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `employerPension` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `loanDeduction` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `totalDeductions` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `otherDeductions` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `otPay` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `approvedBy` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `workedDays` INTEGER NOT NULL DEFAULT 0,
    `presentDays` INTEGER NOT NULL DEFAULT 0,
    `absentDays` INTEGER NOT NULL DEFAULT 0,
    `workingDays` INTEGER NOT NULL DEFAULT 0,
    `otHours` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `status` VARCHAR(191) NOT NULL DEFAULT 'GENERATED',
    `approvedAt` DATETIME(3) NULL,
    `companyId` VARCHAR(191) NULL,
    `journalEntryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PayrollRecord_companyId_idx`(`companyId`),
    INDEX `PayrollRecord_year_month_idx`(`year`, `month`),
    UNIQUE INDEX `PayrollRecord_employeeId_year_month_type_key`(`employeeId`, `year`, `month`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reimbursementclaim` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'TRAVEL',
    `amount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `totalAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `locationTier` VARCHAR(50) NULL,
    `purpose` VARCHAR(200) NULL,
    `destination` VARCHAR(200) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `transportCost` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `perDiemAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `description` TEXT NULL,
    `notes` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReimbursementClaim_companyId_idx`(`companyId`),
    INDEX `ReimbursementClaim_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(50) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `appId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `rating` INTEGER NOT NULL DEFAULT 5,
    `comment` TEXT NULL,
    `reviewedBy` VARCHAR(100) NULL,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Review_appId_idx`(`appId`),
    INDEX `Review_companyId_idx`(`companyId`),
    INDEX `Review_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reward` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(100) NOT NULL,
    `costPoints` BIGINT NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 999,
    `imageUrl` VARCHAR(191) NULL,
    `companyId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Reward_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shift` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(10) NOT NULL,
    `endTime` VARCHAR(10) NOT NULL,
    `departmentId` VARCHAR(191) NULL,
    `companyId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Shift_companyId_idx`(`companyId`),
    INDEX `Shift_departmentId_idx`(`departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stocktransaction` (
    `id` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitCost` DECIMAL(65, 30) NOT NULL,
    `reference` VARCHAR(100) NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StockTransaction_date_idx`(`date`),
    INDEX `StockTransaction_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `telecomreceiptcache` (
    `id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(200) NULL,
    `ref` VARCHAR(100) NULL,
    `payload` LONGTEXT NOT NULL,
    `rawHtml` LONGTEXT NULL,
    `parsedJson` LONGTEXT NULL,
    `fetchedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TelecomReceiptCache_ref_key`(`ref`),
    INDEX `TelecomReceiptCache_expiresAt_idx`(`expiresAt`),
    INDEX `TelecomReceiptCache_reference_idx`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'EMPLOYEE',
    `employeeId` VARCHAR(191) NULL,
    `companyId` VARCHAR(191) NULL,
    `auth0Id` VARCHAR(191) NULL,
    `mfaEnrolled` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `failedLoginAttempts` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `timezone` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastLoginCountry` VARCHAR(191) NULL,
    `lastLoginIP` VARCHAR(191) NULL,
    `sessionsCount` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_employeeId_key`(`employeeId`),
    UNIQUE INDEX `User_auth0Id_key`(`auth0Id`),
    INDEX `User_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vatetaxsubmission` (
    `id` VARCHAR(36) NOT NULL,
    `period` VARCHAR(7) NOT NULL,
    `type` VARCHAR(30) NOT NULL DEFAULT 'VAT_RETURN',
    `status` VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    `submittedAt` DATETIME(0) NULL,
    `ercaReferenceNo` VARCHAR(100) NULL,
    `totalAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `notes` TEXT NULL,
    `submittedBy` VARCHAR(36) NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vatexportevidence` (
    `id` VARCHAR(36) NOT NULL,
    `invoiceNo` VARCHAR(100) NOT NULL,
    `Customer` VARCHAR(255) NOT NULL,
    `exportDate` DATETIME(0) NOT NULL,
    `amountETB` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `customsDecl` VARCHAR(20) NOT NULL DEFAULT 'missing',
    `billOfLading` VARCHAR(20) NOT NULL DEFAULT 'missing',
    `bankReceipt` VARCHAR(20) NOT NULL DEFAULT 'missing',
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vatfiling` (
    `id` VARCHAR(191) NOT NULL,
    `period` VARCHAR(20) NOT NULL,
    `outputVat` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `inputVat` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `netPayable` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `collected` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `paid` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `projected` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `filedAt` DATETIME(3) NULL,
    `dueDate` DATETIME(3) NULL,
    `eTaxReference` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `VatFiling_period_key`(`period`),
    INDEX `VatFiling_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vatinputledger` (
    `id` VARCHAR(36) NOT NULL,
    `supplier` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `invoiceNo` VARCHAR(100) NOT NULL,
    `date` DATETIME(0) NOT NULL,
    `netAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `vatAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `claimable` BOOLEAN NOT NULL DEFAULT true,
    `period` VARCHAR(7) NULL,
    `sourceRef` VARCHAR(100) NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vatnote` (
    `id` VARCHAR(36) NOT NULL,
    `date` DATETIME(0) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `body` TEXT NOT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vatoutputledger` (
    `id` VARCHAR(36) NOT NULL,
    `Customer` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `invoiceNo` VARCHAR(100) NOT NULL,
    `date` DATETIME(0) NOT NULL,
    `netAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `vatAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `period` VARCHAR(7) NULL,
    `sourceRef` VARCHAR(100) NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vatrefundclaim` (
    `id` VARCHAR(36) NOT NULL,
    `ref` VARCHAR(50) NOT NULL,
    `period` VARCHAR(7) NOT NULL,
    `submittedDate` DATETIME(0) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(50) NOT NULL DEFAULT 'submitted',
    `notes` TEXT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vatreverscharge` (
    `id` VARCHAR(36) NOT NULL,
    `supplier` VARCHAR(255) NOT NULL,
    `service` VARCHAR(255) NOT NULL,
    `invoiceDate` DATETIME(0) NOT NULL,
    `amountETB` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `vatDue` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `period` VARCHAR(7) NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vatwithholding` (
    `id` VARCHAR(36) NOT NULL,
    `supplier` VARCHAR(255) NOT NULL,
    `tin` VARCHAR(50) NOT NULL,
    `invoiceDate` DATETIME(0) NOT NULL,
    `invoiceAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `withheldVat` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `remitted` BOOLEAN NOT NULL DEFAULT false,
    `period` VARCHAR(7) NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tin` VARCHAR(50) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `paymentTerms` VARCHAR(100) NULL,
    `companyId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `category` VARCHAR(50) NULL,
    `notes` TEXT NULL,

    INDEX `Vendor_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_contact` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `name` VARCHAR(300) NOT NULL,
    `email` VARCHAR(300) NULL,
    `phone` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `tin` VARCHAR(20) NULL,
    `vatNumber` VARCHAR(50) NULL,
    `website` VARCHAR(500) NULL,
    `paymentTerms` VARCHAR(20) NULL DEFAULT 'NET30',
    `notes` TEXT NULL,
    `creditLimit` DECIMAL(65, 30) NULL,
    `riskLevel` VARCHAR(20) NULL DEFAULT 'MEDIUM',
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `type` VARCHAR(20) NOT NULL DEFAULT 'PERSON',
    `jobTitle` VARCHAR(200) NULL,
    `companyName` VARCHAR(300) NULL,
    `assignedTo` VARCHAR(200) NULL,
    `preferredInteractionType` VARCHAR(20) NULL DEFAULT 'EMAIL',
    `outstandingBalance` DECIMAL(65, 30) NULL DEFAULT 0,
    `totalInvoiced` DECIMAL(65, 30) NULL DEFAULT 0,
    `creditScore` INTEGER NULL,
    `loyaltyTier` VARCHAR(20) NULL,
    `lastContactedAt` DATETIME(3) NULL,
    `pipelineStage` VARCHAR(50) NULL,
    `tags` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `crm_contact_companyId_idx`(`companyId`),
    INDEX `crm_contact_status_idx`(`status`),
    INDEX `crm_contact_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_company` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `name` VARCHAR(300) NOT NULL,
    `email` VARCHAR(300) NULL,
    `phone` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `website` VARCHAR(500) NULL,
    `industry` VARCHAR(100) NULL,
    `size` VARCHAR(20) NULL DEFAULT 'SMALL',
    `tin` VARCHAR(20) NULL,
    `vatNumber` VARCHAR(50) NULL,
    `notes` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `contactCount` INTEGER NOT NULL DEFAULT 0,
    `dealCount` INTEGER NOT NULL DEFAULT 0,
    `totalRevenue` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `crm_company_companyId_idx`(`companyId`),
    INDEX `crm_company_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crmdeal` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(300) NOT NULL,
    `customerName` VARCHAR(200) NOT NULL,
    `value` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `stage` VARCHAR(50) NOT NULL DEFAULT 'LEAD',
    `probability` INTEGER NOT NULL DEFAULT 10,
    `expectedCloseDate` DATETIME(3) NULL,
    `assignedTo` VARCHAR(200) NULL,
    `notes` TEXT NULL,
    `companyId` VARCHAR(191) NULL,
    `contactId` VARCHAR(191) NULL,
    `crmCompanyId` VARCHAR(191) NULL,
    `pipelineId` VARCHAR(191) NULL,
    `tags` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `crmdeal_companyId_idx`(`companyId`),
    INDEX `crmdeal_stage_idx`(`stage`),
    INDEX `crmdeal_pipelineId_idx`(`pipelineId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_activity` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `type` VARCHAR(30) NOT NULL DEFAULT 'CALL',
    `title` VARCHAR(300) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `dueDate` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `contactId` VARCHAR(191) NULL,
    `contactName` VARCHAR(300) NULL,
    `dealId` VARCHAR(191) NULL,
    `dealTitle` VARCHAR(300) NULL,
    `assignedTo` VARCHAR(200) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `crm_activity_companyId_idx`(`companyId`),
    INDEX `crm_activity_status_idx`(`status`),
    INDEX `crm_activity_type_idx`(`type`),
    INDEX `crm_activity_dueDate_idx`(`dueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_pipeline` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `stagesJson` LONGTEXT NOT NULL,
    `dealCount` INTEGER NOT NULL DEFAULT 0,
    `totalValue` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `crm_pipeline_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scanned_bill` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `billType` VARCHAR(20) NOT NULL DEFAULT 'BANK',
    `source` VARCHAR(50) NULL,
    `referenceNo` VARCHAR(200) NULL,
    `amount` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'ETB',
    `paidAt` DATETIME(3) NULL,
    `payer` VARCHAR(200) NULL,
    `receiver` VARCHAR(200) NULL,
    `bankName` VARCHAR(100) NULL,
    `bankAccountNo` VARCHAR(100) NULL,
    `bankAccountName` VARCHAR(200) NULL,
    `telecomRef` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `rawData` LONGTEXT NULL,
    `imageData` LONGTEXT NULL,
    `ocrConfidence` DECIMAL(65, 30) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `linkedExpenseId` VARCHAR(191) NULL,
    `linkedInvoiceId` VARCHAR(191) NULL,
    `linkedBillId` VARCHAR(191) NULL,
    `exportedAt` DATETIME(3) NULL,
    `exportFormat` VARCHAR(20) NULL,
    `createdBy` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `scanned_bill_companyId_idx`(`companyId`),
    INDEX `scanned_bill_billType_idx`(`billType`),
    INDEX `scanned_bill_status_idx`(`status`),
    INDEX `scanned_bill_referenceNo_idx`(`referenceNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `currencyrate` (
    `id` VARCHAR(191) NOT NULL,
    `fromCurrency` VARCHAR(191) NOT NULL,
    `toCurrency` VARCHAR(191) NOT NULL,
    `rate` DECIMAL(65, 30) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `source` VARCHAR(191) NULL,

    UNIQUE INDEX `CurrencyRate_fromCurrency_toCurrency_date_key`(`fromCurrency`, `toCurrency`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fileattachment` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `fileData` LONGTEXT NULL,
    `attachableId` VARCHAR(191) NOT NULL,
    `attachableType` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `uploadedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FileAttachment_attachableType_attachableId_idx`(`attachableType`, `attachableId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fxdifference` (
    `id` VARCHAR(191) NOT NULL,
    `intercompanyTxId` VARCHAR(191) NULL,
    `monetaryItemRef` VARCHAR(191) NOT NULL,
    `fromCurrency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `toCurrency` VARCHAR(191) NOT NULL DEFAULT 'ETB',
    `amountBase` DECIMAL(65, 30) NOT NULL,
    `fxRate` DECIMAL(65, 30) NOT NULL,
    `amountReporting` DECIMAL(65, 30) NOT NULL,
    `fxGainLoss` DECIMAL(65, 30) NOT NULL,
    `ias21Treatment` VARCHAR(191) NOT NULL DEFAULT 'P_AND_L',
    `taxDeferred` BOOLEAN NOT NULL DEFAULT false,
    `period` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FxDifference_intercompanyTxId_idx`(`intercompanyTxId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ifrsstandard` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL DEFAULT '2024',
    `type` ENUM('IAS1_PRESENTATION', 'IFRS9_FIN_INSTRUMENTS', 'IFRS15_REVENUE', 'IFRS16_LEASES', 'IFRS17_INSURANCE', 'IAS7_STATEMENT_CASHFLOWS', 'IAS12_INCOME_TAXES', 'IAS21_FX_INTRAGROUP', 'IAS36_IMPAIRMENT', 'CUSTOM') NOT NULL,
    `appliesToBusinessTypes` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `disclosureJson` LONGTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `companyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `IfrsStandard_code_key`(`code`),
    INDEX `IfrsStandard_companyId_idx`(`companyId`),
    INDEX `IfrsStandard_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ingestionjob` (
    `id` VARCHAR(191) NOT NULL,
    `sourceType` VARCHAR(20) NOT NULL,
    `targetType` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'RECEIVED',
    `companyId` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `fileName` VARCHAR(255) NULL,
    `mimeType` VARCHAR(100) NULL,
    `rawPayload` TEXT NULL,
    `parsedPayload` LONGTEXT NULL,
    `committedIds` TEXT NULL,
    `errors` TEXT NULL,
    `rowsParsed` INTEGER NOT NULL DEFAULT 0,
    `rowsCommitted` INTEGER NOT NULL DEFAULT 0,
    `rowsFailed` INTEGER NOT NULL DEFAULT 0,
    `rowsForReview` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    INDEX `IngestionJob_companyId_idx`(`companyId`),
    INDEX `IngestionJob_createdAt_idx`(`createdAt`),
    INDEX `IngestionJob_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periodlock` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `status` ENUM('OPEN', 'LOCKED') NOT NULL DEFAULT 'OPEN',
    `lockedBy` VARCHAR(191) NULL,
    `lockedAt` DATETIME(3) NULL,
    `unlockedBy` VARCHAR(191) NULL,
    `unlockedAt` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,

    UNIQUE INDEX `PeriodLock_companyId_year_month_key`(`companyId`, `year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `systemsetting` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SystemSetting_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `taxrate` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `rate` DECIMAL(65, 30) NOT NULL,
    `type` ENUM('VAT', 'INCOME_TAX', 'WITHHOLDING', 'DRRF', 'SALES_TAX', 'CUSTOM') NOT NULL DEFAULT 'VAT',
    `appliesTo` LONGTEXT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TaxRate_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `budget` DECIMAL(18, 2) NULL,
    `spent` DECIMAL(18, 2) NULL,
    `progress` INTEGER NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `manager` VARCHAR(200) NULL,
    `teamSize` INTEGER NULL,
    `companyId` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Project_companyId_idx`(`companyId`),
    INDEX `Project_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lease` (
    `id` VARCHAR(191) NOT NULL,
    `leaseNumber` VARCHAR(100) NOT NULL,
    `leaseType` VARCHAR(20) NOT NULL DEFAULT 'ovds',
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `assetDescription` VARCHAR(300) NOT NULL,
    `assetCategory` VARCHAR(50) NOT NULL DEFAULT 'PROPERTY',
    `lessorName` VARCHAR(200) NOT NULL,
    `lessorTin` VARCHAR(20) NULL,
    `commencementDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `termMonths` INTEGER NOT NULL,
    `monthlyPayment` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `discountRate` DECIMAL(8, 6) NOT NULL DEFAULT 0.12,
    `rouAssetInitial` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `rouAssetCarrying` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `leaseLiabilityInitial` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `leaseLiabilityCurrent` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `totalInterestExpense` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `totalDepreciation` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `totalPaymentsMade` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `residualValueGuarantee` DECIMAL(18, 2) NULL,
    `purchaseOptionPrice` DECIMAL(18, 2) NULL,
    `purchaseOptionCertain` BOOLEAN NOT NULL DEFAULT false,
    `renewalOptions` TEXT NULL,
    `notes` TEXT NULL,
    `companyId` VARCHAR(191) NULL,
    `createdBy` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lease_leaseNumber_key`(`leaseNumber`),
    INDEX `lease_companyId_idx`(`companyId`),
    INDEX `lease_status_idx`(`status`),
    INDEX `lease_commencementDate_idx`(`commencementDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lease_payment` (
    `id` VARCHAR(191) NOT NULL,
    `leaseId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(7) NOT NULL,
    `paymentDate` DATETIME(3) NOT NULL,
    `totalPayment` DECIMAL(18, 2) NOT NULL,
    `principalPortion` DECIMAL(18, 2) NOT NULL,
    `interestPortion` DECIMAL(18, 2) NOT NULL,
    `openingLiability` DECIMAL(18, 2) NOT NULL,
    `closingLiability` DECIMAL(18, 2) NOT NULL,
    `rouDepreciation` DECIMAL(18, 2) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    `paidAt` DATETIME(3) NULL,
    `journalEntryId` VARCHAR(36) NULL,
    `notes` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lease_payment_leaseId_idx`(`leaseId`),
    INDEX `lease_payment_period_idx`(`period`),
    INDEX `lease_payment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lease_journal_entry` (
    `id` VARCHAR(191) NOT NULL,
    `leaseId` VARCHAR(191) NOT NULL,
    `entryType` VARCHAR(50) NOT NULL,
    `period` VARCHAR(7) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `journalEntryId` VARCHAR(36) NULL,
    `description` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lease_journal_entry_leaseId_idx`(`leaseId`),
    INDEX `lease_journal_entry_period_idx`(`period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticket` (
    `id` VARCHAR(191) NOT NULL,
    `ticketNumber` VARCHAR(30) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    `priority` VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    `category` VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    `subject` VARCHAR(300) NOT NULL,
    `description` TEXT NOT NULL,
    `requesterName` VARCHAR(200) NULL,
    `requesterEmail` VARCHAR(200) NULL,
    `assignedTo` VARCHAR(100) NULL,
    `assigneeName` VARCHAR(200) NULL,
    `companyId` VARCHAR(191) NULL,
    `createdBy` VARCHAR(100) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `dueDate` DATETIME(3) NULL,
    `tags` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ticket_ticketNumber_key`(`ticketNumber`),
    INDEX `ticket_companyId_idx`(`companyId`),
    INDEX `ticket_status_idx`(`status`),
    INDEX `ticket_priority_idx`(`priority`),
    INDEX `ticket_assignedTo_idx`(`assignedTo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticket_reply` (
    `id` VARCHAR(191) NOT NULL,
    `ticketId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `authorId` VARCHAR(100) NULL,
    `authorName` VARCHAR(200) NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'REPLY',
    `isInternal` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ticket_reply_ticketId_idx`(`ticketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `financial_statement_template` ADD CONSTRAINT `financial_statement_template_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `account_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `Account_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admincreatedmenuitem` ADD CONSTRAINT `adminmenuitem_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `arrearconfig` ADD CONSTRAINT `ArrearConfig_arrearTypeId_fkey` FOREIGN KEY (`arrearTypeId`) REFERENCES `arreartype`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `arrearconfig` ADD CONSTRAINT `ArrearConfig_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `Attendance_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditcomment` ADD CONSTRAINT `auditcomment_engagementId_fkey` FOREIGN KEY (`engagementId`) REFERENCES `auditengagement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditengagement` ADD CONSTRAINT `auditengagement_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditengagement` ADD CONSTRAINT `auditengagement_firmId_fkey` FOREIGN KEY (`firmId`) REFERENCES `auditfirm`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditfinding` ADD CONSTRAINT `auditfinding_engagementId_fkey` FOREIGN KEY (`engagementId`) REFERENCES `auditengagement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditfirm` ADD CONSTRAINT `auditfirm_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditlog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bankaccount` ADD CONSTRAINT `bankaccount_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `banktransaction` ADD CONSTRAINT `BankTransaction_bankAccountId_fkey` FOREIGN KEY (`bankAccountId`) REFERENCES `bankaccount`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `banktransaction` ADD CONSTRAINT `BankTransaction_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `journalentry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill` ADD CONSTRAINT `Bill_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill` ADD CONSTRAINT `Bill_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill` ADD CONSTRAINT `bill_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `journalentry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billitem` ADD CONSTRAINT `BillItem_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billitem` ADD CONSTRAINT `BillItem_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billitem` ADD CONSTRAINT `billitem_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `biometricdata` ADD CONSTRAINT `BiometricData_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `businessloan` ADD CONSTRAINT `BusinessLoan_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `businessloan` ADD CONSTRAINT `BusinessLoan_partnershipId_fkey` FOREIGN KEY (`partnershipId`) REFERENCES `partnership`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cashforecast` ADD CONSTRAINT `cashforecast_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collectioncase` ADD CONSTRAINT `collectioncase_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collectioncase` ADD CONSTRAINT `collectioncase_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collectioncase` ADD CONSTRAINT `collectioncase_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_feature_flag` ADD CONSTRAINT `company_feature_flag_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_feature_flag` ADD CONSTRAINT `company_feature_flag_flagId_fkey` FOREIGN KEY (`flagId`) REFERENCES `feature_flag`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_release` ADD CONSTRAINT `company_release_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_release` ADD CONSTRAINT `company_release_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `release`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credithold` ADD CONSTRAINT `credithold_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credithold` ADD CONSTRAINT `credithold_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer` ADD CONSTRAINT `Customer_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customerinteraction` ADD CONSTRAINT `CustomerInteraction_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customerloyalty` ADD CONSTRAINT `CustomerLoyalty_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customerloyalty` ADD CONSTRAINT `CustomerLoyalty_tierConfigId_fkey` FOREIGN KEY (`tierConfigId`) REFERENCES `loyaltytierconfig`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deduction` ADD CONSTRAINT `deduction_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deduction` ADD CONSTRAINT `deduction_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deduction` ADD CONSTRAINT `deduction_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `department` ADD CONSTRAINT `Department_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee` ADD CONSTRAINT `Employee_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee` ADD CONSTRAINT `Employee_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee` ADD CONSTRAINT `Employee_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `shift`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fraudlog` ADD CONSTRAINT `FraudLog_customerLoyaltyId_fkey` FOREIGN KEY (`customerLoyaltyId`) REFERENCES `customerloyalty`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incometaxfiling` ADD CONSTRAINT `incometaxfiling_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `intercompanytransaction` ADD CONSTRAINT `IntercompanyTransaction_fxDifferenceId_fkey` FOREIGN KEY (`fxDifferenceId`) REFERENCES `fxdifference`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `intercompanytransaction` ADD CONSTRAINT `intercompany_fromCompanyId_fkey` FOREIGN KEY (`fromCompanyId`) REFERENCES `company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `intercompanytransaction` ADD CONSTRAINT `intercompany_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `journalentry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `intercompanytransaction` ADD CONSTRAINT `intercompany_toCompanyId_fkey` FOREIGN KEY (`toCompanyId`) REFERENCES `company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `investment` ADD CONSTRAINT `Investment_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `investment` ADD CONSTRAINT `Investment_partnershipId_fkey` FOREIGN KEY (`partnershipId`) REFERENCES `partnership`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `Invoice_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `journalentry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoiceactivity` ADD CONSTRAINT `InvoiceActivity_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoiceitem` ADD CONSTRAINT `InvoiceItem_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoiceitem` ADD CONSTRAINT `InvoiceItem_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoiceitem` ADD CONSTRAINT `invoiceitem_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoicepayment` ADD CONSTRAINT `InvoicePayment_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoicepayment` ADD CONSTRAINT `invoicepayment_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `journalentry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoicepayment` ADD CONSTRAINT `invoicepayment_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billpayment` ADD CONSTRAINT `billpayment_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billpayment` ADD CONSTRAINT `billpayment_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `journalentry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billpayment` ADD CONSTRAINT `billpayment_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item` ADD CONSTRAINT `Item_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item` ADD CONSTRAINT `Item_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `itemgroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item` ADD CONSTRAINT `Item_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itemvariant` ADD CONSTRAINT `ItemVariant_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transferorder` ADD CONSTRAINT `TransferOrder_fromWarehouseId_fkey` FOREIGN KEY (`fromWarehouseId`) REFERENCES `warehouse`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transferorder` ADD CONSTRAINT `TransferOrder_toWarehouseId_fkey` FOREIGN KEY (`toWarehouseId`) REFERENCES `warehouse`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transferorderitem` ADD CONSTRAINT `TransferOrderItem_transferOrderId_fkey` FOREIGN KEY (`transferOrderId`) REFERENCES `transferorder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transferorderitem` ADD CONSTRAINT `TransferOrderItem_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryadjustment` ADD CONSTRAINT `InventoryAdjustment_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journalentry` ADD CONSTRAINT `journalentry_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journalline` ADD CONSTRAINT `journalline_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journalline` ADD CONSTRAINT `JournalLine_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journalline` ADD CONSTRAINT `JournalLine_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `journalentry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave` ADD CONSTRAINT `Leave_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loanrepayment` ADD CONSTRAINT `LoanRepayment_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `businessloan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loanrequest` ADD CONSTRAINT `loanrequest_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loanrequest` ADD CONSTRAINT `loanrequest_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyaltyredemption` ADD CONSTRAINT `LoyaltyRedemption_customerLoyaltyId_fkey` FOREIGN KEY (`customerLoyaltyId`) REFERENCES `customerloyalty`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyaltyredemption` ADD CONSTRAINT `LoyaltyRedemption_rewardId_fkey` FOREIGN KEY (`rewardId`) REFERENCES `reward`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyaltyredemption` ADD CONSTRAINT `LoyaltyRedemption_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `loyaltytransaction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyaltytierconfig` ADD CONSTRAINT `LoyaltyTierConfig_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyaltytransaction` ADD CONSTRAINT `LoyaltyTransaction_customerLoyaltyId_fkey` FOREIGN KEY (`customerLoyaltyId`) REFERENCES `customerloyalty`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `otherpayment` ADD CONSTRAINT `otherpayment_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `otherpayment` ADD CONSTRAINT `otherpayment_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `otherpaymenthead` ADD CONSTRAINT `otherpaymenthead_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partnership` ADD CONSTRAINT `partnership_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partnershipcustomer` ADD CONSTRAINT `partnershipcustomer_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partnershipcustomer` ADD CONSTRAINT `partnershipcustomer_partnershipId_fkey` FOREIGN KEY (`partnershipId`) REFERENCES `partnership`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partnershipmember` ADD CONSTRAINT `partnershipmember_partnershipId_fkey` FOREIGN KEY (`partnershipId`) REFERENCES `partnership`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paymentbatch` ADD CONSTRAINT `paymentbatch_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paymentbatchitem` ADD CONSTRAINT `paymentbatchitem_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `paymentbatch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paymentbatchitem` ADD CONSTRAINT `paymentbatchitem_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bill`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paymentbatchitem` ADD CONSTRAINT `paymentbatchitem_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payrollrecord` ADD CONSTRAINT `payrollrecord_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payrollrecord` ADD CONSTRAINT `payrollrecord_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payrollrecord` ADD CONSTRAINT `payrollrecord_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `journalentry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reimbursementclaim` ADD CONSTRAINT `reimbursementclaim_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reimbursementclaim` ADD CONSTRAINT `reimbursementclaim_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review` ADD CONSTRAINT `review_appId_fkey` FOREIGN KEY (`appId`) REFERENCES `app`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review` ADD CONSTRAINT `review_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reward` ADD CONSTRAINT `Reward_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shift` ADD CONSTRAINT `shift_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shift` ADD CONSTRAINT `shift_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stocktransaction` ADD CONSTRAINT `StockTransaction_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vatfiling` ADD CONSTRAINT `vatfiling_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor` ADD CONSTRAINT `vendor_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ifrsstandard` ADD CONSTRAINT `IfrsStandard_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lease` ADD CONSTRAINT `lease_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lease_payment` ADD CONSTRAINT `lease_payment_leaseId_fkey` FOREIGN KEY (`leaseId`) REFERENCES `lease`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lease_journal_entry` ADD CONSTRAINT `lease_journal_entry_leaseId_fkey` FOREIGN KEY (`leaseId`) REFERENCES `lease`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket` ADD CONSTRAINT `ticket_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_reply` ADD CONSTRAINT `ticket_reply_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `ticket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
