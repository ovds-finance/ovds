-- Add buyer details support for B2B transactions (EIMS compliance)
-- Captures full buyer party structure required by MoR for B2B invoice registration

-- Add buyerDetails JSON column to invoice table
ALTER TABLE invoice ADD COLUMN buyerDetails LONGTEXT NULL;

-- Add buyerAddress JSON column to customer table (for reusable buyer address structure)
ALTER TABLE customer ADD COLUMN buyerAddress LONGTEXT NULL;

-- Add indexes for the new JSON columns is not needed (JSON columns in MySQL cannot be indexed directly without virtual columns)
-- The buyerDetails is queried via invoice ID or customerId which are already indexed
