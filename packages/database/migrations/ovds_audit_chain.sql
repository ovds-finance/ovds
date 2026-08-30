-- OVDS Immutable Audit Ledger Chain Table
-- Required for AABE compliance: tamper-proof audit tracking
CREATE TABLE IF NOT EXISTS audit_ledger_chain (
    id              VARCHAR(36)      NOT NULL PRIMARY KEY,
    companyId       VARCHAR(36)      NOT NULL,
    entityType      VARCHAR(50)      NOT NULL,
    entityId        VARCHAR(36)      NOT NULL,
    dataHash        VARCHAR(64)      NOT NULL,
    previousHash    VARCHAR(64)      NULL,
    chainHash       VARCHAR(64)      NOT NULL,
    createdAt       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_ledger_chain_company (companyId),
    INDEX idx_audit_ledger_chain_entity (entityType, entityId),
    INDEX idx_audit_ledger_chain_created (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
