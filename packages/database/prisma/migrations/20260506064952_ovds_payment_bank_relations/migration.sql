-- AlterTable
ALTER TABLE `billpayment` ADD COLUMN `bankAccountId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `invoicepayment` ADD COLUMN `bankAccountId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `invoicepayment` ADD CONSTRAINT `invoicepayment_bankAccountId_fkey` FOREIGN KEY (`bankAccountId`) REFERENCES `bankaccount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billpayment` ADD CONSTRAINT `billpayment_bankAccountId_fkey` FOREIGN KEY (`bankAccountId`) REFERENCES `bankaccount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
