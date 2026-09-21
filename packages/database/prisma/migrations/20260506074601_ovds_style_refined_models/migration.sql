/*
  Warnings:

  - You are about to drop the column `unitPrice` on the `billitem` table. All the data in the column will be lost.
  - You are about to drop the column `paymentCurrency` on the `customer` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `invoiceitem` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `item` table. All the data in the column will be lost.
  - Added the required column `purchasePrice` to the `billitem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salePrice` to the `invoiceitem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `billitem` DROP COLUMN `unitPrice`,
    ADD COLUMN `purchasePrice` DECIMAL(65, 30) NOT NULL;

-- AlterTable
ALTER TABLE `company` ADD COLUMN `currencyCode` VARCHAR(3) NULL DEFAULT 'ETB';

-- AlterTable
ALTER TABLE `customer` DROP COLUMN `paymentCurrency`,
    ADD COLUMN `currencyCode` VARCHAR(3) NULL DEFAULT 'ETB';

-- AlterTable
ALTER TABLE `invoiceitem` DROP COLUMN `price`,
    ADD COLUMN `salePrice` DECIMAL(65, 30) NOT NULL;

-- AlterTable
ALTER TABLE `item` DROP COLUMN `price`,
    ADD COLUMN `salePrice` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000;

-- AlterTable
ALTER TABLE `vendor` ADD COLUMN `currencyCode` VARCHAR(3) NULL DEFAULT 'ETB';
