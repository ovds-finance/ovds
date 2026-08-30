/**
 * Master Compliance Checklist — EIRMS pre-rollout compliance verification
 * Static template data seeded per checklist session.
 */

export interface MasterComplianceItemSeed {
  sectionKey: string;
  itemKey: string;
  itemText: string;
}

export const MASTER_COMPLIANCE_CHECKLIST_TEMPLATE: MasterComplianceItemSeed[] = [
  // General Information
  {
    sectionKey: 'general',
    itemKey: 'GEN-01',
    itemText: 'BSP Name/Taxpayer Name: _______________',
  },
  {
    sectionKey: 'general',
    itemKey: 'GEN-02',
    itemText: 'BSP /Taxpayer TIN: _______________',
  },
  {
    sectionKey: 'general',
    itemKey: 'GEN-03',
    itemText: 'Testing Location: _______________',
  },
  {
    sectionKey: 'general',
    itemKey: 'GEN-04',
    itemText: 'Service/system Type (SaaS / On-Premises S-POS / Aggregator / Hardware POS): _______________',
  },
  {
    sectionKey: 'general',
    itemKey: 'GEN-05',
    itemText: 'System Name: _______________',
  },
  {
    sectionKey: 'general',
    itemKey: 'GEN-06',
    itemText: 'Hosting / Deployment Type (Cloud / Desktop / Local Server / Device): _______________',
  },
  {
    sectionKey: 'general',
    itemKey: 'GEN-07',
    itemText: 'Version / Build: _______________',
  },
  {
    sectionKey: 'general',
    itemKey: 'GEN-08',
    itemText: 'Tested Environment (Sandbox / manual): _______________',
  },
  {
    sectionKey: 'general',
    itemKey: 'GEN-09',
    itemText: 'Test Date: _______________',
  },
  {
    sectionKey: 'general',
    itemKey: 'GEN-10',
    itemText: 'Release Date: _______________',
  },

  // Invoice Registration
  {
    sectionKey: 'invoice_registration',
    itemKey: 'IRC-P01',
    itemText: 'Register B2C Sales Invoice Without Buyer TIN and With VAT: Prepare sells document, input data for multiple items with different VAT rate (VAT0, VAT15, VATEX), issue the invoice, print the full layout invoice. Verify QR code is scannable and invoice details correctly displayed in mobile app.',
  },
  {
    sectionKey: 'invoice_registration',
    itemKey: 'IRC-P02',
    itemText: 'Register B2B Sales Invoice with Buyer TIN and Legal Name: Prepare B2B sales invoice with buyer TIN and legal name, input multiple items with discount, excise tax, and withholding amount, issue and print invoice. Verify QR code scannable. System should reject invalid buyer TIN/legal name.',
  },

  // Receipt Registration
  {
    sectionKey: 'receipt_registration',
    itemKey: 'IRC-P03',
    itemText: 'Register Sales Receipt from a registered invoice: Register an invoice, generate and send a sales receipt, receive RRN confirmation, print receipt with QR code and RRN. Verify receipt details match original invoice.',
  },
  {
    sectionKey: 'receipt_registration',
    itemKey: 'IRC-P04',
    itemText: 'Register Withhold Receipt from a registered invoice: Register an invoice, generate and send a withhold receipt, receive RRN confirmation, print receipt with QR code and RRN. Verify receipt details match original invoice.',
  },

  // Credit Memo
  {
    sectionKey: 'credit_memo',
    itemKey: 'IRC-P06',
    itemText: 'Register Credit Memo from a registered invoice: Register credit memo, send to EIRMS, confirm registration, print with QR code and IRN. Verify credit memo amount does not exceed original invoice value.',
  },

  // Cancel Invoice
  {
    sectionKey: 'cancel_invoice',
    itemKey: 'IRC-P05',
    itemText: 'Cancel Registered Invoice: Initiate cancellation request for previously registered invoices, receive confirmation, verify status updated in back office. System should reject cancellation of already-cancelled invoices.',
  },

  // Debit Memo
  {
    sectionKey: 'debit_memo',
    itemKey: 'IRC-P07',
    itemText: 'Register Debit Memo from a registered invoice: Register debit memo, send to EIRMS, confirm registration, print with QR code and IRN. System should reject debit memo for unregistered/invalid invoice.',
  },

  // Negative Tests
  {
    sectionKey: 'negative_tests',
    itemKey: 'IRC-N08',
    itemText: 'Negative Test: Register B2B Sales Invoice with Invalid Buyer TIN or Legal Name: System should display error message and halt transaction when invalid buyer TIN (e.g., 000000000) or legal name is entered.',
  },
  {
    sectionKey: 'negative_tests',
    itemKey: 'IRC-N09',
    itemText: 'Negative Test: Generate a Receipt from a Non-existent or Cancelled Invoice: System should display error and block receipt generation for non-existent or cancelled invoice IRNs.',
  },
  {
    sectionKey: 'negative_tests',
    itemKey: 'IRC-N010',
    itemText: 'Negative Test: Cancel a non-existent or already Cancelled invoice: System should validate invoice status and display error preventing cancellation of invalid or duplicate requests.',
  },

  // Notification Service
  {
    sectionKey: 'notification_service',
    itemKey: 'ADD-N001',
    itemText: 'Notification Service: Conduct invoice registration, cancellation, debit, and credit operations with buyer having registered email and phone. Confirm notifications received within 5 minutes via SMS or email stating action, date/time, invoice number, and reason.',
  },

  // Setup and Configuration
  {
    sectionKey: 'setup_configuration',
    itemKey: 'ADD-C001',
    itemText: 'Setup and Configuration: System securely maintains access credentials and keys. Only administrator users can set up, view, and modify system information and parameters. Credentials saved in encrypted form.',
  },

  // Printing Layout
  {
    sectionKey: 'printing_layout',
    itemKey: 'ADD-P001',
    itemText: 'Printing layout and content: Print all supported invoice and receipt types. Verify printouts from normal and thermal printers contain all necessary data and are visually appealing and clearly legible.',
  },

  // System Type: SaaS SP
  {
    sectionKey: 'system_saas',
    itemKey: 'SAAS-01',
    itemText: 'Performance: Response time <2s per API call',
  },
  {
    sectionKey: 'system_saas',
    itemKey: 'SAAS-02',
    itemText: 'Performance: Handles ≥50 concurrent users',
  },
  {
    sectionKey: 'system_saas',
    itemKey: 'SAAS-03',
    itemText: 'Performance: Automatic retry on API timeout',
  },
  {
    sectionKey: 'system_saas',
    itemKey: 'SAAS-04',
    itemText: 'Security: HTTPS/TLS enforced',
  },
  {
    sectionKey: 'system_saas',
    itemKey: 'SAAS-05',
    itemText: 'Security: Credentials encrypted & not hard-coded',
  },
  {
    sectionKey: 'system_saas',
    itemKey: 'SAAS-06',
    itemText: 'Security: Role-based access (Admin/User/Viewer)',
  },
  {
    sectionKey: 'system_saas',
    itemKey: 'SAAS-07',
    itemText: 'Reliability: Daily backups & restore tested',
  },
  {
    sectionKey: 'system_saas',
    itemKey: 'SAAS-08',
    itemText: 'Reliability: Monitoring alerts active',
  },
  {
    sectionKey: 'system_saas',
    itemKey: 'SAAS-09',
    itemText: 'Reliability: Auto health-check system',
  },
  {
    sectionKey: 'system_saas',
    itemKey: 'SAAS-10',
    itemText: 'Architecture: Multi-tenant isolation per TIN/Sub-TIN/Branches',
  },
  {
    sectionKey: 'system_saas',
    itemKey: 'SAAS-11',
    itemText: 'Architecture: CI/CD with rollback',
  },
  {
    sectionKey: 'system_saas',
    itemKey: 'SAAS-12',
    itemText: 'Architecture: Monitoring tools (ELK, Grafana)',
  },
  {
    sectionKey: 'system_saas',
    itemKey: 'SAAS-13',
    itemText: 'Offline Mode: Issues invoices offline',
  },
  {
    sectionKey: 'system_saas',
    itemKey: 'SAAS-14',
    itemText: 'Offline Mode: Automatic resend after reconnecting',
  },

  // System Type: On-Premises S-POS
  {
    sectionKey: 'system_onprem',
    itemKey: 'ONPREM-01',
    itemText: 'Performance: Invoice submission <2s',
  },
  {
    sectionKey: 'system_onprem',
    itemKey: 'ONPREM-02',
    itemText: 'Performance: Multi-user operation supported',
  },
  {
    sectionKey: 'system_onprem',
    itemKey: 'ONPREM-03',
    itemText: 'Security: Local roles configured (Admin/Cashier)',
  },
  {
    sectionKey: 'system_onprem',
    itemKey: 'ONPREM-04',
    itemText: 'Security: Credentials encrypted',
  },
  {
    sectionKey: 'system_onprem',
    itemKey: 'ONPREM-05',
    itemText: 'Security: Activity logs available',
  },
  {
    sectionKey: 'system_onprem',
    itemKey: 'ONPREM-06',
    itemText: 'Reliability: Backup & restore tested',
  },
  {
    sectionKey: 'system_onprem',
    itemKey: 'ONPREM-07',
    itemText: 'Reliability: Data integrity maintained',
  },
  {
    sectionKey: 'system_onprem',
    itemKey: 'ONPREM-08',
    itemText: 'Offline Mode: Issues invoices offline',
  },
  {
    sectionKey: 'system_onprem',
    itemKey: 'ONPREM-09',
    itemText: 'Offline Mode: Automatic resend after reconnecting',
  },
  {
    sectionKey: 'system_onprem',
    itemKey: 'ONPREM-10',
    itemText: 'Integration: Connects to EIMS via API/middleware',
  },
  {
    sectionKey: 'system_onprem',
    itemKey: 'ONPREM-11',
    itemText: 'Integration: Source numbers mapped correctly',
  },

  // System Type: Aggregator
  {
    sectionKey: 'system_aggregator',
    itemKey: 'AGG-01',
    itemText: 'Scalability: Handles large number of merchants',
  },
  {
    sectionKey: 'system_aggregator',
    itemKey: 'AGG-02',
    itemText: 'Security: Merchant data isolation enforced',
  },
  {
    sectionKey: 'system_aggregator',
    itemKey: 'AGG-03',
    itemText: 'Security: Separate database schema or encrypted tenant partitioning',
  },
  {
    sectionKey: 'system_aggregator',
    itemKey: 'AGG-04',
    itemText: 'Security: End-to-end encryption + per-merchant encryption keys',
  },
  {
    sectionKey: 'system_aggregator',
    itemKey: 'AGG-05',
    itemText: 'Reliability: Published uptime SLA ≥ 99.9% with proven DR site',
  },
  {
    sectionKey: 'system_aggregator',
    itemKey: 'AGG-06',
    itemText: 'Reliability: Centralized backup & restore tested',
  },
  {
    sectionKey: 'system_aggregator',
    itemKey: 'AGG-07',
    itemText: 'Performance: Per-merchant rate-limit handling (no global throttling)',
  },
  {
    sectionKey: 'system_aggregator',
    itemKey: 'AGG-08',
    itemText: 'Visibility: Real-time merchant-specific dashboard & alerts',
  },
  {
    sectionKey: 'system_aggregator',
    itemKey: 'AGG-09',
    itemText: 'Traceability: Merchant-specific identifier numbers/TIN for every merchant and branch',
  },
  {
    sectionKey: 'system_aggregator',
    itemKey: 'AGG-10',
    itemText: 'Traceability: System traces every transaction/invoice back to exact merchant and physical branch/location',
  },
  {
    sectionKey: 'system_aggregator',
    itemKey: 'AGG-11',
    itemText: 'Exit clause: Full data export & deletion within 30 days',
  },
  {
    sectionKey: 'system_aggregator',
    itemKey: 'AGG-12',
    itemText: 'Offline Mode: Issues invoices offline',
  },
  {
    sectionKey: 'system_aggregator',
    itemKey: 'AGG-13',
    itemText: 'Offline Mode: Automatic resend after reconnecting',
  },

  // System Type: Hardware POS
  {
    sectionKey: 'system_hardware_pos',
    itemKey: 'HPOS-01',
    itemText: 'Device serial registered',
  },
  {
    sectionKey: 'system_hardware_pos',
    itemKey: 'HPOS-02',
    itemText: 'Secure firmware and boot loader',
  },
  {
    sectionKey: 'system_hardware_pos',
    itemKey: 'HPOS-03',
    itemText: 'Invoice processed <3s',
  },
  {
    sectionKey: 'system_hardware_pos',
    itemKey: 'HPOS-04',
    itemText: '24-hour continuous operation',
  },
  {
    sectionKey: 'system_hardware_pos',
    itemKey: 'HPOS-05',
    itemText: 'PIN/Fingerprint login enabled',
  },
  {
    sectionKey: 'system_hardware_pos',
    itemKey: 'HPOS-06',
    itemText: 'Data encrypted in memory and transfer',
  },
  {
    sectionKey: 'system_hardware_pos',
    itemKey: 'HPOS-07',
    itemText: 'Battery/UPS protection present',
  },
  {
    sectionKey: 'system_hardware_pos',
    itemKey: 'HPOS-08',
    itemText: 'Auto resume after power loss',
  },
  {
    sectionKey: 'system_hardware_pos',
    itemKey: 'HPOS-09',
    itemText: 'Communicates with EIMS',
  },
  {
    sectionKey: 'system_hardware_pos',
    itemKey: 'HPOS-10',
    itemText: 'SMS and Email sent to buyer for every transaction and paper print option available on demand',
  },

  // Additional Applicable Tests
  {
    sectionKey: 'additional_tests',
    itemKey: 'ADD-E01',
    itemText: 'System Overview: What are the services/functionalities of the System? Provide brief of architecture, components/sub-systems, and their interaction with invoicing service.',
  },
  {
    sectionKey: 'additional_tests',
    itemKey: 'ADD-E02',
    itemText: 'Latest DR test report + redundancy diagram',
  },
  {
    sectionKey: 'additional_tests',
    itemKey: 'ADD-E03',
    itemText: 'Deployment: Own infrastructure / Rental',
  },
  {
    sectionKey: 'additional_tests',
    itemKey: 'ADD-E04',
    itemText: 'If rental, ownership model: Own bare metal / Colocation rental / Dedicated hosting / VPS/Cloud IaaS',
  },
  {
    sectionKey: 'additional_tests',
    itemKey: 'ADD-E05',
    itemText: 'Datacenter service tier: Tier I / Tier II / Tier III / Tier IV',
  },
  {
    sectionKey: 'additional_tests',
    itemKey: 'ADD-E06',
    itemText: 'Deployment location: DC Name, Campus, Pod/Rack',
  },
  {
    sectionKey: 'additional_tests',
    itemKey: 'ADD-E07',
    itemText: 'Overall Integration System Architecture: Monolithic / Micro-service-based / Hybrid / Interfaced components',
  },
  {
    sectionKey: 'additional_tests',
    itemKey: 'ADD-E08',
    itemText: 'Communication with API Gateway: Web service',
  },
  {
    sectionKey: 'additional_tests',
    itemKey: 'ADD-E09',
    itemText: 'Offline storage and resend capability',
  },
  {
    sectionKey: 'additional_tests',
    itemKey: 'ADD-E10',
    itemText: 'Sub-TIN (branch-level) management',
  },
  {
    sectionKey: 'additional_tests',
    itemKey: 'ADD-E11',
    itemText: 'Automatic NTP time sync',
  },
  {
    sectionKey: 'additional_tests',
    itemKey: 'ADD-E12',
    itemText: 'Legal name and TIN validation',
  },

  // Rental Evidence Table
  {
    sectionKey: 'rental_evidence',
    itemKey: 'RENT-01',
    itemText: 'Legal name of service provider: _______________ (Attach company registration)',
  },
  {
    sectionKey: 'rental_evidence',
    itemKey: 'RENT-02',
    itemText: 'TIN and License Number: TIN _______________ License No. _______________ (Attach certificates)',
  },
  {
    sectionKey: 'rental_evidence',
    itemKey: 'RENT-03',
    itemText: 'DARA identifier for contract: _______________ (Attach agreement)',
  },
  {
    sectionKey: 'rental_evidence',
    itemKey: 'RENT-04',
    itemText: 'Signed MSA / Contract: Attached (Must show scope, duration, payment)',
  },
  {
    sectionKey: 'rental_evidence',
    itemKey: 'RENT-05',
    itemText: 'Compliance with local data residency law: Yes / N/A (Attach legal opinion if required)',
  },

  // Architectural Model
  {
    sectionKey: 'arch_model',
    itemKey: 'ARCH-01',
    itemText: 'Architectural Model: Monolithic / Micro-service-based / Interfaced components',
  },

  // Component Tables
  {
    sectionKey: 'component_tables',
    itemKey: 'COMP-01',
    itemText: 'Component Name, Version, Purpose, Source (D/P/OS), Vendor & TIN, Permit, Origin, Hash, Doc (Y/N), IP Cert (Y/N)',
  },

  // Legal, Compliance & Agreement Requirements
  {
    sectionKey: 'legal_compliance',
    itemKey: 'LEGAL-01',
    itemText: 'Audit logs retained for ≥ 90 days',
  },
  {
    sectionKey: 'legal_compliance',
    itemKey: 'LEGAL-02',
    itemText: 'SLA uptime ≥ 99.5% (Signed SLA with uptime commitment)',
  },
  {
    sectionKey: 'legal_compliance',
    itemKey: 'LEGAL-03',
    itemText: 'Signed SLA and support plan in place (Executed SLA document)',
  },
  {
    sectionKey: 'legal_compliance',
    itemKey: 'LEGAL-04',
    itemText: 'Data ownership clearly retained by taxpayer (Clause in agreement explicitly stating ownership)',
  },
  {
    sectionKey: 'legal_compliance',
    itemKey: 'LEGAL-05',
    itemText: '24/7 support contact channels available',
  },
  {
    sectionKey: 'legal_compliance',
    itemKey: 'LEGAL-06',
    itemText: 'Exit policy & data export mechanism defined',
  },
  {
    sectionKey: 'legal_compliance',
    itemKey: 'LEGAL-07',
    itemText: 'Maintenance agreement signed',
  },
  {
    sectionKey: 'legal_compliance',
    itemKey: 'LEGAL-08',
    itemText: 'Dedicated support contacts provided',
  },
  {
    sectionKey: 'legal_compliance',
    itemKey: 'LEGAL-09',
    itemText: 'Signed merchant/service provider agreements (All relevant executed agreements)',
  },
  {
    sectionKey: 'legal_compliance',
    itemKey: 'LEGAL-10',
    itemText: 'Firmware/software update process defined (All relevant executed agreements/document)',
  },
  {
    sectionKey: 'legal_compliance',
    itemKey: 'LEGAL-11',
    itemText: 'Technical support details documented & shared (Support handbook / SOP shared with client)',
  },
];
