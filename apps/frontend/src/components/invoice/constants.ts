export const PAYMENT_METHODS = [
  { value: 'CASH',          label: 'Cash',           icon: '💵' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer',  icon: '🏦' },
  { value: 'CHAPA',         label: 'Chapa (Online)', icon: '💳' },
  { value: 'TELECOM',       label: 'Ethio Telecom',  icon: '📱' },
  { value: 'MOBILE_MONEY',  label: 'Mobile Money',   icon: '📲' },
  { value: 'CHEQUE',        label: 'Cheque',         icon: '📄' },
  { value: 'CREDIT_CARD',   label: 'Credit Card',    icon: '💳' },
  { value: 'P2P',           label: 'P2P Transfer',   icon: '🔄' },
  { value: 'O2O',           label: 'O2O Payment',    icon: '🏧' },
  { value: 'OTHER',         label: 'Other',          icon: '🔁' },
];

// -----------------------------------------------------------------------------
// INTEGRATION TYPE TAXONOMY
// Covers: NBE payment flows, architecture patterns, business process types,
// and data exchange categories — used for compliance tagging, audit trails,
// and MoR reporting across all OVDS modules.
// -----------------------------------------------------------------------------

/** NBE-defined payment interaction flows (who pays whom) */
export const NBE_INTERACTION_TYPES = [
  { value: 'P2P',  label: 'Person-to-Person',       short: 'P2P',  icon: '👤↔👤', description: 'Direct transfer between individuals via Telebirr, CBE Birr, etc.' },
  { value: 'O2O',  label: 'Online-to-Offline',       short: 'O2O',  icon: '📱→🏪', description: 'Digital payment at a physical merchant (QR scan at POS)' },
  { value: 'P2M',  label: 'Person-to-Merchant',      short: 'P2M',  icon: '👤→🏬', description: 'Consumer pays a registered business' },
  { value: 'M2P',  label: 'Merchant-to-Person',      short: 'M2P',  icon: '🏬→👤', description: 'Business refund or disbursement to individual' },
  { value: 'B2B',  label: 'Business-to-Business',    short: 'B2B',  icon: '🏢↔🏢', description: 'Inter-business settlement or supplier payment' },
  { value: 'B2C',  label: 'Business-to-Consumer',    short: 'B2C',  icon: '🏢→👤', description: 'Business payment to end customer (salary, refund)' },
  { value: 'C2B',  label: 'Consumer-to-Business',    short: 'C2B',  icon: '👤→🏢', description: 'Customer invoice or service payment to business' },
  { value: 'G2P',  label: 'Government-to-Person',    short: 'G2P',  icon: '🏛→👤', description: 'Government disbursement, subsidy, or social transfer' },
  { value: 'P2G',  label: 'Person-to-Government',    short: 'P2G',  icon: '👤→🏛', description: 'Tax, fee, or penalty payment to government (MoR/ERCA)' },
  { value: 'G2B',  label: 'Government-to-Business',  short: 'G2B',  icon: '🏛→🏢', description: 'Government procurement payment or grant to business' },
  { value: 'B2G',  label: 'Business-to-Government',  short: 'B2G',  icon: '🏢→🏛', description: 'Corporate tax, VAT remittance, or license fee' },
  { value: 'A2A',  label: 'Account-to-Account',      short: 'A2A',  icon: '🏦↔🏦', description: 'Internal or inter-bank account transfer (RTGS/EFT)' },
];

/** Architecture / connectivity patterns — how systems exchange data */
export const ARCH_INTEGRATION_TYPES = [
  { value: 'REST_API',    label: 'REST API',           icon: '🔌', description: 'HTTP/JSON synchronous request-response (most common)' },
  { value: 'WEBHOOK',     label: 'Webhook',            icon: '🪝', description: 'Event-driven HTTP push from external system to OVDS' },
  { value: 'BATCH_FILE',  label: 'Batch / File',       icon: '📂', description: 'Scheduled CSV/XML/XLSX file exchange (e.g. bank statements)' },
  { value: 'SFTP',        label: 'SFTP Transfer',      icon: '📡', description: 'Secure file transfer protocol for bank/MoR data feeds' },
  { value: 'MESSAGE_Q',   label: 'Message Queue',      icon: '📨', description: 'Async messaging via RabbitMQ, Kafka, or SQS' },
  { value: 'SOAP_WS',     label: 'SOAP Web Service',   icon: '🧼', description: 'Legacy XML/WSDL web service (some Ethiopian banks)' },
  { value: 'DIRECT_DB',   label: 'Direct DB Link',     icon: '🗄️', description: 'Database-level integration via shared schema or replication' },
  { value: 'EDI',         label: 'EDI',                icon: '📋', description: 'Electronic Data Interchange for structured B2B documents' },
  { value: 'SCREEN_SCRAPE', label: 'Screen Scrape',    icon: '🖥️', description: 'HTML parsing of bank portals (e.g. Telebirr receipt fetch)' },
  { value: 'SDK',         label: 'SDK / Library',      icon: '📦', description: 'Embedded vendor SDK (e.g. Telebirr merchant SDK)' },
  { value: 'MANUAL',      label: 'Manual Entry',       icon: '✍️', description: 'Human-entered data with no automated integration' },
];

/** Business process integration categories — what the data exchange achieves */
export const PROCESS_INTEGRATION_TYPES = [
  { value: 'PAYMENT_INIT',    label: 'Payment Initiation',     icon: '🚀', description: 'Triggering a payment from OVDS to a bank/telecom' },
  { value: 'PAYMENT_CONFIRM', label: 'Payment Confirmation',   icon: '✅', description: 'Receiving confirmation that a payment was processed' },
  { value: 'RECEIPT_FETCH',   label: 'Receipt Retrieval',      icon: '🧾', description: 'Fetching transaction receipt from Telebirr or bank portal' },
  { value: 'RECONCILE',       label: 'Reconciliation',         icon: '⚖️', description: 'Matching OVDS records against bank statement data' },
  { value: 'TIN_VALIDATE',    label: 'TIN Validation',         icon: '🛡️', description: 'MoR registry lookup to verify taxpayer identity' },
  { value: 'VAT_REPORT',      label: 'VAT Reporting',          icon: '📊', description: 'Submitting VAT declarations to ERCA/MoR' },
  { value: 'INVOICE_SEND',    label: 'Invoice Delivery',       icon: '📤', description: 'Sending invoice to customer via email, SMS, or portal' },
  { value: 'PAYROLL_DISBURSE',label: 'Payroll Disbursement',   icon: '💰', description: 'Bulk salary transfer to employee bank/telecom accounts' },
  { value: 'INVENTORY_SYNC',  label: 'Inventory Sync',         icon: '📦', description: 'Syncing stock levels with POS or warehouse system' },
  { value: 'CRM_SYNC',        label: 'CRM Sync',               icon: '🤝', description: 'Customer data sync between OVDS and CRM platform' },
  { value: 'ERP_SYNC',        label: 'ERP Integration',        icon: '🏭', description: 'Bidirectional data exchange with ERP (SAP, Odoo, etc.)' },
  { value: 'AUDIT_EXPORT',    label: 'Audit / Compliance Export', icon: '📑', description: 'Exporting transaction logs for NBE/MoR audit trail' },
  { value: 'FRAUD_CHECK',     label: 'Fraud / Duplicate Check', icon: '🔍', description: 'Real-time duplicate and fraud detection against payment refs' },
  { value: 'NOTIFY',          label: 'Notification / Alert',   icon: '🔔', description: 'SMS, email, or push notification triggered by payment event' },
  { value: 'LOAN_DISBURSE',   label: 'Loan Disbursement',      icon: '🏦', description: 'Bank loan or microovds disbursement to business account' },
  { value: 'DISASTER_LEVY',   label: 'Disaster Fund Levy',     icon: '🆘', description: 'Automated deduction and remittance of disaster fund levy' },
];

/** Combined flat list for dropdowns / selectors that need all types */
export const ALL_INTEGRATION_TYPES = [
  ...NBE_INTERACTION_TYPES.map(t => ({ ...t, category: 'NBE Payment Flow' })),
  ...ARCH_INTEGRATION_TYPES.map(t => ({ ...t, category: 'Architecture' })),
  ...PROCESS_INTEGRATION_TYPES.map(t => ({ ...t, category: 'Business Process' })),
];

/** Milliseconds per day — used in DSO, aging, due-date, and recurring calculations */
export const MS_PER_DAY = 86_400_000;
