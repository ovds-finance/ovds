-- AlterTable
ALTER TABLE `bill` ADD COLUMN `categoryId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `invoice` ADD COLUMN `categoryId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `item` ADD COLUMN `categoryId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `bill` ADD CONSTRAINT `bill_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item` ADD CONSTRAINT `item_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
