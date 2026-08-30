-- CreateTable
CREATE TABLE eims_summary_report (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    companyId VARCHAR(36) NOT NULL,
    reportType VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    periodStart DATETIME NOT NULL,
    periodEnd DATETIME NOT NULL,
    sellerTin VARCHAR(10) NOT NULL,
    sellerLegalName VARCHAR(200) NOT NULL,
    totalInvoiceCount INT NOT NULL DEFAULT 0,
    totalInvoiceValue DECIMAL(18,2) NOT NULL DEFAULT 0,
    totalTaxValue DECIMAL(18,2) NOT NULL DEFAULT 0,
    totalValueWithTax DECIMAL(18,2) NOT NULL DEFAULT 0,
    requestPayload LONGTEXT NULL,
    responsePayload LONGTEXT NULL,
    reportReference VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    errorMessage VARCHAR(1000) NULL,
    submissionMode VARCHAR(10) NOT NULL DEFAULT 'stub',
    submittedAt DATETIME NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX eims_summary_report_companyId_idx (companyId),
    INDEX eims_summary_report_sellerTin_idx (sellerTin),
    INDEX eims_summary_report_status_idx (status),
    INDEX eims_summary_report_periodStart_periodEnd_idx (periodStart, periodEnd)
);

-- CreateEnum (if needed for type safety, MySQL stores as VARCHAR)
