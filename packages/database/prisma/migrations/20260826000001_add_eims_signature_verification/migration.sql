-- AlterTable: record the outcome of verifying the MoR's cryptographic receipt.
--
-- Nullable on purpose: existing rows were registered before verification was
-- wired, and NULL is the correct "not attempted" state (it is also what is
-- recorded when no trusted MoR certificate is provisioned). Backfilling these
-- to 0/false would falsely mark historical acknowledgements as tampered.
ALTER TABLE eims_registration
  ADD COLUMN signatureVerified BOOLEAN NULL,
  ADD COLUMN signatureVerifiedAt DATETIME NULL;
