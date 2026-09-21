-- Add manualReceiptNumber to EimsReceipt
ALTER TABLE eims_receipt ADD COLUMN manualReceiptNumber VARCHAR(50) NULL AFTER receiptNumber;
