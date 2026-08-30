-- DropIndex
DROP INDEX `AuditLog_companyId_createdAt_idx` ON `auditlog`;

-- DropIndex
DROP INDEX `Invoice_companyId_date_idx` ON `invoice`;

-- AlterTable
ALTER TABLE `accrual_posting` ADD COLUMN `companyId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ledgerentry` ADD COLUMN `companyId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `notification` ADD COLUMN `companyId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `notificationcampaign` ADD COLUMN `companyId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `paymentbatchitem` ADD COLUMN `companyId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `sales_order_credit_note_item` ADD COLUMN `companyId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `AccrualPosting_companyId_idx` ON `accrual_posting`(`companyId`);

-- CreateIndex
CREATE INDEX `AuditLog_companyId_createdAt_idx` ON `auditlog`(`companyId`, `createdAt` DESC);

-- CreateIndex
CREATE INDEX `Invoice_companyId_date_idx` ON `invoice`(`companyId`, `date` DESC);

-- CreateIndex
CREATE INDEX `LedgerEntry_companyId_idx` ON `ledgerentry`(`companyId`);

-- CreateIndex
CREATE INDEX `Notification_companyId_idx` ON `notification`(`companyId`);

-- CreateIndex
CREATE INDEX `NotificationCampaign_companyId_idx` ON `notificationcampaign`(`companyId`);

-- CreateIndex
CREATE INDEX `PaymentBatchItem_companyId_idx` ON `paymentbatchitem`(`companyId`);

-- CreateIndex
CREATE INDEX `SalesOrderCreditNoteItem_companyId_idx` ON `sales_order_credit_note_item`(`companyId`);

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `Invoice_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ledgerentry` ADD CONSTRAINT `LedgerEntry_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `Notification_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificationcampaign` ADD CONSTRAINT `NotificationCampaign_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paymentbatchitem` ADD CONSTRAINT `PaymentBatchItem_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accrual_posting` ADD CONSTRAINT `AccrualPosting_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_order_line` ADD CONSTRAINT `SalesOrderLine_SalesOrderId_fkey` FOREIGN KEY (`SalesOrderId`) REFERENCES `sales_order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_order_credit_note_item` ADD CONSTRAINT `SalesOrderCreditNoteItem_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RedefineIndex
CREATE INDEX `SalesOrderLine_SalesOrderId_idx` ON `sales_order_line`(`SalesOrderId`);
DROP INDEX `sales_order_line_SalesOrderId_idx` ON `sales_order_line`;

-- RedefineIndex
CREATE INDEX `StockTransaction_itemId_fkey` ON `stocktransaction`(`itemId`);
DROP INDEX `StockTransaction_itemId_idx` ON `stocktransaction`;
