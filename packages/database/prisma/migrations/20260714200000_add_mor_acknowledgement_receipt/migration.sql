-- CreateTable
CREATE TABLE `mor_acknowledgement_receipt` (
    `id` VARCHAR(36) NOT NULL,
    `companyId` VARCHAR(36) NULL,
    `submissionRecordId` VARCHAR(36) NULL,
    `submissionType` VARCHAR(30) NOT NULL DEFAULT 'VAT_RETURN',
    `receiptNumber` VARCHAR(100) NULL,
    `receiptDate` DATETIME(3) NULL,
    `period` VARCHAR(7) NULL,
    `ackXml` LONGTEXT NULL,
    `ackPdf` LONGTEXT NULL,
    `verificationStatus` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `verificationMethod` VARCHAR(30) NULL,
    `documentHash` VARCHAR(64) NULL,
    `downloadUrl` VARCHAR(500) NULL,
    `submittedBy` VARCHAR(100) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `verifiedBy` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MorAcknowledgementReceipt_companyId_idx`(`companyId`),
    INDEX `MorAcknowledgementReceipt_submissionRecordId_idx`(`submissionRecordId`),
    INDEX `MorAcknowledgementReceipt_receiptNumber_idx`(`receiptNumber`),
    INDEX `MorAcknowledgementReceipt_period_idx`(`period`),
    INDEX `MorAcknowledgementReceipt_verificationStatus_idx`(`verificationStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
