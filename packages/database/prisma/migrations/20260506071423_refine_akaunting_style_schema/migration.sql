/*
  Warnings:

  - You are about to drop the column `currency` on the `fund_transfer` table. All the data in the column will be lost.
  - You are about to drop the column `fromAccount` on the `fund_transfer` table. All the data in the column will be lost.
  - You are about to drop the column `toAccount` on the `fund_transfer` table. All the data in the column will be lost.
  - Made the column `fromAccountId` on table `fund_transfer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `toAccountId` on table `fund_transfer` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `fund_transfer` DROP FOREIGN KEY `fund_transfer_fromAccountId_fkey`;

-- DropForeignKey
ALTER TABLE `fund_transfer` DROP FOREIGN KEY `fund_transfer_toAccountId_fkey`;

-- DropIndex
DROP INDEX `fund_transfer_fromAccountId_fkey` ON `fund_transfer`;

-- DropIndex
DROP INDEX `fund_transfer_toAccountId_fkey` ON `fund_transfer`;

-- AlterTable
ALTER TABLE `bill` ADD COLUMN `currencyCode` VARCHAR(3) NOT NULL DEFAULT 'ETB',
    ADD COLUMN `currencyRate` DECIMAL(65, 30) NOT NULL DEFAULT 1.0;

-- AlterTable
ALTER TABLE `billpayment` ADD COLUMN `currencyCode` VARCHAR(3) NOT NULL DEFAULT 'ETB',
    ADD COLUMN `currencyRate` DECIMAL(65, 30) NOT NULL DEFAULT 1.0;

-- AlterTable
ALTER TABLE `fund_transfer` DROP COLUMN `currency`,
    DROP COLUMN `fromAccount`,
    DROP COLUMN `toAccount`,
    ADD COLUMN `currencyCode` VARCHAR(3) NOT NULL DEFAULT 'ETB',
    MODIFY `fromAccountId` VARCHAR(191) NOT NULL,
    MODIFY `toAccountId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `invoice` ADD COLUMN `currencyCode` VARCHAR(3) NOT NULL DEFAULT 'ETB',
    ADD COLUMN `currencyRate` DECIMAL(65, 30) NOT NULL DEFAULT 1.0;

-- AlterTable
ALTER TABLE `invoicepayment` ADD COLUMN `currencyCode` VARCHAR(3) NOT NULL DEFAULT 'ETB',
    ADD COLUMN `currencyRate` DECIMAL(65, 30) NOT NULL DEFAULT 1.0;

-- AddForeignKey
ALTER TABLE `fund_transfer` ADD CONSTRAINT `fund_transfer_fromAccountId_fkey` FOREIGN KEY (`fromAccountId`) REFERENCES `bankaccount`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fund_transfer` ADD CONSTRAINT `fund_transfer_toAccountId_fkey` FOREIGN KEY (`toAccountId`) REFERENCES `bankaccount`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
