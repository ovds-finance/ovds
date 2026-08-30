/**
 * Sales Registration Systems Accreditation Checklist
 * Directive No. 1142/2026 compliance verification
 * Static template data seeded per accreditation session.
 */

export interface AccreditationItemSeed {
  sectionKey: string;
  itemKey: string;
  itemText: string;
  itemType?: 'requirement' | 'compliance_ref';
  refSection?: string;
}

export const ACCREDITATION_CHECKLIST_TEMPLATE: AccreditationItemSeed[] = [
  // Section 4: Required Documentation Checklist
  {
    sectionKey: 'documentation',
    itemKey: 'DOC-a',
    itemText: 'Valid Business License — Must have a valid business license registered in Ethiopia and provide its copy.',
  },
  {
    sectionKey: 'documentation',
    itemKey: 'DOC-b',
    itemText: 'Business Sector — Provide Evidence that the business is engaged in software development, consultancy, or related services.',
  },
  {
    sectionKey: 'documentation',
    itemKey: 'DOC-c',
    itemText: 'Software Rights — Must provide confirmation that the applicant has the legal right to renew and update the authorized software.',
  },
  {
    sectionKey: 'documentation',
    itemKey: 'DOC-d',
    itemText: 'Qualified Support Professionals — Must hold at least a Degree in CS, SE, or related fields from a recognized Ethiopian institution.',
  },
  {
    sectionKey: 'documentation',
    itemKey: 'DOC-e',
    itemText: 'Security Clearance — Provides a certificate of assurance confirming IT Security Standards compliance from INSA.',
  },
  {
    sectionKey: 'documentation',
    itemKey: 'DOC-f',
    itemText: 'Performance Guarantee — Provide a performance guarantee based on Article 14 (bank or insurance, renewable every two years).',
  },
  {
    sectionKey: 'documentation',
    itemKey: 'DOC-g',
    itemText: 'Software Requirements Specification (SRS) — Provide SRS document describing software, technology stack, last update date, and integrations.',
  },
  {
    sectionKey: 'documentation',
    itemKey: 'DOC-h',
    itemText: 'Checklist — Provide a completed checklist indicating the system number used for inspection and date/time of testing.',
  },

  // Section 5.1: General Conditions (Article 4)
  {
    sectionKey: 'article4_general',
    itemKey: '5.1.1',
    itemText: 'The system is capable of transmitting/receiving transaction data via the Authority\'s Electronic Invoice Registration System.',
  },
  {
    sectionKey: 'article4_general',
    itemKey: '5.1.1.1',
    itemText: 'Invoice/receipt contains the minimum contents listed under Article 20 of VAT Regulation No. 570/2024.',
  },
  {
    sectionKey: 'article4_general',
    itemKey: '5.1.1.2',
    itemText: 'System transmits accurate data in real-time and correctly displays the response to the user.',
  },
  {
    sectionKey: 'article4_general',
    itemKey: '5.1.1.3',
    itemText: 'System issues receipt only upon receiving a valid IRN, RRN, and QR Code from the Authority.',
  },
  {
    sectionKey: 'article4_general',
    itemKey: '5.1.1.4',
    itemText: 'System accurately prints/displays the IRN, RRN, and QR Code in a legible format.',
  },
  {
    sectionKey: 'article4_general',
    itemKey: '5.1.1.5',
    itemText: 'System correctly identifies applicable tax types and calculates them accurately.',
  },
  {
    sectionKey: 'article4_general',
    itemKey: '5.1.1.6',
    itemText: 'System accurately transmits registration requests based on receipt type and displays responses.',
  },
  {
    sectionKey: 'article4_general',
    itemKey: '5.1.1.7',
    itemText: 'System accurately transmits a cancellation request when a receipt is voided and displays the response.',
  },
  {
    sectionKey: 'article4_general',
    itemKey: '5.1.1.8',
    itemText: 'System accurately implements invoice types and calculates tax types for its targeted taxpayers.',
  },
  {
    sectionKey: 'article4_general',
    itemKey: '5.1.1.9',
    itemText: 'System can send a registered receipt to the buyer via digital options (email, SMS, etc.) and provide a printed copy upon request.',
  },

  // Section 5.1.2: Data Exchange, Storage, and Security
  {
    sectionKey: 'article4_data_exchange',
    itemKey: '5.1.2.1',
    itemText: 'System allows ONLY authorized users to configure connection data/encryption keys; others are restricted.',
  },
  {
    sectionKey: 'article4_data_exchange',
    itemKey: '5.1.2.2',
    itemText: 'System records an audit log tracking data exchanges, user activities, timestamps, and user identity.',
  },
  {
    sectionKey: 'article4_data_exchange',
    itemKey: '5.1.2.3',
    itemText: 'System enables the Tax Authority to extract, view, and audit data at any time.',
  },
  {
    sectionKey: 'article4_data_exchange',
    itemKey: '5.1.2.4',
    itemText: 'System has sufficient storage capacity to retain tax information for the duration prescribed by law.',
  },
  {
    sectionKey: 'article4_data_exchange',
    itemKey: '5.1.2.5',
    itemText: 'System shall support the use of digital signatures.',
  },

  // Section 5.1.3: Utilization and Operational Readiness
  {
    sectionKey: 'article4_operational',
    itemKey: '5.1.3.1',
    itemText: 'System allows entry of TIN, address, and identifiers ONLY during the initial operational readiness (On-Boarding) stage.',
  },
  {
    sectionKey: 'article4_operational',
    itemKey: '5.1.3.2',
    itemText: 'System features a Role-Based Access Control (RBAC) mechanism tailored to user roles.',
  },
  {
    sectionKey: 'article4_operational',
    itemKey: '5.1.3.3',
    itemText: 'System displays appropriate error messages during operational or technical difficulties.',
  },
  {
    sectionKey: 'article4_operational',
    itemKey: '5.1.3.4',
    itemText: 'System grants access only through username/password or other authorized authentication methods.',
  },

  // Section 5.1.5: Mobile POS Requirements
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.1.1',
    itemText: '[mPOS] System is in full compliance with Article 4, sub-articles 1 to 3 and 6.',
    itemType: 'compliance_ref',
  },
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.2.1',
    itemText: '[mPOS] Device is capable of periodically reporting its Geo-location to the Authority at defined intervals.',
  },
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.2.2',
    itemText: '[mPOS] Device records the exact Geo-location (latitude and longitude) of the transaction at the time of sale.',
  },
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.2.3',
    itemText: '[mPOS] Geo-location data is included within the receipt registration message sent to the Authority.',
  },
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.2.4',
    itemText: '[mPOS] Geo-location data is recorded in the audit log for each transaction.',
  },
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.2.5',
    itemText: '[mPOS] System provides a mechanism for the taxpayer to view the Geo-location history of transactions.',
  },
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.2.6',
    itemText: '[mPOS] System allows the Authority to access Geo-location data upon request.',
  },
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.3.1',
    itemText: '[mPOS] Device operates only within the authorized Geo-fenced work area(s) defined by the taxpayer.',
  },
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.3.2',
    itemText: '[mPOS] System prevents transaction processing if the device is located outside the authorized Geo-fenced area.',
  },
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.3.3',
    itemText: '[mPOS] System displays a clear warning/error message when the device is outside the authorized Geo-fenced area.',
  },
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.3.4',
    itemText: '[mPOS] System provides an administrative function to define and update Geo-fenced work areas.',
  },
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.3.5',
    itemText: '[mPOS] System supports multiple Geo-fenced areas for different branches or work locations.',
  },
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.3.6',
    itemText: '[mPOS] System logs all Geo-fencing violations for audit purposes.',
  },
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.4.1',
    itemText: '[mPOS] The applicant provides a list of approved/supported mobile devices and operating system versions.',
  },
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.4.2',
    itemText: '[mPOS] System supports both Android and iOS platforms (where applicable).',
  },
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.4.3',
    itemText: '[mPOS] System provides minimum hardware requirements for mobile devices (RAM, storage, processor).',
  },
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.4.4',
    itemText: '[mPOS] System is optimized for mobile screen sizes and touch-based user interfaces.',
  },
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.4.5',
    itemText: '[mPOS] System supports multiple screen resolutions and orientations (portrait/landscape).',
  },
  {
    sectionKey: 'article4_mpos',
    itemKey: '5.1.5.4.6',
    itemText: '[mPOS] System supports integration with mobile device peripherals (barcode scanners, card readers, etc.).',
  },

  // Section 5.1.6: Hardware POS Requirements
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.1.1',
    itemText: '[Hardware POS] System is in full compliance with Article 4, sub-articles 1 to 3 and 6.',
    itemType: 'compliance_ref',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.3.1',
    itemText: '[Hardware POS] System demonstrates stable performance under normal transaction volumes.',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.3.4',
    itemText: '[Hardware POS] System provides error handling and recovery mechanisms for hardware failures.',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.5.1',
    itemText: '[Hardware POS] System requires user authentication before granting access.',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.5.3',
    itemText: '[Hardware POS] System supports session time-out and automatic logout after inactivity.',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.5.4',
    itemText: '[Hardware POS] System logs all user login/logout activities.',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.5.5',
    itemText: '[Hardware POS] All communication between POS terminal and central server/Authority is encrypted.',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.5.6',
    itemText: '[Hardware POS] System has a mechanism to prevent unauthorized access to stored transaction data.',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.5.7',
    itemText: '[Hardware POS] System provides audit trail of all transactions and user activities.',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.6.1',
    itemText: '[Hardware POS] System prints receipts with IRN, RRN, and QR Code in a legible format.',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.6.2',
    itemText: '[Hardware POS] System prints receipts with all required contents per Article 20 of VAT Regulation No. 570/2024.',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.6.3',
    itemText: '[Hardware POS] System supports receipt re-printing when needed.',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.6.4',
    itemText: '[Hardware POS] System provides printer status monitoring (paper low, offline, out of paper).',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.6.5',
    itemText: '[Hardware POS] System can send digital receipts to the buyer via email or SMS.',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.7.7',
    itemText: '[Hardware POS] System provides transaction history and search functionality.',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.8.2',
    itemText: '[Hardware POS] System provides a mechanism for the client to apply software updates and patches.',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.8.3',
    itemText: '[Hardware POS] System includes a version control mechanism to track updates and ensure compliance.',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.8.4',
    itemText: '[Hardware POS] System provides a logging mechanism for all administrative actions.',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.8.5',
    itemText: '[Hardware POS] The applicant provides a documented technical support plan.',
  },
  {
    sectionKey: 'article4_hardware_pos',
    itemKey: '5.1.6.8.6',
    itemText: '[Hardware POS] The applicant provides training materials and documentation for staff and end-users.',
  },

  // Section 5.2: SaaS Licensing (Article 5)
  {
    sectionKey: 'article5_saas',
    itemKey: '5.2.1',
    itemText: '[SaaS] System is in full compliance with Article 4, sub-articles 1 to 3 and 6.',
    itemType: 'compliance_ref',
  },
  {
    sectionKey: 'article5_saas',
    itemKey: '5.2.2',
    itemText: '[SaaS] System maintains user taxpayer data securely and in isolation; possesses necessary data management controls.',
  },
  {
    sectionKey: 'article5_saas',
    itemKey: '5.2.3',
    itemText: '[SaaS] System enables taxpayers to fully export their data, migrate to another provider, and delete migrated data.',
  },
  {
    sectionKey: 'article5_saas',
    itemKey: '5.2.4',
    itemText: '[SaaS] System supports Data Replication across at least two datacenters for continuity.',
  },
  {
    sectionKey: 'article5_saas',
    itemKey: '5.2.5',
    itemText: '[SaaS] Taxpayer data is secure and inaccessible to any party other than the Authority, provider, and taxpayer.',
  },
  {
    sectionKey: 'article5_saas',
    itemKey: '5.2.6',
    itemText: '[SaaS] (If applicable) Mobile sales devices comply with Article 4, sub-article 5.',
  },
  {
    sectionKey: 'article5_saas',
    itemKey: '5.2.7',
    itemText: '[SaaS] Provide a service enabling the Authority to access and use information upon request.',
  },
  {
    sectionKey: 'article5_saas',
    itemKey: '5.2.8.1',
    itemText: '[SaaS] Data center located within Ethiopia.',
  },
  {
    sectionKey: 'article5_saas',
    itemKey: '5.2.8.2',
    itemText: '[SaaS] Data center meets Tier III (Level 3) design standards (owned or leased).',
  },
  {
    sectionKey: 'article5_saas',
    itemKey: '5.2.8.3',
    itemText: '[SaaS] Has a reliable and redundant data communication link connecting to the Electronic Invoice Registration System.',
  },
  {
    sectionKey: 'article5_saas',
    itemKey: '5.2.8.4',
    itemText: '[SaaS] Has registered Public IP Addresses.',
  },
  {
    sectionKey: 'article5_saas',
    itemKey: '5.2.8.5',
    itemText: '[SaaS] Has sufficient internet bandwidth.',
  },
  {
    sectionKey: 'article5_saas',
    itemKey: '5.2.8.6',
    itemText: '[SaaS] Capable of providing services through more than one data center (redundancy).',
  },
  {
    sectionKey: 'article5_saas',
    itemKey: '5.2.9.1',
    itemText: '[SaaS] Must have a structured support center providing services via Website.',
  },
  {
    sectionKey: 'article5_saas',
    itemKey: '5.2.9.2',
    itemText: '[SaaS] Must have a structured support center providing services via Telephone.',
  },

  // Section 5.3: E-commerce/Digital Marketplace (Article 6)
  {
    sectionKey: 'article6_ecommerce',
    itemKey: '5.3.1',
    itemText: '[E-commerce] System is in full compliance with Article 4, sub-articles 1 to 3 and 6.',
    itemType: 'compliance_ref',
  },
  {
    sectionKey: 'article6_ecommerce',
    itemKey: '5.3.2',
    itemText: '[E-commerce] System can separately register market-user taxpayers and notify the Authority.',
  },
  {
    sectionKey: 'article6_ecommerce',
    itemKey: '5.3.3',
    itemText: '[E-commerce] Interaction and data exchange between market-users and the platform are secure.',
  },
  {
    sectionKey: 'article6_ecommerce',
    itemKey: '5.3.4',
    itemText: '[E-commerce] System allows the Authority to suspend and reinstate market-user taxpayers.',
  },
  {
    sectionKey: 'article6_ecommerce',
    itemKey: '5.3.5',
    itemText: '[E-commerce] Invoice accurately displays the information of the seller/service provider.',
  },
  {
    sectionKey: 'article6_ecommerce',
    itemKey: '5.3.6',
    itemText: '[E-commerce] For transactions with multiple sellers, each can issue an individual receipt using their own TIN, address, and name.',
  },
  {
    sectionKey: 'article6_ecommerce',
    itemKey: '5.3.7',
    itemText: '[E-commerce] Receipts may be displayed/printed together, provided each individual receipt content is clearly shown.',
  },

  // Section 5.4: General Licensing Conditions (Article 7)
  {
    sectionKey: 'article7_general_license',
    itemKey: '5.4.1',
    itemText: '[General License] Licensing is granted upon full compliance with Article 4, sub-articles 1 to 3 and 6.',
    itemType: 'compliance_ref',
  },
  {
    sectionKey: 'article7_general_license',
    itemKey: '5.4.2',
    itemText: '[General License] (If applicable) Offline mode licensing is granted upon compliance with Article 4, sub-article 4.',
  },
  {
    sectionKey: 'article7_general_license',
    itemKey: '5.4.3',
    itemText: '[General License] (If applicable) Mobile device licensing is granted upon compliance with Article 4, sub-article 5.',
  },

  // Section 5.5: Taxpayer's Exclusive Use (Article 8)
  {
    sectionKey: 'article8_exclusive_use',
    itemKey: '5.5.1',
    itemText: '[Exclusive Use] Licensing for exclusive use is granted upon full compliance with Article 4, sub-articles 1 to 3 and 6.',
    itemType: 'compliance_ref',
  },
  {
    sectionKey: 'article8_exclusive_use',
    itemKey: '5.5.2',
    itemText: '[Exclusive Use] (If applicable) Offline mode licensing is granted upon compliance with Article 4, sub-article 4.',
  },
  {
    sectionKey: 'article8_exclusive_use',
    itemKey: '5.5.3',
    itemText: '[Exclusive Use] (If applicable) Mobile devices comply with Article 4, sub-article 5.',
  },

  // Section 5.6: Pre-conditions for Testing (Article 9)
  {
    sectionKey: 'article9_testing',
    itemKey: '5.6.1',
    itemText: '[Testing] System has passed verification tests on the testing system.',
  },
  {
    sectionKey: 'article9_testing',
    itemKey: '5.6.2',
    itemText: '[Testing] System identification number (System Number), time of testing, and completed checklist are submitted.',
  },
  {
    sectionKey: 'article9_testing',
    itemKey: '5.6.3.a',
    itemText: '[Testing] Detailed description of system functionalities and service types.',
  },
  {
    sectionKey: 'article9_testing',
    itemKey: '5.6.3.b',
    itemText: '[Testing] Software design documents.',
  },
  {
    sectionKey: 'article9_testing',
    itemKey: '5.6.3.c',
    itemText: '[Testing] List and version of technologies used to develop the system.',
  },
  {
    sectionKey: 'article9_testing',
    itemKey: '5.6.3.d',
    itemText: '[Testing] List of technology/equipment required for deployment and operation.',
  },
  {
    sectionKey: 'article9_testing',
    itemKey: '5.6.3.e',
    itemText: '[Testing] System version and date of the last update.',
  },
  {
    sectionKey: 'article9_testing',
    itemKey: '5.6.3.f',
    itemText: '[Testing] (If integrated) Document showing data exchange and integration with other services/devices.',
  },
  {
    sectionKey: 'article9_testing',
    itemKey: '5.6.3.g',
    itemText: '[Testing] Document specifying invoice types, services, and statement of requirements.',
  },
  {
    sectionKey: 'article9_testing',
    itemKey: '5.6.3.h',
    itemText: '[Testing] Clear statement of any third-party intellectual property rights, open-source components, or components not developed by the supplier.',
  },

  // Section 6: Client-Managed (On-Premise) ERP and POS Systems
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.1.1',
    itemText: '[On-Premise] System is in full compliance with Article 4, sub-articles 1 to 3 and 6.',
    itemType: 'compliance_ref',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.2.1',
    itemText: '[On-Premise] System can be deployed on the taxpayer\'s own servers or on-premise infrastructure.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.2.2',
    itemText: '[On-Premise] System provides detailed hardware and software requirements for deployment.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.2.3',
    itemText: '[On-Premise] System supports installation on standard operating systems (Windows Server, Linux, etc.).',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.2.4',
    itemText: '[On-Premise] System provides a documented installation and configuration guide.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.2.5',
    itemText: '[On-Premise] System supports both physical and virtual server environments.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.3.1',
    itemText: '[On-Premise] All transaction and tax data is stored locally on the taxpayer\'s infrastructure.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.3.2',
    itemText: '[On-Premise] System provides built-in database backup and recovery mechanisms.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.3.3',
    itemText: '[On-Premise] System supports automated scheduled backups of all transaction and tax data.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.3.4',
    itemText: '[On-Premise] System provides data encryption capabilities for stored data (at-rest encryption).',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.3.5',
    itemText: '[On-Premise] System enables the Tax Authority to extract, view, and audit data directly from local installation.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.3.6',
    itemText: '[On-Premise] System maintains an audit trail of all data access and modifications.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.4.1',
    itemText: '[On-Premise] System provides an administrative dashboard for managing users, roles, and permissions.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.4.2',
    itemText: '[On-Premise] System supports RBAC with granular permissions (cashier, manager, admin, auditor).',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.4.3',
    itemText: '[On-Premise] System provides a mechanism for the client to apply software updates and patches.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.4.4',
    itemText: '[On-Premise] System includes a version control mechanism to track updates and ensure compliance.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.4.5',
    itemText: '[On-Premise] System provides a logging mechanism for all administrative actions.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.5.1',
    itemText: '[On-Premise] System supports multiple branches or locations from a single administrative console.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.5.2',
    itemText: '[On-Premise] System provides centralized reporting across all branches.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.5.3',
    itemText: '[On-Premise] System supports synchronized inventory management across multiple branches.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.5.4',
    itemText: '[On-Premise] System provides branch-level access controls and permissions.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.6.1',
    itemText: '[On-Premise] System includes integrated inventory management with real-time stock updates.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.6.2',
    itemText: '[On-Premise] System includes financial and accounting modules (cash flow, A/R, A/P, general ledger).',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.6.3',
    itemText: '[On-Premise] System provides real-time reporting and analytics dashboards.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.6.4',
    itemText: '[On-Premise] System supports employee and staff management features (attendance, commissions, roles).',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.6.5',
    itemText: '[On-Premise] System provides comprehensive audit trails for all financial and inventory transactions.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.7.1',
    itemText: '[On-Premise] The applicant provides a documented technical support plan.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.7.2',
    itemText: '[On-Premise] The applicant provides remote diagnostic and troubleshooting support.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.7.3',
    itemText: '[On-Premise] The applicant provides guaranteed response times for critical system issues.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.7.4',
    itemText: '[On-Premise] The applicant provides training materials and documentation for IT staff and end-users.',
  },
  {
    sectionKey: 'onprem_erp_pos',
    itemKey: '6.7.5',
    itemText: '[On-Premise] The applicant provides a documented update and patch management schedule.',
  },
];

export const ACCREDITATION_SECTION_META: Record<string, { label: string; directive: string; icon: string }> = {
  documentation: { label: 'Required Documentation', directive: 'Article 3', icon: 'FILE_TEXT' },
  article4_general: { label: 'General Conditions', directive: 'Article 4 §1', icon: 'SETTINGS' },
  article4_data_exchange: { label: 'Data Exchange, Storage & Security', directive: 'Article 4 §2', icon: 'SHIELD' },
  article4_operational: { label: 'Utilization & Operational Readiness', directive: 'Article 4 §3', icon: 'CHECK_CIRCLE' },
  article4_mpos: { label: 'Mobile POS (mPOS) Requirements', directive: 'Article 4 §5', icon: 'SMARTPHONE' },
  article4_hardware_pos: { label: 'Hardware POS Requirements', directive: 'Article 4 §6', icon: 'MONITOR' },
  article5_saas: { label: 'SaaS Licensing', directive: 'Article 5', icon: 'CLOUD' },
  article6_ecommerce: { label: 'E-commerce / Digital Marketplace', directive: 'Article 6', icon: 'SHOPPING_CART' },
  article7_general_license: { label: 'General Licensing Conditions', directive: 'Article 7', icon: 'AWARD' },
  article8_exclusive_use: { label: "Taxpayer's Exclusive Use", directive: 'Article 8', icon: 'USER_CHECK' },
  article9_testing: { label: 'Pre-conditions for Testing', directive: 'Article 9', icon: 'FLASK' },
  onprem_erp_pos: { label: 'Client-Managed (On-Premise) ERP/POS', directive: 'Section 6', icon: 'SERVER' },
};

export const ACCREDITATION_SECTION_ORDER = [
  'documentation',
  'article4_general',
  'article4_data_exchange',
  'article4_operational',
  'article4_mpos',
  'article4_hardware_pos',
  'article5_saas',
  'article6_ecommerce',
  'article7_general_license',
  'article8_exclusive_use',
  'article9_testing',
  'onprem_erp_pos',
];
