-- AddForeignKey
ALTER TABLE `revenue` ADD CONSTRAINT `revenue_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `bankaccount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `bankaccount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
