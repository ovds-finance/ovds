-- AlterTable
ALTER TABLE `fund_transfer` ADD COLUMN `companyId` VARCHAR(191) NULL,
    ADD COLUMN `journalEntryId` VARCHAR(36) NULL;

-- CreateIndex
CREATE INDEX `fund_transfer_companyId_idx` ON `fund_transfer`(`companyId`);

-- AddForeignKey
ALTER TABLE `fund_transfer` ADD CONSTRAINT `fund_transfer_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fund_transfer` ADD CONSTRAINT `fund_transfer_fromAccountId_fkey` FOREIGN KEY (`fromAccountId`) REFERENCES `bankaccount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fund_transfer` ADD CONSTRAINT `fund_transfer_toAccountId_fkey` FOREIGN KEY (`toAccountId`) REFERENCES `bankaccount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fund_transfer` ADD CONSTRAINT `fund_transfer_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `journalentry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
