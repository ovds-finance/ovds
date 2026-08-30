-- DropIndex
DROP INDEX `AuditLog_companyId_createdAt_idx` ON `auditlog`;

-- DropIndex
DROP INDEX `Invoice_companyId_date_idx` ON `invoice`;

-- CreateIndex
CREATE INDEX `AuditLog_companyId_createdAt_idx` ON `auditlog`(`companyId`, `createdAt` DESC);

-- CreateIndex
CREATE INDEX `Invoice_companyId_date_idx` ON `invoice`(`companyId`, `date` DESC);

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `Invoice_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_order_line` ADD CONSTRAINT `SalesOrderLine_SalesOrderId_fkey` FOREIGN KEY (`SalesOrderId`) REFERENCES `sales_order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RedefineIndex
CREATE INDEX `SalesOrderLine_SalesOrderId_idx` ON `sales_order_line`(`SalesOrderId`);
DROP INDEX `sales_order_line_SalesOrderId_idx` ON `sales_order_line`;

-- RedefineIndex
CREATE INDEX `StockTransaction_itemId_fkey` ON `stocktransaction`(`itemId`);
DROP INDEX `StockTransaction_itemId_idx` ON `stocktransaction`;
