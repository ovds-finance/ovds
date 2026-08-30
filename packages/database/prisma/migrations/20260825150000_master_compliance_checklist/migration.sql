-- Create master_compliance_checklist table
CREATE TABLE IF NOT EXISTS master_compliance_checklist (
  id              VARCHAR(36)   NOT NULL PRIMARY KEY,
  companyId       VARCHAR(36)   NOT NULL,
  title           VARCHAR(200)  NOT NULL,
  status          VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
  bspName         VARCHAR(200)  NULL,
  bspTin          VARCHAR(50)   NULL,
  testingLocation VARCHAR(200)  NULL,
  systemType      VARCHAR(50)   NULL,
  systemName      VARCHAR(200)  NULL,
  hostingType     VARCHAR(100)  NULL,
  versionBuild    VARCHAR(100)  NULL,
  testedEnv       VARCHAR(100)  NULL,
  testDate        DATETIME      NULL,
  releaseDate     DATETIME      NULL,
  testerName      VARCHAR(200)  NULL,
  testerSignature TEXT          NULL,
  createdAt       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mcc_company (companyId),
  INDEX idx_mcc_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create master_compliance_item table
CREATE TABLE IF NOT EXISTS master_compliance_item (
  id           VARCHAR(36)   NOT NULL PRIMARY KEY,
  checklistId  VARCHAR(36)   NOT NULL,
  sectionKey   VARCHAR(50)   NOT NULL,
  itemKey      VARCHAR(50)   NOT NULL,
  itemText     TEXT          NOT NULL,
  status       VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
  resultData   TEXT          NULL,
  remarks      TEXT          NULL,
  createdAt    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mci_checklist (checklistId),
  INDEX idx_mci_section (sectionKey),
  INDEX idx_mci_status (status),
  CONSTRAINT fk_mci_checklist FOREIGN KEY (checklistId) REFERENCES master_compliance_checklist(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
