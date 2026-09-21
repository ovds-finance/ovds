-- Add subdomain column to Company for tenant resolution via Host header
-- Cross-platform: works on PostgreSQL and MySQL/MariaDB
ALTER TABLE company ADD COLUMN subdomain VARCHAR(100) NULL UNIQUE;
