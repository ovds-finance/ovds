<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)
     📌 ARCHITECTURE: [docs/ARCHITECTURE.md](../ARCHITECTURE.md)
     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)
     ⚙️ GENERATED FILE — do not edit by hand. -->

# Data Model Reference

> **Generated file — do not edit.**
> Source of truth: [`packages/database/prisma/schema.prisma`](../../packages/database/prisma/schema.prisma)
> Regenerate with `npm run docs:schema`. CI verifies freshness with `npm run docs:schema:check`.

**Schema fingerprint:** `c66b619492c8`

---

## 1. Overview

| Property | Value |
|----------|-------|
| Datasource provider | `mysql` |
| Models | 325 |
| Enums | 81 |
| Migrations applied to history | 36 |
| Tenant-scoped models (`companyId`) | 242 |
| Global / shared models | 74 |

The datasource URL is supplied at runtime through `PRISMA_DATABASE_URL` and the
`@prisma/adapter-mariadb` driver adapter — it is deliberately absent from the schema.

### Generators

| Generator | Provider | Output |
|-----------|----------|--------|
| `client` | `prisma-client-js` | default |
| `zod` | `zod-prisma-types` | `../../contracts/src/prisma-zod` |

---

## 2. Multi-tenancy audit

OVDS isolates tenants with `companyId` + `CompanyGuard`. Every query against a
tenant-scoped model **must** filter on `companyId`. This section is generated
directly from the schema so drift is visible in review.

⚠️ **12 model(s) carry `companyId` without a leading `companyId` index.**
Tenant-filtered reads on these tables cannot use an index prefix and will degrade as data grows.

| Model | Table | Existing indexes |
|-------|-------|------------------|
| `CompanyTaxProfile` | `company_tax_profile` | `[vatTotBand, incomeTaxSchedule]`, `[sector]` |
| `ContractSnapshot` | `contract_snapshot` | `[contractRef, companyId]`, `[invoiceId]` |
| `DispatchDocketLine` | `dispatch_docket_line` | `[DispatchDocketId]`, `[SalesOrderLineId]`, `[ItemId]` |
| `FinancialTracking` | `financial_tracking` | _none_ |
| `FraudLog` | `fraudlog` | `[customerLoyaltyId]`, `[decision]` |
| `LoyaltyRedemption` | `loyaltyredemption` | `[customerLoyaltyId]`, `[rewardId]`, `[transactionId]` |
| `NotificationTemplate` | `notificationtemplate` | _none_ |
| `OcrExtraction` | `ocr_extraction` | `[sourceType, sourceId]`, `[receiptUrl]` |
| `ProjectMilestone` | `project_milestone` | `[projectId]`, `[status]` |
| `ProjectTask` | `project_task` | `[projectId]`, `[milestoneId]`, `[status]`, `[assignedTo]`, `[billingStyle]` |
| `ProjectTimesheet` | `project_timesheet` | `[projectId]`, `[taskId]`, `[date]` |
| `ReceiptStorage` | `receipt_storage` | `[sourceType, sourceId]` |

### Global (non-tenant) models

These models have no `companyId`. Confirm each is genuinely cross-tenant
(reference data, platform config, or audit) before querying it in tenant code.

`App` · `ArrearConfig` · `ArrearType` · `Attendance` · `AuditComment` · `AuditFinding` · `BiometricData` · `BomLine` · `CapitalizationDecision` · `Company` · `Currency` · `currencyrate` · `DisasterFundAuditLog` · `DisasterFundNote` · `DisasterFundRemittance` · `DisasterFundReport` · `DisasterFundSchedule` · `DisasterFundTarget` · `DocArticle` · `EntityGroup` · `FeatureFlag` · `fileattachment` · `FinancialCycle` · `ForexApproval` · `fxdifference` · `Holiday` · `HsTariffEntry` · `IntercompanyElimination` · `InterCompanyTransaction` · `LeaseJournalEntry` · `LeaseModification` · `LeasePayment` · `Leave` · `Module` · `ModuleManifest` · `ModuleVersion` · `MonetizationProduct` · `OnboardingResponse` · `OtpCode` · `PartnershipCustomer` · `PartnershipMember` · `PerformanceObligation` · `PipelineStage` · `PropertyAssessment` · `RecognitionScheduleRow` · `Release` · `RemeasurementJournal` · `RevenueAllocation` · `RoleAppAccess` · `RolePermission` · `SalesOrderShipToAddress` · `SectorTaxOverride` · `SecurityFinding` · `SecurityScan` · `Session` · `SettingCategory` · `SettingGroup` · `SettingInput` · `SoftwareAmortizationRow` · `systemsetting` · `TaxAuditLog` · `TaxGlAccount` · `taxrate` · `TaxRule` · `TelecomReceiptCache` · `TokenBlacklist` · `TradeDocument` · `TradeShipmentStep` · `UserApp` · `UserRole` · `VatLineItem` · `WebhookDelivery` · `workflowtaskrun` · `WorkOrderOutput`

---

## 3. Model index

| Model | Table | Tenant | Fields | Relations | Indexes | Timestamps |
|-------|-------|--------|-------:|----------:|--------:|------------|
| [`Account`](#account) | `account` | ✅ | 13 | 6 | 3 | ✅ |
| [`AccrualPosting`](#accrualposting) | `accrual_posting` | ✅ | 8 | 2 | 3 | — |
| [`AccrualPrepayment`](#accrualprepayment) | `accrual_prepayment` | ✅ | 18 | 1 | 2 | ✅ |
| [`AdminCreatedMenuItem`](#admincreatedmenuitem) | `admincreatedmenuitem` | ✅ | 15 | 1 | 1 | ✅ |
| [`App`](#app) | `app` | — | 16 | 4 | 0 | ✅ |
| [`AppInstallation`](#appinstallation) | `app_installation` | ✅ | 9 | 2 | 4 | — |
| [`ArrearConfig`](#arrearconfig) | `arrearconfig` | — | 14 | 2 | 2 | ✅ |
| [`ArrearType`](#arreartype) | `arreartype` | — | 6 | 1 | 0 | ✅ |
| [`AssetLiabilityLoop`](#assetliabilityloop) | `asset_liability_loop` | ✅ | 10 | 1 | 2 | ✅ |
| [`Attendance`](#attendance) | `attendance` | — | 13 | 1 | 3 | — |
| [`AuditComment`](#auditcomment) | `auditcomment` | — | 5 | 1 | 1 | — |
| [`AuditEngagement`](#auditengagement) | `auditengagement` | ✅ | 17 | 4 | 2 | ✅ |
| [`AuditFinding`](#auditfinding) | `auditfinding` | — | 11 | 1 | 1 | ✅ |
| [`AuditFirm`](#auditfirm) | `auditfirm` | ✅ | 14 | 2 | 1 | ✅ |
| [`AuditLog`](#auditlog) | `auditlog` | ✅ | 6 | 1 | 5 | — |
| [`BankAccount`](#bankaccount) | `bankaccount` | ✅ | 13 | 10 | 3 | ✅ |
| [`BankFeed`](#bankfeed) | `bankfeed` | ✅ | 11 | 2 | 3 | ✅ |
| [`BankFxRate`](#bankfxrate) | `bankfxrate` | ✅ | 9 | 1 | 4 | ✅ |
| [`BankMatchingRule`](#bankmatchingrule) | `bankmatchingrule` | ✅ | 12 | 1 | 2 | ✅ |
| [`BankPayrollExport`](#bankpayrollexport) | `bank_payroll_export` | ✅ | 14 | 0 | 3 | — |
| [`BankStatementLine`](#bankstatementline) | `bank_statement_line` | ✅ | 11 | 1 | 2 | ✅ |
| [`BankTransaction`](#banktransaction) | `banktransaction` | ✅ | 24 | 6 | 8 | — |
| [`BankTransactionFx`](#banktransactionfx) | `banktransactionfx` | ✅ | 13 | 2 | 2 | ✅ |
| [`BatchPayout`](#batchpayout) | `batch_payout` | ✅ | 14 | 1 | 2 | ✅ |
| [`Bill`](#bill) | `bill` | ✅ | 35 | 8 | 8 | ✅ |
| [`BillItem`](#billitem) | `billitem` | ✅ | 10 | 3 | 3 | — |
| [`BillPayment`](#billpayment) | `billpayment` | ✅ | 14 | 5 | 3 | — |
| [`BiometricData`](#biometricdata) | `biometricdata` | — | 5 | 1 | 1 | — |
| [`BomHeader`](#bomheader) | `bom_header` | ✅ | 9 | 2 | 1 | ✅ |
| [`BomLine`](#bomline) | `bom_line` | — | 8 | 1 | 0 | — |
| [`Budget`](#budget) | `budget` | ✅ | 15 | 1 | 4 | ✅ |
| [`BusinessLoan`](#businessloan) | `businessloan` | ✅ | 35 | 3 | 4 | ✅ |
| [`CapitalizationDecision`](#capitalizationdecision) | `capitalization_decision` | — | 7 | 1 | 0 | — |
| [`CargoManifest`](#cargomanifest) | `cargo_manifest` | ✅ | 16 | 0 | 2 | ✅ |
| [`CashForecast`](#cashforecast) | `cashforecast` | ✅ | 13 | 1 | 1 | ✅ |
| [`Category`](#category) | `category` | ✅ | 8 | 6 | 2 | ✅ |
| [`ClientNode`](#clientnode) | `client_node` | ✅ | 8 | 1 | 2 | — |
| [`CollectionCase`](#collectioncase) | `collectioncase` | ✅ | 13 | 3 | 3 | ✅ |
| [`Company`](#company) | `company` | — | 20 | 133 | 0 | — |
| [`CompanyFeatureFlag`](#companyfeatureflag) | `company_feature_flag` | ✅ | 4 | 2 | 2 | — |
| [`CompanyModule`](#companymodule) | `company_module` | ✅ | 8 | 2 | 3 | ✅ |
| [`CompanyRelease`](#companyrelease) | `company_release` | ✅ | 5 | 2 | 2 | — |
| [`CompanyTaxProfile`](#companytaxprofile) | `company_tax_profile` | ✅ | 35 | 1 | 2 | ✅ |
| [`ContractSnapshot`](#contractsnapshot) | `contract_snapshot` | ✅ | 8 | 4 | 2 | — |
| [`CostCenter`](#costcenter) | `cost_center` | ✅ | 13 | 1 | 2 | ✅ |
| [`CreditHold`](#credithold) | `credithold` | ✅ | 7 | 2 | 2 | — |
| [`CrmActivity`](#crmactivity) | `crm_activity` | ✅ | 16 | 0 | 4 | ✅ |
| [`CrmCompany`](#crmcompany) | `crm_company` | ✅ | 19 | 0 | 2 | ✅ |
| [`CrmContact`](#crmcontact) | `crm_contact` | ✅ | 29 | 0 | 3 | ✅ |
| [`CrmDeal`](#crmdeal) | `crmdeal` | ✅ | 17 | 0 | 3 | ✅ |
| [`CrmPipeline`](#crmpipeline) | `crm_pipeline` | ✅ | 11 | 0 | 1 | ✅ |
| [`Currency`](#currency) | `currency` | — | 8 | 0 | 0 | ✅ |
| [`currencyrate`](#currencyrate) | `currencyrate` | — | 6 | 0 | 1 | — |
| [`Customer`](#customer) | `customer` | ✅ | 21 | 11 | 3 | ✅ |
| [`CustomerInteraction`](#customerinteraction) | `customerinteraction` | ✅ | 9 | 1 | 2 | — |
| [`CustomerLoyalty`](#customerloyalty) | `customerloyalty` | ✅ | 10 | 5 | 4 | ✅ |
| [`CustomField`](#customfield) | `custom_field` | ✅ | 15 | 2 | 1 | ✅ |
| [`CustomFieldValue`](#customfieldvalue) | `custom_field_value` | ✅ | 7 | 2 | 3 | ✅ |
| [`CustomsDeclaration`](#customsdeclaration) | `customs_declaration` | ✅ | 38 | 0 | 4 | ✅ |
| [`DebitNote`](#debitnote) | `debitnote` | ✅ | 16 | 1 | 4 | ✅ |
| [`Deduction`](#deduction) | `deduction` | ✅ | 12 | 3 | 3 | — |
| [`DeliveryPerformance`](#deliveryperformance) | `delivery_performance` | ✅ | 10 | 2 | 2 | ✅ |
| [`Department`](#department) | `department` | ✅ | 7 | 3 | 2 | — |
| [`DepreciationSchedule`](#depreciationschedule) | `depreciation_schedule` | ✅ | 13 | 0 | 5 | — |
| [`DeviceControlChangeRequest`](#devicecontrolchangerequest) | `device_control_change_request` | ✅ | 16 | 0 | 2 | ✅ |
| [`DeviceControlPolicy`](#devicecontrolpolicy) | `device_control_policy` | ✅ | 10 | 0 | 2 | ✅ |
| [`DisasterFundAuditLog`](#disasterfundauditlog) | `disasterfundauditlog` | — | 8 | 0 | 1 | — |
| [`DisasterFundContribution`](#disasterfundcontribution) | `disasterfundcontribution` | ✅ | 13 | 1 | 4 | ✅ |
| [`DisasterFundNote`](#disasterfundnote) | `disasterfundnote` | — | 5 | 0 | 1 | — |
| [`DisasterFundRemittance`](#disasterfundremittance) | `disasterfundremittance` | — | 9 | 0 | 1 | — |
| [`DisasterFundReport`](#disasterfundreport) | `disasterfundreport` | — | 13 | 0 | 1 | — |
| [`DisasterFundSchedule`](#disasterfundschedule) | `disasterfundschedule` | — | 10 | 0 | 2 | ✅ |
| [`DisasterFundTarget`](#disasterfundtarget) | `disasterfundtarget` | — | 7 | 0 | 2 | ✅ |
| [`DispatchDocket`](#dispatchdocket) | `dispatch_docket` | ✅ | 12 | 5 | 4 | ✅ |
| [`DispatchDocketLine`](#dispatchdocketline) | `dispatch_docket_line` | ✅ | 15 | 2 | 3 | ✅ |
| [`DocArticle`](#docarticle) | `doc_article` | — | 12 | 0 | 3 | ✅ |
| [`DualNodeVerification`](#dualnodeverification) | `dual_node_verification` | ✅ | 10 | 1 | 2 | ✅ |
| [`EclProvision`](#eclprovision) | `ecl_provision` | ✅ | 10 | 1 | 2 | ✅ |
| [`EimsBulkJob`](#eimsbulkjob) | `eims_bulk_job` | ✅ | 14 | 0 | 3 | ✅ |
| [`EimsCertificate`](#eimscertificate) | `eims_certificate` | ✅ | 15 | 1 | 4 | ✅ |
| [`EimsReceipt`](#eimsreceipt) | `eims_receipt` | ✅ | 15 | 0 | 4 | ✅ |
| [`EimsRegistration`](#eimsregistration) | `eims_registration` | ✅ | 22 | 1 | 6 | ✅ |
| [`EimsSourceSystem`](#eimssourcesystem) | `eims_source_system` | ✅ | 19 | 3 | 3 | ✅ |
| [`EliminationEntry`](#eliminationentry) | `elimination_entry` | ✅ | 10 | 1 | 2 | ✅ |
| [`Employee`](#employee) | `employee` | ✅ | 42 | 16 | 4 | ✅ |
| [`EmployeeBenefitObligation`](#employeebenefitobligation) | `employeebenefitobligation` | ✅ | 15 | 0 | 2 | ✅ |
| [`Entity`](#entity) | `entity` | ✅ | 8 | 1 | 2 | ✅ |
| [`EntityGroup`](#entitygroup) | `entity_group` | — | 6 | 3 | 0 | ✅ |
| [`ETaxSubmissionRecord`](#etaxsubmissionrecord) | `etax_submission_record` | ✅ | 19 | 0 | 4 | ✅ |
| [`ExciseTaxFiling`](#excisetaxfiling) | `excise_tax_filing` | ✅ | 13 | 0 | 2 | — |
| [`ExciseTaxRecord`](#excisetaxrecord) | `excise_tax_record` | ✅ | 22 | 0 | 3 | — |
| [`ExpenseClaim`](#expenseclaim) | `expense_claim` | ✅ | 15 | 0 | 2 | ✅ |
| [`FeatureEntitlement`](#featureentitlement) | `feature_entitlement` | ✅ | 7 | 1 | 2 | ✅ |
| [`FeatureFlag`](#featureflag) | `feature_flag` | — | 6 | 1 | 0 | ✅ |
| [`fileattachment`](#fileattachment) | `fileattachment` | — | 10 | 0 | 1 | — |
| [`FinancialCycle`](#financialcycle) | `financialcycle` | — | 12 | 0 | 0 | ✅ |
| [`FinancialStatementTemplate`](#financialstatementtemplate) | `financial_statement_template` | ✅ | 11 | 1 | 2 | ✅ |
| [`FinancialTracking`](#financialtracking) | `financial_tracking` | ✅ | 7 | 1 | 0 | — |
| [`FiscalYear`](#fiscalyear) | `fiscalyear` | ✅ | 14 | 3 | 3 | ✅ |
| [`FixedAsset`](#fixedasset) | `fixed_asset` | ✅ | 15 | 0 | 2 | ✅ |
| [`FixedAssetDisposal`](#fixedassetdisposal) | `fixed_asset_disposal` | ✅ | 12 | 1 | 2 | ✅ |
| [`ForeignTaxCredit`](#foreigntaxcredit) | `foreign_tax_credit` | ✅ | 18 | 0 | 3 | ✅ |
| [`ForexApproval`](#forexapproval) | `forex_approval` | — | 14 | 1 | 2 | ✅ |
| [`FraudLog`](#fraudlog) | `fraudlog` | ✅ | 11 | 1 | 2 | — |
| [`FundTransfer`](#fundtransfer) | `fund_transfer` | ✅ | 13 | 4 | 2 | ✅ |
| [`fxdifference`](#fxdifference) | `fxdifference` | — | 15 | 1 | 1 | ✅ |
| [`FxRate`](#fxrate) | `fx_rate` | ✅ | 8 | 1 | 2 | ✅ |
| [`GeographicTaxRule`](#geographictaxrule) | `geographic_tax_rule` | ✅ | 11 | 1 | 2 | ✅ |
| [`GoodsReceivedNote`](#goodsreceivednote) | `goodsreceivednote` | ✅ | 14 | 1 | 4 | ✅ |
| [`GraduateTaxDeduction`](#graduatetaxdeduction) | `graduate_tax_deduction` | ✅ | 11 | 1 | 3 | — |
| [`GraduateTaxEmployee`](#graduatetaxemployee) | `graduate_tax_employee` | ✅ | 18 | 2 | 3 | ✅ |
| [`GratuityRecord`](#gratuityrecord) | `gratuity_record` | ✅ | 23 | 1 | 3 | — |
| [`GrnItem`](#grnitem) | `grnitem` | ✅ | 11 | 1 | 3 | — |
| [`Holiday`](#holiday) | `holiday` | — | 4 | 0 | 0 | — |
| [`HsTariffEntry`](#hstariffentry) | `hs_tariff_entry` | — | 15 | 0 | 2 | ✅ |
| [`Ifrs15Schedule`](#ifrs15schedule) | `ifrs15_schedule` | ✅ | 13 | 1 | 2 | ✅ |
| [`IfrsGlJournal`](#ifrsgljournal) | `ifrs_gl_journal` | ✅ | 12 | 3 | 4 | — |
| [`IfrsReportingBalance`](#ifrsreportingbalance) | `ifrs_reporting_balance` | ✅ | 12 | 0 | 2 | — |
| [`ifrsstandard`](#ifrsstandard) | `ifrsstandard` | ✅ | 12 | 1 | 2 | ✅ |
| [`ImportAdvanceTax`](#importadvancetax) | `import_advance_tax` | ✅ | 16 | 0 | 3 | ✅ |
| [`ImportShipment`](#importshipment) | `import_shipment` | ✅ | 30 | 0 | 5 | ✅ |
| [`IncomeTaxFiling`](#incometaxfiling) | `incometaxfiling` | ✅ | 22 | 1 | 2 | ✅ |
| [`ingestionjob`](#ingestionjob) | `ingestionjob` | ✅ | 18 | 0 | 3 | — |
| [`IntercompanyElimination`](#intercompanyelimination) | `intercompany_elimination` | — | 13 | 0 | 4 | ✅ |
| [`InterCompanyTransaction`](#intercompanytransaction) | `intercompanytransaction` | — | 11 | 4 | 4 | ✅ |
| [`InventoryAdjustment`](#inventoryadjustment) | `inventoryadjustment` | ✅ | 11 | 1 | 2 | — |
| [`Investment`](#investment) | `investment` | ✅ | 21 | 2 | 4 | ✅ |
| [`Invoice`](#invoice) | `invoice` | ✅ | 99 | 11 | 15 | ✅ |
| [`InvoiceActivity`](#invoiceactivity) | `invoiceactivity` | ✅ | 7 | 1 | 2 | — |
| [`InvoiceItem`](#invoiceitem) | `invoiceitem` | ✅ | 10 | 3 | 3 | — |
| [`InvoicePayment`](#invoicepayment) | `invoicepayment` | ✅ | 28 | 5 | 5 | — |
| [`IotAlert`](#iotalert) | `iot_alert` | ✅ | 17 | 1 | 4 | ✅ |
| [`IotBillingTrigger`](#iotbillingtrigger) | `iot_billing_trigger` | ✅ | 18 | 1 | 4 | ✅ |
| [`IotDashboardWidget`](#iotdashboardwidget) | `iot_dashboard_widget` | ✅ | 13 | 0 | 2 | ✅ |
| [`IotDevice`](#iotdevice) | `iot_device` | ✅ | 24 | 4 | 4 | ✅ |
| [`IotFiscalEvent`](#iotfiscalevent) | `iot_fiscal_event` | ✅ | 9 | 1 | 2 | — |
| [`IotTelemetry`](#iottelemetry) | `iot_telemetry` | ✅ | 10 | 1 | 4 | — |
| [`Item`](#item) | `item` | ✅ | 24 | 11 | 3 | ✅ |
| [`ItemGroup`](#itemgroup) | `itemgroup` | ✅ | 7 | 1 | 2 | ✅ |
| [`ItemVariant`](#itemvariant) | `itemvariant` | ✅ | 13 | 1 | 2 | ✅ |
| [`JournalEntry`](#journalentry) | `journalentry` | ✅ | 12 | 16 | 5 | ✅ |
| [`JournalLine`](#journalline) | `journalline` | ✅ | 11 | 4 | 4 | ✅ |
| [`LandedCostAllocation`](#landedcostallocation) | `landed_cost_allocation` | ✅ | 25 | 0 | 4 | ✅ |
| [`Lease`](#lease) | `lease` | ✅ | 29 | 3 | 3 | ✅ |
| [`LeaseJournalEntry`](#leasejournalentry) | `lease_journal_entry` | — | 8 | 1 | 2 | — |
| [`LeaseModification`](#leasemodification) | `lease_modification` | — | 13 | 1 | 1 | ✅ |
| [`LeasePayment`](#leasepayment) | `lease_payment` | — | 15 | 1 | 3 | — |
| [`Leave`](#leave) | `leave` | — | 9 | 1 | 2 | — |
| [`LedgerEntry`](#ledgerentry) | `ledgerentry` | ✅ | 6 | 3 | 3 | — |
| [`LedgerMappingRule`](#ledgermappingrule) | `ledgermappingrule` | ✅ | 16 | 1 | 3 | ✅ |
| [`LetterOfCredit`](#letterofcredit) | `letter_of_credit` | ✅ | 34 | 0 | 4 | ✅ |
| [`LoanRepayment`](#loanrepayment) | `loanrepayment` | ✅ | 9 | 1 | 2 | — |
| [`LoanRequest`](#loanrequest) | `loanrequest` | ✅ | 19 | 2 | 3 | ✅ |
| [`LossUtilization`](#lossutilization) | `loss_utilization` | ✅ | 8 | 1 | 2 | — |
| [`LoyaltyRedemption`](#loyaltyredemption) | `loyaltyredemption` | ✅ | 9 | 3 | 3 | — |
| [`LoyaltyTierConfig`](#loyaltytierconfig) | `loyaltytierconfig` | ✅ | 10 | 2 | 2 | — |
| [`LoyaltyTransaction`](#loyaltytransaction) | `loyaltytransaction` | ✅ | 11 | 2 | 3 | — |
| [`Module`](#module) | `module` | — | 10 | 1 | 1 | ✅ |
| [`ModuleManifest`](#modulemanifest) | `module_manifest` | — | 13 | 0 | 1 | ✅ |
| [`ModuleSetting`](#modulesetting) | `module_setting` | ✅ | 8 | 1 | 3 | — |
| [`ModuleVersion`](#moduleversion) | `module_version` | — | 9 | 0 | 2 | ✅ |
| [`MonetizationEntitlement`](#monetizationentitlement) | `monetization_entitlement` | ✅ | 7 | 1 | 4 | ✅ |
| [`MonetizationProduct`](#monetizationproduct) | `monetization_product` | — | 12 | 3 | 0 | ✅ |
| [`MonetizationPurchase`](#monetizationpurchase) | `monetization_purchase` | ✅ | 10 | 2 | 2 | ✅ |
| [`MonetizationSubscription`](#monetizationsubscription) | `monetization_subscription` | ✅ | 13 | 2 | 3 | ✅ |
| [`MonetizationTrial`](#monetizationtrial) | `monetization_trial` | ✅ | 10 | 2 | 4 | ✅ |
| [`MorAcknowledgementReceipt`](#moracknowledgementreceipt) | `mor_acknowledgement_receipt` | ✅ | 19 | 0 | 5 | ✅ |
| [`MultiCurrencyException`](#multicurrencyexception) | `multi_currency_exception` | ✅ | 12 | 1 | 2 | ✅ |
| [`NetTaxPayableReport`](#nettaxpayablereport) | `net_tax_payable_report` | ✅ | 47 | 0 | 4 | ✅ |
| [`Notification`](#notification) | `notification` | ✅ | 10 | 2 | 3 | — |
| [`NotificationCampaign`](#notificationcampaign) | `notificationcampaign` | ✅ | 12 | 1 | 1 | ✅ |
| [`NotificationTemplate`](#notificationtemplate) | `notificationtemplate` | ✅ | 10 | 1 | 1 | ✅ |
| [`OcrExtraction`](#ocrextraction) | `ocr_extraction` | ✅ | 14 | 1 | 2 | ✅ |
| [`OfflineDeviceRegistry`](#offlinedeviceregistry) | `offline_device_registry` | ✅ | 11 | 1 | 2 | ✅ |
| [`OfflineInvoiceQueue`](#offlineinvoicequeue) | `offline_invoice_queue` | ✅ | 22 | 1 | 7 | ✅ |
| [`OnboardingResponse`](#onboardingresponse) | `onboardingresponse` | — | 36 | 0 | 2 | ✅ |
| [`OtaUpdateJob`](#otaupdatejob) | `ota_update_job` | ✅ | 17 | 1 | 3 | ✅ |
| [`OtherPayment`](#otherpayment) | `otherpayment` | ✅ | 14 | 2 | 2 | — |
| [`OtherPaymentHead`](#otherpaymenthead) | `otherpaymenthead` | ✅ | 9 | 1 | 1 | ✅ |
| [`OtpCode`](#otpcode) | `otp_code` | — | 8 | 0 | 4 | — |
| [`OutboxEvent`](#outboxevent) | `outbox_event` | ✅ | 15 | 0 | 3 | ✅ |
| [`Partnership`](#partnership) | `partnership` | ✅ | 23 | 5 | 1 | ✅ |
| [`PartnershipCustomer`](#partnershipcustomer) | `partnershipcustomer` | — | 7 | 2 | 3 | — |
| [`PartnershipMember`](#partnershipmember) | `partnershipmember` | — | 9 | 1 | 1 | — |
| [`PayeDeclaration`](#payedeclaration) | `paye_declaration` | ✅ | 21 | 0 | 4 | ✅ |
| [`Payment`](#payment) | `payment` | ✅ | 13 | 5 | 4 | ✅ |
| [`PaymentBatch`](#paymentbatch) | `paymentbatch` | ✅ | 30 | 2 | 1 | ✅ |
| [`PaymentBatchItem`](#paymentbatchitem) | `paymentbatchitem` | ✅ | 21 | 4 | 4 | — |
| [`PayrollDeductionCalculation`](#payrolldeductioncalculation) | `payroll_deduction_calculation` | ✅ | 14 | 1 | 2 | — |
| [`PayrollLine`](#payrollline) | `payroll_line` | ✅ | 9 | 1 | 2 | ✅ |
| [`PayrollRecord`](#payrollrecord) | `payrollrecord` | ✅ | 29 | 3 | 3 | ✅ |
| [`PeachtreeProjectionJournal`](#peachtreeprojectionjournal) | `peachtree_projection_journal` | ✅ | 8 | 0 | 3 | — |
| [`PensionRemittance`](#pensionremittance) | `pension_remittance` | ✅ | 19 | 0 | 4 | ✅ |
| [`PerformanceObligation`](#performanceobligation) | `performance_obligation` | — | 9 | 3 | 1 | — |
| [`PeriodClose`](#periodclose) | `period_close` | ✅ | 9 | 1 | 2 | ✅ |
| [`periodlock`](#periodlock) | `periodlock` | ✅ | 10 | 0 | 1 | — |
| [`Permission`](#permission) | `permission` | ✅ | 8 | 2 | 3 | ✅ |
| [`PettyCashFund`](#pettycashfund) | `pettycashfund` | ✅ | 11 | 1 | 2 | ✅ |
| [`PettyCashTransaction`](#pettycashtransaction) | `pettycashtransaction` | ✅ | 10 | 1 | 2 | — |
| [`Pipeline`](#pipeline) | `pipeline` | ✅ | 11 | 3 | 2 | ✅ |
| [`PipelineStage`](#pipelinestage) | `pipeline_stage` | — | 3 | 1 | 0 | — |
| [`PortalSubmissionLog`](#portalsubmissionlog) | `portal_submission_log` | ✅ | 17 | 0 | 4 | ✅ |
| [`ProfileMetadata`](#profilemetadata) | `profile_metadata` | ✅ | 9 | 2 | 2 | ✅ |
| [`ProfileMetadataScope`](#profilemetadatascope) | `profile_metadata_scope` | ✅ | 7 | 2 | 2 | ✅ |
| [`ProformaInvoice`](#proformainvoice) | `proforma_invoice` | ✅ | 18 | 0 | 2 | ✅ |
| [`Project`](#project) | `Project` | ✅ | 15 | 6 | 2 | ✅ |
| [`ProjectActivity`](#projectactivity) | `project_activity` | ✅ | 11 | 3 | 4 | — |
| [`ProjectAttachment`](#projectattachment) | `project_attachment` | ✅ | 10 | 2 | 2 | — |
| [`ProjectComment`](#projectcomment) | `project_comment` | ✅ | 10 | 4 | 3 | ✅ |
| [`ProjectFinancialLink`](#projectfinanciallink) | `project_financial_link` | ✅ | 13 | 2 | 4 | — |
| [`ProjectMilestone`](#projectmilestone) | `project_milestone` | ✅ | 14 | 5 | 2 | ✅ |
| [`ProjectTask`](#projecttask) | `project_task` | ✅ | 19 | 8 | 5 | ✅ |
| [`ProjectTimer`](#projecttimer) | `project_timer` | ✅ | 10 | 2 | 4 | — |
| [`ProjectTimesheet`](#projecttimesheet) | `project_timesheet` | ✅ | 13 | 2 | 3 | ✅ |
| [`PropertyAssessment`](#propertyassessment) | `property_assessment` | — | 17 | 1 | 3 | — |
| [`PropertyRecord`](#propertyrecord) | `property_record` | ✅ | 28 | 1 | 2 | ✅ |
| [`Provision`](#provision) | `provision` | ✅ | 17 | 0 | 3 | ✅ |
| [`ProvisionalTaxPayment`](#provisionaltaxpayment) | `provisional_tax_payment` | ✅ | 16 | 0 | 3 | ✅ |
| [`PurchaseOrder`](#purchaseorder) | `purchase_order` | ✅ | 16 | 0 | 3 | ✅ |
| [`PurchaseReceipt`](#purchasereceipt) | `purchase_receipt` | ✅ | 7 | 1 | 2 | — |
| [`ReceiptStorage`](#receiptstorage) | `receipt_storage` | ✅ | 11 | 1 | 1 | ✅ |
| [`RecognitionScheduleRow`](#recognitionschedulerow) | `recognition_schedule_row` | — | 11 | 4 | 2 | ✅ |
| [`ReconciliationPeriod`](#reconciliationperiod) | `reconciliation_period` | ✅ | 17 | 3 | 3 | ✅ |
| [`ReconciliationReport`](#reconciliationreport) | `reconciliation_report` | ✅ | 12 | 2 | 2 | — |
| [`ReimbursementClaim`](#reimbursementclaim) | `reimbursementclaim` | ✅ | 24 | 2 | 3 | ✅ |
| [`Release`](#release) | `release` | — | 7 | 1 | 0 | — |
| [`RemeasurementJournal`](#remeasurementjournal) | `remeasurement_journal` | — | 6 | 1 | 2 | — |
| [`ReportDefinition`](#reportdefinition) | `report_definition` | ✅ | 9 | 1 | 2 | ✅ |
| [`ReportLine`](#reportline) | `report_line` | ✅ | 10 | 1 | 2 | ✅ |
| [`Revenue`](#revenue) | `revenue` | ✅ | 13 | 5 | 4 | ✅ |
| [`RevenueAllocation`](#revenueallocation) | `revenue_allocation` | — | 8 | 4 | 2 | — |
| [`Review`](#review) | `review` | ✅ | 10 | 2 | 3 | — |
| [`Reward`](#reward) | `reward` | ✅ | 10 | 2 | 1 | — |
| [`RoleAppAccess`](#roleappaccess) | `role_app_access` | — | 6 | 1 | 3 | ✅ |
| [`RoleDefinition`](#roledefinition) | `role_definition` | ✅ | 8 | 3 | 4 | ✅ |
| [`RolePermission`](#rolepermission) | `role_permission` | — | 4 | 2 | 3 | — |
| [`SalesOrder`](#salesorder) | `sales_order` | ✅ | 17 | 6 | 4 | ✅ |
| [`SalesOrderCreditNote`](#salesordercreditnote) | `sales_order_credit_note` | ✅ | 11 | 2 | 2 | ✅ |
| [`SalesOrderCreditNoteItem`](#salesordercreditnoteitem) | `sales_order_credit_note_item` | ✅ | 9 | 3 | 2 | — |
| [`SalesOrderLine`](#salesorderline) | `sales_order_line` | ✅ | 19 | 3 | 2 | ✅ |
| [`SalesOrderShipToAddress`](#salesordershiptoaddress) | `sales_order_ship_to_address` | — | 13 | 1 | 1 | — |
| [`ScannedBill`](#scannedbill) | `scanned_bill` | ✅ | 32 | 1 | 4 | ✅ |
| [`ScheduleDFiling`](#scheduledfiling) | `schedule_d_filing` | ✅ | 25 | 0 | 4 | ✅ |
| [`SectorTaxOverride`](#sectortaxoverride) | `sector_tax_override` | — | 9 | 0 | 1 | — |
| [`SecurityAssessment`](#securityassessment) | `security_assessment` | ✅ | 11 | 3 | 2 | ✅ |
| [`SecurityFinding`](#securityfinding) | `security_finding` | — | 15 | 2 | 5 | ✅ |
| [`SecurityScan`](#securityscan) | `security_scan` | — | 13 | 2 | 3 | ✅ |
| [`Session`](#session) | `session` | — | 10 | 0 | 3 | — |
| [`Setting`](#setting) | `setting` | ✅ | 18 | 3 | 4 | ✅ |
| [`SettingCategory`](#settingcategory) | `setting_category` | — | 9 | 2 | 1 | ✅ |
| [`SettingGroup`](#settinggroup) | `setting_group` | — | 9 | 2 | 2 | ✅ |
| [`SettingInput`](#settinginput) | `setting_input` | — | 18 | 0 | 0 | ✅ |
| [`SettingValue`](#settingvalue) | `setting_value` | ✅ | 9 | 1 | 4 | ✅ |
| [`Shift`](#shift) | `shift` | ✅ | 9 | 3 | 2 | ✅ |
| [`SigtaxProjectionJournal`](#sigtaxprojectionjournal) | `sigtax_projection_journal` | ✅ | 8 | 0 | 3 | — |
| [`SoftwareAmortizationRow`](#softwareamortizationrow) | `software_amortization_row` | — | 9 | 1 | 2 | — |
| [`SoftwareAsset`](#softwareasset) | `software_asset` | ✅ | 13 | 2 | 2 | ✅ |
| [`SoftwareWorkItem`](#softwareworkitem) | `software_work_item` | ✅ | 9 | 2 | 1 | — |
| [`SrmDevice`](#srmdevice) | `srm_device` | ✅ | 18 | 0 | 2 | ✅ |
| [`StampDutyRecord`](#stampdutyrecord) | `stamp_duty_record` | ✅ | 14 | 0 | 2 | — |
| [`StockDemandByOrder`](#stockdemandbyorder) | `stock_demand_by_order` | ✅ | 13 | 2 | 4 | ✅ |
| [`StockMovement`](#stockmovement) | `stock_movement` | ✅ | 10 | 1 | 2 | — |
| [`StockTransaction`](#stocktransaction) | `stocktransaction` | ✅ | 9 | 1 | 3 | — |
| [`StockValuationLayer`](#stockvaluationlayer) | `stock_valuation_layer` | ✅ | 17 | 0 | 3 | — |
| [`SubscriptionUpdate`](#subscriptionupdate) | `subscription_update` | ✅ | 11 | 1 | 2 | — |
| [`SyncQueue`](#syncqueue) | `sync_queue` | ✅ | 11 | 1 | 2 | ✅ |
| [`systemsetting`](#systemsetting) | `systemsetting` | — | 5 | 0 | 0 | ✅ |
| [`TaxAuditLog`](#taxauditlog) | `taxauditlog` | — | 8 | 1 | 1 | — |
| [`TaxClearanceRequest`](#taxclearancerequest) | `tax_clearance_request` | ✅ | 16 | 0 | 3 | ✅ |
| [`TaxDisputeCase`](#taxdisputecase) | `tax_dispute_case` | ✅ | 28 | 0 | 3 | ✅ |
| [`TaxGlAccount`](#taxglaccount) | `tax_gl_account` | — | 10 | 0 | 0 | — |
| [`TaxLossCarryforward`](#taxlosscarryforward) | `tax_loss_carryforward` | ✅ | 13 | 1 | 3 | ✅ |
| [`taxrate`](#taxrate) | `tax_rate` | — | 15 | 2 | 3 | ✅ |
| [`TaxRule`](#taxrule) | `tax_rule` | — | 26 | 0 | 1 | ✅ |
| [`TelecomReceiptCache`](#telecomreceiptcache) | `telecomreceiptcache` | — | 9 | 0 | 2 | — |
| [`ThinCapMonitor`](#thincapmonitor) | `thin_cap_monitor` | ✅ | 17 | 0 | 2 | ✅ |
| [`Ticket`](#ticket) | `ticket` | ✅ | 19 | 2 | 4 | ✅ |
| [`TicketReply`](#ticketreply) | `ticket_reply` | ✅ | 9 | 1 | 2 | — |
| [`TokenBlacklist`](#tokenblacklist) | `token_blacklist` | — | 5 | 0 | 3 | — |
| [`TotFiling`](#totfiling) | `totfiling` | ✅ | 16 | 1 | 2 | ✅ |
| [`TradeDocument`](#tradedocument) | `trade_document` | — | 12 | 1 | 2 | — |
| [`TradeLicense`](#tradelicense) | `trade_license` | ✅ | 11 | 0 | 2 | ✅ |
| [`TradeShipment`](#tradeshipment) | `trade_shipment` | ✅ | 31 | 3 | 4 | ✅ |
| [`TradeShipmentStep`](#tradeshipmentstep) | `trade_shipment_step` | — | 11 | 1 | 2 | ✅ |
| [`TransferOrder`](#transferorder) | `transferorder` | ✅ | 13 | 3 | 2 | ✅ |
| [`TransferOrderItem`](#transferorderitem) | `transferorderitem` | ✅ | 7 | 2 | 3 | — |
| [`TransferPricingRecord`](#transferpricingrecord) | `transfer_pricing_record` | ✅ | 19 | 0 | 3 | ✅ |
| [`TranslationReserve`](#translationreserve) | `translation_reserve` | ✅ | 9 | 1 | 2 | ✅ |
| [`User`](#user) | `user` | ✅ | 19 | 5 | 1 | ✅ |
| [`UserApp`](#userapp) | `user_app` | — | 12 | 2 | 3 | ✅ |
| [`UserRole`](#userrole) | `user_role` | — | 4 | 2 | 3 | — |
| [`VatDeclaration`](#vatdeclaration) | `vatdeclaration` | ✅ | 12 | 3 | 2 | ✅ |
| [`VatETaxSubmission`](#vatetaxsubmission) | `vatetaxsubmission` | ✅ | 12 | 1 | 1 | ✅ |
| [`VatExportEvidence`](#vatexportevidence) | `vatexportevidence` | ✅ | 13 | 1 | 1 | ✅ |
| [`VatFiling`](#vatfiling) | `vatfiling` | ✅ | 20 | 1 | 2 | ✅ |
| [`VatInputLedger`](#vatinputledger) | `vatinputledger` | ✅ | 17 | 1 | 1 | ✅ |
| [`VatLineItem`](#vatlineitem) | `vatlineitem` | — | 8 | 1 | 1 | — |
| [`VatNote`](#vatnote) | `vatnote` | ✅ | 8 | 1 | 1 | ✅ |
| [`VatOutputLedger`](#vatoutputledger) | `vatoutputledger` | ✅ | 13 | 1 | 1 | ✅ |
| [`VatRefundClaim`](#vatrefundclaim) | `vatrefundclaim` | ✅ | 10 | 1 | 1 | ✅ |
| [`VatReverseCharge`](#vatreversecharge) | `vatreverscharge` | ✅ | 10 | 1 | 1 | ✅ |
| [`VatWithholding`](#vatwithholding) | `vatwithholding` | ✅ | 12 | 1 | 1 | ✅ |
| [`Vendor`](#vendor) | `vendor` | ✅ | 14 | 4 | 1 | ✅ |
| [`VendorLedger`](#vendorledger) | `vendor_ledger` | ✅ | 19 | 0 | 4 | ✅ |
| [`VendorPayment`](#vendorpayment) | `vendor_payment` | ✅ | 12 | 4 | 4 | ✅ |
| [`VerifiedLedgerState`](#verifiedledgerstate) | `verified_ledger_state` | ✅ | 13 | 1 | 2 | ✅ |
| [`Warehouse`](#warehouse) | `warehouse` | ✅ | 14 | 4 | 1 | ✅ |
| [`WarehouseStock`](#warehousestock) | `warehousestock` | ✅ | 9 | 2 | 4 | ✅ |
| [`WebhookDelivery`](#webhookdelivery) | `webhook_delivery` | — | 9 | 1 | 2 | — |
| [`WebhookEndpoint`](#webhookendpoint) | `webhook_endpoint` | ✅ | 8 | 2 | 1 | ✅ |
| [`WhtCertificate`](#whtcertificate) | `wht_certificate` | ✅ | 24 | 0 | 4 | ✅ |
| [`WhtWithholding`](#whtwithholding) | `wht_withholding` | ✅ | 11 | 1 | 2 | ✅ |
| [`workflowrun`](#workflowrun) | `workflow_run` | ✅ | 9 | 1 | 2 | ✅ |
| [`workflowtaskrun`](#workflowtaskrun) | `workflow_task_run` | — | 13 | 1 | 2 | — |
| [`WorkOrder`](#workorder) | `work_order` | ✅ | 9 | 2 | 1 | ✅ |
| [`WorkOrderOutput`](#workorderoutput) | `work_order_output` | — | 6 | 1 | 0 | — |

---

## 4. Enum reference

| Enum | Values |
|------|--------|
| `AccountCategory` | `HEADER` · `CASH` · `BANK` · `ACCOUNTS_RECEIVABLE` · `ACCOUNTS_PAYABLE` · `INVENTORY` · `FIXED_ASSET` · `CURRENT_ASSET` · `CURRENT_LIABILITY` · `LONG_TERM_LIABILITY` · `EQUITY` · `REVENUE` · `OTHER_INCOME` · `OPERATING_EXPENSE` · `COST_OF_GOODS_SOLD` · `OTHER_EXPENSE` · `INVESTMENT` · `TAX` |
| `AccountType` | `ASSET` · `LIABILITY` · `EQUITY` · `INCOME` · `EXPENSE` |
| `AmortRowStatus` | `SCHEDULED` · `POSTED` |
| `AppAccessLevel` | `NONE` · `READ` · `WRITE` · `ADMIN` |
| `AppEnvironment` | `STAGING` · `PRODUCTION` · `DEVELOPMENT` · `ON_PREMISE` |
| `AttendanceMethod` | `MANUAL` · `BIOMETRIC` · `KIOSK` · `MOBILE` · `QR_CODE` · `SYSTEM` |
| `AttendanceStatus` | `PRESENT` · `LATE` · `ABSENT` · `HALF_DAY` |
| `BankFeedProvider` | `PLAID` · `GOCARDLESS` · `MANUAL` |
| `BankFeedStatus` | `CONNECTED` · `DISCONNECTED` · `ERROR` · `PENDING_AUTH` |
| `BankTxnType` | `CREDIT` · `DEBIT` |
| `BatchStatus` | `DRAFT` · `PENDING` · `SUBMITTED` · `APPROVED` · `EXPORTED` · `PAID` · `PARTIAL` · `COMPLETED` · `CANCELLED` |
| `BillingStyle` | `HOURLY` · `FIXED` · `TASK` |
| `BiometricType` | `FINGERPRINT` · `FACE` · `IRIS` · `VOICE` · `CARD` |
| `CapDecisionStatus` | `APPROVED` · `REJECTED` |
| `ClassificationStatus` | `PENDING` · `CAPITALIZE` · `EXPENSE` |
| `CollectionStage` | `NEW` · `ASSIGNED` · `CONTACTED` · `PROMISE_TO_PAY` · `PARTIAL_PAYMENT` · `LEGAL` · `WRITTEN_OFF` · `CLOSED` |
| `CompanyReleaseStatus` | `AVAILABLE` · `APPLIED` · `SKIPPED` · `FAILED` |
| `CompanyType` | `MANUFACTURING` · `LARGE_ENTERPRISE` · `MEDIUM_ENTERPRISE` · `SMALL_BUSINESS` · `FREELANCER` · `RETAIL` · `WHOLESALE` · `NGO` · `GOVERNMENT` |
| `ContractType` | `INDEFINITE` · `FIXED_TERM` · `PIECE_RATE` |
| `ContributionCategory` | `LOAN_VALUE` · `INSURANCE_PREMIUM` · `SERVICE_FEES` · `AIRTIME_SALES` · `TICKET_SALES` · `ANNUAL_SALES_REVENUE` · `FUEL_SALES` · `TOBACCO_ALCOHOL` · `GOVERNMENT_SERVICES` · `GOVERNMENT_BUDGET` · `SALARY_CONTRIBUTION` · `CONTRABAND_PROCEEDS` · `TELECOM_DIGITAL` · `DIVIDEND` · `OTHER` |
| `ContributionStatus` | `PENDING` · `REMITTED` · `OVERDUE` · `PAID` · `ARCHIVED` |
| `CostCenterType` | `COST` · `PROFIT` · `INVESTMENT` |
| `CustomFieldType` | `TEXT` · `TEXTAREA` · `NUMBER` · `DATE` · `TIME` · `DATETIME` · `SELECT` · `MULTISELECT` · `CHECKBOX` · `TOGGLE` · `EMAIL` · `PHONE` · `URL` |
| `DeductionReason` | `DISCOUNT` · `RETURN` · `DISPUTE` · `DAMAGE` · `SHORT_PAYMENT` · `OTHER` |
| `DeductionStatus` | `PENDING` · `APPROVED` · `REJECTED` · `RESOLVED` |
| `DeviceControlCategory` | `ENCRYPTION` · `APP_PERMISSION` · `NETWORK_POLICY` · `ENFORCEMENT_RULE` |
| `DeviceControlChangeStatus` | `DRAFT` · `PENDING` · `APPROVED` · `REJECTED` · `APPLIED` · `CANCELLED` |
| `EmployeeBusinessType` | `MANUFACTURING` · `LARGE_ENTERPRISE` · `MEDIUM_ENTERPRISE` · `SMALL_BUSINESS` · `FREELANCER` · `GOVERNMENT` |
| `ExciseTaxOrigin` | `LOCAL` · `IMPORT` |
| `ExciseTaxStatus` | `DRAFT` · `PENDING` · `PAID` · `FILED` · `OVERDUE` · `EXEMPTED` |
| `FraudStatus` | `OK` · `SUSPECT` · `BLOCKED` · `REVIEW` |
| `ifrsstandard_type` | `IAS1_PRESENTATION` · `IFRS9_FIN_INSTRUMENTS` · `IFRS15_REVENUE` · `IFRS16_LEASES` · `IFRS17_INSURANCE` · `IAS7_STATEMENT_CASHFLOWS` · `IAS12_INCOME_TAXES` · `IAS21_FX_INTRAGROUP` · `IAS36_IMPAIRMENT` · `CUSTOM` |
| `IfrsStandardCode` | `IFRS15` · `IFRS16` · `IAS38` |
| `InspectionLane` | `RED` · `GREEN` · `YELLOW` |
| `InvestmentStatus` | `PROSPECTING` · `NEGOTIATING` · `COMMITTED` · `ACTIVE` · `EXITED` |
| `InvestmentType` | `EQUITY` · `DEBT` · `GRANT` · `VENTURE_CAPITAL` · `ANGEL` · `GOVERNMENT` · `OTHER` |
| `InvoiceStatus` | `DRAFT` · `PENDING` · `PAID` · `PARTIAL` · `OVERDUE` · `CANCELLED` · `VOID` · `SENT` · `POSTED` · `ARCHIVED` |
| `IotDeviceStatus` | `ACTIVE` · `INACTIVE` · `MAINTENANCE` · `DECOMMISSIONED` · `OFFLINE` |
| `ItemStatus` | `ACTIVE` · `INACTIVE` · `DISCONTINUED` |
| `JournalLineTaxType` | `VAT_EXCISE` · `STAMP_DUTY` · `PAYROLL_WITHHOLD` · `CUSTOMS_DUTY` · `EXCISE_ON_IMPORT` |
| `LeaseModificationType` | `SCOPE_INCREASE` · `SCOPE_DECREASE` · `RATE_CHANGE` · `TERM_CHANGE` · `SEPARATE_NEW_LEASE` |
| `LeaveStatus` | `PENDING` · `APPROVED` · `REJECTED` · `CANCELLED` |
| `LeaveType` | `ANNUAL` · `SICK` · `MATERNITY` · `PATERNITY` · `UNPAID` · `EMERGENCY` · `OTHER` |
| `LoanStatus` | `APPLIED` · `UNDER_REVIEW` · `APPROVED` · `DISBURSED` · `ACTIVE` · `CLOSED` · `REJECTED` |
| `LoanType` | `TERM_LOAN` · `OVERDRAFT` · `WORKING_CAPITAL` · `EQUIPMENT_FINANCING` · `MORTGAGE` · `OTHER` |
| `LoyaltyTier` | `BRONZE` · `SILVER` · `GOLD` · `PLATINUM` · `DIAMOND` |
| `LoyaltyTierLevel` | `BRONZE` · `SILVER` · `GOLD` · `PLATINUM` · `DIAMOND` |
| `LoyaltyTransactionStatus` | `OK` · `SUSPECT` · `BLOCKED` · `REVIEW` |
| `LoyaltyTransactionType` | `EARN_PURCHASE` · `EARN_REFERRAL` · `EARN_BONUS` · `REDEEM_REWARD` · `ADJUST_MANUAL` · `EXPIRE` · `FRAUD_REVERSAL` |
| `ModificationStatus` | `PENDING` · `APPROVED` · `REJECTED` |
| `NotificationType` | `INFO` · `WARNING` · `ERROR` · `SUCCESS` · `ALERT` · `SYSTEM` · `PAYROLL` · `LEAVE` · `ATTENDANCE` |
| `ObligationBasis` | `POINT_IN_TIME` · `OVER_TIME_COST` · `OVER_TIME_OUTPUT` |
| `ObligationStatus` | `UNSATISFIED` · `PARTIALLY_SATISFIED` · `SATISFIED` |
| `OtaJobStatus` | `PENDING` · `IN_PROGRESS` · `SUCCESS` · `FAILED` · `ROLLED_BACK` · `CANCELLED` |
| `PaymentType` | `VENDOR` · `CUSTOMER` · `ACCOUNTS_PAYABLE` · `ACCOUNTS_RECEIVABLE` |
| `periodlock_status` | `OPEN` · `LOCKED` |
| `ProjectionEngine` | `PEACHTREE` · `SIGTAX` · `IFRS` |
| `ProjectStatus` | `ACTIVE` · `ON_HOLD` · `COMPLETED` · `CANCELLED` |
| `PropertyTaxStatus` | `DRAFT` · `ASSESSED` · `NOTIFIED` · `PAID` · `OVERDUE` · `DISPUTED` · `EXEMPT` |
| `PropertyTaxType` | `URBAN_LAND` · `BUILDING` · `AGRICULTURAL_LAND` · `RENTAL_INCOME` |
| `PropertyUseType` | `RESIDENTIAL` · `COMMERCIAL` · `INDUSTRIAL` · `MIXED_USE` · `AGRICULTURAL` |
| `ReconciliationAdjustmentCode` | `NON_DEDUCTIBLE_EXPENSE` · `LEASE_ROU` · `IFRS15_ADJ` · `IFRS16_ADJ` · `IAS38_ADJ` · `INTERCO_ELIMINATION` · `TAX_TIMING_DIFF` · `DEFERRED_TAX` · `NCI_ALLOCATION` · `DEFAULT` |
| `ReconciliationPeriodStatus` | `OPEN` · `IN_PROGRESS` · `PENDING_APPROVAL` · `COMPLETED` · `LOCKED` |
| `ReconciliationReportStatus` | `DRAFT` · `FINAL` · `APPROVED` |
| `ReleaseStatus` | `DRAFT` · `RELEASED` · `REVOKED` |
| `ReleaseType` | `STAGING` · `PRODUCTION` |
| `Role` | `SPURADMIN` · `SUPERADMIN` · `ADMIN` · `HR` · `ovds` · `ACCOUNTING` · `AUDITOR` · `EMPLOYEE` · `CRM` · `IFRS_OFFICER` · `BANK_LIAISON` · `EXTERNAL_AUDITOR` · `DEVELOPER` · `CLIENT` · `PROJECT_MANAGER` · `PARTNER` · `DATA_CLERK` |
| `ScheduleRowStatus` | `PENDING` · `RECOGNISED` · `DEFERRED` · `REVERSED` |
| `SoftwareAssetStatus` | `ACTIVE` · `FULLY_AMORTIZED` · `IMPAIRED` |
| `SoftwarePhase` | `RESEARCH` · `DEVELOPMENT` · `POST_IMPLEMENTATION` |
| `SoftwareWorkPhase` | `RESEARCH` · `DEVELOPMENT` · `CONFIGURATION` · `CUSTOMIZATION` |
| `StampDutyStatus` | `DRAFT` · `PAID` · `EXEMPT` · `PENDING` |
| `StockMovementType` | `IN` · `OUT` · `ADJUSTMENT` · `TRANSFER` |
| `SyncStatus` | `PENDING` · `SYNCING` · `COMPLETED` · `FAILED` |
| `TaskPriority` | `LOW` · `MEDIUM` · `HIGH` · `URGENT` |
| `TaskStatus` | `TODO` · `IN_PROGRESS` · `REVIEW` · `DONE` · `CANCELLED` |
| `tax_calc_type` | `NORMAL` · `INCLUSIVE` · `COMPOUND` · `FIXED` · `WITHHOLDING` |
| `taxrate_type` | `VAT` · `INCOME_TAX` · `WITHHOLDING` · `DRRF` · `SALES_TAX` · `CUSTOM` |
| `TerminationType` | `EMPLOYER_WITHOUT_CAUSE` · `FIXED_TERM_EXPIRY` · `MUTUAL_AGREEMENT` · `EMPLOYEE_FAULT` · `EMPLOYER_FAULT` · `RETIREMENT` · `INCAPACITY` · `DEATH` |
| `TradeDirection` | `IMPORT` · `EXPORT` |
| `ValuationMethod` | `MARKET_VALUE` · `REPLACEMENT_COST` · `INCOME_CAPITALIZATION` · `AREA_BASED` |

---

## 5. Models

### Account

_Table `account` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `code` | `String` | — | — |
| `name` | `String` | — | — |
| `type` | `AccountType` | — | — |
| `category` | `AccountCategory` | — | — |
| `description` | `String?` | — | — |
| `isActive` | `Boolean` | @default(true) | — |
| `isLeaf` | `Boolean` | @default(true) | — |
| `allowPosting` | `Boolean` | @default(true) | — |
| `parentId` | `String?` | — | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `account` | [`Account`](#account) | optional one | `parentId` → `id` | — |
| `subAccounts` | [`Account`](#account) | many | _back-reference_ | — |
| `journalLine` | [`JournalLine`](#journalline) | many | _back-reference_ | — |
| `ledgerEntries` | [`LedgerEntry`](#ledgerentry) | many | _back-reference_ | — |
| `budgets` | [`Budget`](#budget) | many | _back-reference_ | — |

**Referenced by:** [`Account`](#account).`account` · [`Account`](#account).`subAccounts` · [`Budget`](#budget).`account` · [`Company`](#company).`account` · [`JournalLine`](#journalline).`account` · [`LedgerEntry`](#ledgerentry).`account`

**Indexes**

- unique `[code, companyId]`
- index `[companyId]`
- index `[parentId]`

### AccrualPosting

_Table `accrual_posting` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `accrualId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `period` | `String` | @db.VarChar(7) | — |
| `amount` | `Decimal` | @db.Decimal(18, 2) | — |
| `journalEntryId` | `String?` | @db.VarChar(36) | — |
| `status` | `String` | @default("POSTED") @db.VarChar(20) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `accrual` | [`AccrualPrepayment`](#accrualprepayment) | one | `accrualId` → `id` | Cascade |

**Referenced by:** [`AccrualPrepayment`](#accrualprepayment).`postings` · [`Company`](#company).`accrualPostings`

**Indexes**

- index `[companyId]`
- index `[accrualId]`
- index `[period]`

### AccrualPrepayment

_Table `accrual_prepayment` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `type` | `String` | @default("ACCRUAL") @db.VarChar(20) | ACCRUAL \| PREPAYMENT |
| `description` | `String` | @db.VarChar(500) | — |
| `accountId` | `String?` | @db.VarChar(36) | — |
| `counterAccountId` | `String?` | @db.VarChar(36) | — |
| `amount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `startDate` | `DateTime` | — | — |
| `endDate` | `DateTime` | — | — |
| `totalMonths` | `Int` | @default(1) | — |
| `amortisedMonths` | `Int` | @default(0) | — |
| `monthlyAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `remainingAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `status` | `String` | @default("ACTIVE") @db.VarChar(20) | ACTIVE \| FULLY_AMORTISED \| CANCELLED |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `postings` | [`AccrualPosting`](#accrualposting) | many | _back-reference_ | — |

**Referenced by:** [`AccrualPosting`](#accrualposting).`accrual`

**Indexes**

- index `[companyId]`
- index `[status]`

### AdminCreatedMenuItem

_Table `admincreatedmenuitem` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `label` | `String` | @db.VarChar(200) | — |
| `path` | `String` | @db.VarChar(500) | — |
| `to` | `String?` | @db.VarChar(500) | — |
| `icon` | `String?` | @db.VarChar(100) | — |
| `parentId` | `String?` | — | — |
| `parentKey` | `String?` | @db.VarChar(100) | — |
| `sortOrder` | `Int` | @default(0) | — |
| `order` | `Int` | @default(0) | — |
| `adminId` | `String?` | @db.VarChar(100) | — |
| `isActive` | `Boolean` | @default(true) | — |
| `roles` | `String?` | @db.VarChar(500) | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`adminCreatedMenuItem`

**Indexes**

- index `[companyId]`

### App

_Table `app` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | @unique(map: "App_name_key") | — |
| `slug` | `String` | @unique(map: "App_slug_key") @db.VarChar(100) | — |
| `description` | `String?` | @db.Text | — |
| `version` | `String` | @default("1.0.0") @db.VarChar(20) | — |
| `category` | `String` | @default("GENERAL") @db.VarChar(50) | — |
| `isActive` | `Boolean` | @default(true) | — |
| `isFree` | `Boolean` | @default(true) | — |
| `price` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `rating` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `downloads` | `Int` | @default(0) | — |
| `developer` | `String?` | @db.VarChar(200) | — |
| `downloadUrl` | `String?` | @db.VarChar(500) | — |
| `iconUrl` | `String?` | @db.VarChar(500) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `review` | [`Review`](#review) | many | _back-reference_ | — |
| `roleAppAccess` | [`RoleAppAccess`](#roleappaccess) | many | _back-reference_ | — |
| `userApp` | [`UserApp`](#userapp) | many | _back-reference_ | — |
| `installations` | [`AppInstallation`](#appinstallation) | many | _back-reference_ | — |

**Referenced by:** [`AppInstallation`](#appinstallation).`app` · [`Review`](#review).`app` · [`RoleAppAccess`](#roleappaccess).`app` · [`UserApp`](#userapp).`app`

### AppInstallation

Persists which apps are installed per-company. Supports both cloud and on-premise deployments. Run: npm run db:push && npm run db:generate

_Table `app_installation` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `appId` | `String` | — | — |
| `version` | `String` | @default("1.0.0") @db.VarChar(20) | Snapshot of the version installed |
| `status` | `String` | @default("ACTIVE") @db.VarChar(20) | ACTIVE \| DISABLED \| PENDING_UPDATE |
| `config` | `String?` | @db.LongText | JSON blob for per-installation configuration |
| `installedBy` | `String?` | @db.VarChar(100) | Who installed it |
| `installedAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |
| `app` | [`App`](#app) | one | `appId` → `id` | Cascade |

**Referenced by:** [`App`](#app).`installations` · [`Company`](#company).`appInstallations`

**Indexes**

- unique `[companyId, appId]`
- index `[companyId]`
- index `[appId]`
- index `[status]`

### ArrearConfig

_Table `arrearconfig` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | @unique(map: "ArrearConfig_name_key") | — |
| `arrearTypeId` | `String` | — | — |
| `employeeId` | `String?` | — | — |
| `fromDate` | `DateTime` | — | — |
| `toDate` | `DateTime` | — | — |
| `remarks` | `String?` | — | — |
| `status` | `String` | @default("GENERATED") | — |
| `amount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `approvedBy` | `String?` | — | — |
| `approvedAt` | `DateTime?` | — | — |
| `paymentType` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `arrearType` | [`ArrearType`](#arreartype) | one | `arrearTypeId` → `id` | — |
| `employee` | [`Employee`](#employee) | optional one | `employeeId` → `id` | — |

**Referenced by:** [`ArrearType`](#arreartype).`arrearConfig` · [`Employee`](#employee).`arrearConfig`

**Indexes**

- index `[arrearTypeId]`
- index `[employeeId]`

### ArrearType

_Table `arreartype` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | @unique(map: "ArrearType_name_key") | — |
| `description` | `String?` | — | — |
| `isActive` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `arrearConfig` | [`ArrearConfig`](#arrearconfig) | many | _back-reference_ | — |

**Referenced by:** [`ArrearConfig`](#arrearconfig).`arrearType`

### AssetLiabilityLoop

_Table `asset_liability_loop` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `journalEntryId` | `String` | — | — |
| `assetTotal` | `Decimal` | — | — |
| `liabilityTotal` | `Decimal` | — | — |
| `imbalance` | `Decimal` | — | — |
| `status` | `String` | @default("MATCHED") @db.VarChar(50) | — |
| `resolvedAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`assetLiabilityLoops`

**Indexes**

- index `[companyId]`
- index `[journalEntryId]`

### Attendance

_Table `attendance` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `employeeId` | `String` | — | — |
| `checkIn` | `DateTime` | @default(now()) | — |
| `checkOut` | `DateTime?` | — | — |
| `method` | `AttendanceMethod` | — | — |
| `status` | `AttendanceStatus` | — | — |
| `latitude` | `Float?` | — | — |
| `longitude` | `Float?` | — | — |
| `deviceInfo` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `verified` | `Boolean` | @default(false) | — |
| `verifiedBy` | `String?` | — | — |
| `overtimeHours` | `Float?` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `employee` | [`Employee`](#employee) | one | `employeeId` → `id` | Cascade |

**Referenced by:** [`Employee`](#employee).`attendance`

**Indexes**

- index `[checkIn]`
- index `[employeeId]`
- index `[checkIn, employeeId]`

### AuditComment

_Table `auditcomment` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `engagementId` | `String` | — | — |
| `content` | `String` | @db.Text | — |
| `authorName` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `auditEngagement` | [`AuditEngagement`](#auditengagement) | one | `engagementId` → `id` | Cascade |

**Referenced by:** [`AuditEngagement`](#auditengagement).`auditComment`

**Indexes**

- index `[engagementId]`

### AuditEngagement

_Table `auditengagement` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `firmId` | `String` | — | — |
| `title` | `String` | @db.VarChar(300) | — |
| `type` | `String` | @default("EXTERNAL") | — |
| `auditType` | `String?` | @db.VarChar(100) | — |
| `riskLevel` | `String?` | @db.VarChar(50) | — |
| `scope` | `String?` | @db.Text | — |
| `notes` | `String?` | @db.Text | — |
| `budget` | `Decimal?` | — | — |
| `actualCost` | `Decimal?` | — | — |
| `reportSummary` | `String?` | @db.Text | — |
| `status` | `String` | @default("PLANNED") | — |
| `startDate` | `DateTime?` | — | — |
| `endDate` | `DateTime?` | — | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `auditComment` | [`AuditComment`](#auditcomment) | many | _back-reference_ | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `auditFirm` | [`AuditFirm`](#auditfirm) | one | `firmId` → `id` | — |
| `auditFinding` | [`AuditFinding`](#auditfinding) | many | _back-reference_ | — |

**Referenced by:** [`AuditComment`](#auditcomment).`auditEngagement` · [`AuditFinding`](#auditfinding).`auditEngagement` · [`AuditFirm`](#auditfirm).`auditEngagement` · [`Company`](#company).`auditEngagement`

**Indexes**

- index `[companyId]`
- index `[firmId]`

### AuditFinding

_Table `auditfinding` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `engagementId` | `String` | — | — |
| `title` | `String` | @db.VarChar(300) | — |
| `description` | `String?` | @db.Text | — |
| `severity` | `String` | @default("MEDIUM") | — |
| `status` | `String` | @default("OPEN") | — |
| `assignedTo` | `String?` | @db.VarChar(100) | — |
| `dueDate` | `DateTime?` | — | — |
| `resolvedAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `auditEngagement` | [`AuditEngagement`](#auditengagement) | one | `engagementId` → `id` | Cascade |

**Referenced by:** [`AuditEngagement`](#auditengagement).`auditFinding`

**Indexes**

- index `[engagementId]`

### AuditFirm

_Table `auditfirm` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `licenseNo` | `String?` | @db.VarChar(100) | — |
| `email` | `String?` | — | — |
| `phone` | `String?` | @db.VarChar(50) | — |
| `address` | `String?` | @db.Text | — |
| `contactPerson` | `String?` | @db.VarChar(200) | — |
| `industry` | `String?` | @db.VarChar(100) | — |
| `status` | `String` | @default("ACTIVE") | — |
| `rating` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `isActive` | `Boolean` | @default(true) | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `auditEngagement` | [`AuditEngagement`](#auditengagement) | many | _back-reference_ | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`AuditEngagement`](#auditengagement).`auditFirm` · [`Company`](#company).`auditFirm`

**Indexes**

- index `[companyId]`

### AuditLog

_Table `auditlog` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `action` | `String` | — | — |
| `userId` | `String?` | — | nullable — unauthenticated security events (pre-auth attacks) have no userId |
| `companyId` | `String?` | — | — |
| `details` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `user` | [`User`](#user) | optional one | `userId` → `id` | — |

**Referenced by:** [`User`](#user).`auditLog`

**Indexes**

- index `[companyId]`
- index `[userId]`
- index `[action, createdAt]`
- index `[companyId, createdAt(sort: Desc)]`
- index `[createdAt]`

### BankAccount

_Table `bankaccount` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `accountNumber` | `String` | — | — |
| `bankName` | `String` | — | — |
| `currencyCode` | `String` | @default("ETB") | — |
| `openingBalance` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `balance` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `accountType` | `String` | @default("BANK") @db.VarChar(20) | — |
| `accountStatus` | `String` | @default("ACTIVE") @db.VarChar(20) | — |
| `accountId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |
| `companyId` | `String?` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `bankTransaction` | [`BankTransaction`](#banktransaction) | many | _back-reference_ | — |
| `revenues` | [`Revenue`](#revenue) | many | _back-reference_ | — |
| `payments` | [`Payment`](#payment) | many | _back-reference_ | — |
| `transfersFrom` | [`FundTransfer`](#fundtransfer) | many | _back-reference_ | — |
| `transfersTo` | [`FundTransfer`](#fundtransfer) | many | _back-reference_ | — |
| `invoicePayments` | [`InvoicePayment`](#invoicepayment) | many | _back-reference_ | — |
| `billPayments` | [`BillPayment`](#billpayment) | many | _back-reference_ | — |
| `bankFeeds` | [`BankFeed`](#bankfeed) | many | _back-reference_ | — |
| `reconciliationPeriods` | [`ReconciliationPeriod`](#reconciliationperiod) | many | _back-reference_ | — |

**Referenced by:** [`BankFeed`](#bankfeed).`bankAccount` · [`BankTransaction`](#banktransaction).`bankAccount` · [`BillPayment`](#billpayment).`bankAccount` · [`Company`](#company).`bankAccount` · [`FundTransfer`](#fundtransfer).`fromBankAcc` · [`FundTransfer`](#fundtransfer).`toBankAcc` · [`InvoicePayment`](#invoicepayment).`bankAccount` · [`Payment`](#payment).`bankAccount` · [`ReconciliationPeriod`](#reconciliationperiod).`bankAccount` · [`Revenue`](#revenue).`bankAccount`

**Indexes**

- index `[companyId]`
- index `[accountType]`
- index `[accountStatus]`

### BankFeed

_Table `bankfeed` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `bankAccountId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `provider` | `BankFeedProvider` | @default(MANUAL) | — |
| `status` | `BankFeedStatus` | @default(PENDING_AUTH) | — |
| `lastSyncAt` | `DateTime?` | — | — |
| `institutionId` | `String?` | @db.VarChar(100) | — |
| `institutionName` | `String?` | @db.VarChar(200) | — |
| `errorMessage` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `bankAccount` | [`BankAccount`](#bankaccount) | one | `bankAccountId` → `id` | Cascade |

**Referenced by:** [`BankAccount`](#bankaccount).`bankFeeds` · [`Company`](#company).`bankFeed`

**Indexes**

- index `[companyId]`
- index `[bankAccountId]`
- index `[status]`

### BankFxRate

FX rate snapshot — used for multi-currency account valuation and realized exchange gain/loss computation during reconciliation.

_Table `bankfxrate` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `fromCurrency` | `String` | @db.VarChar(3) | — |
| `toCurrency` | `String` | @db.VarChar(3) | — |
| `rate` | `Decimal` | @db.Decimal(18, 6) | — |
| `rateDate` | `DateTime` | @default(now()) | — |
| `source` | `String?` | @db.VarChar(50) | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`bankFxRates`

**Indexes**

- unique `[fromCurrency, toCurrency, rateDate, companyId]`
- index `[fromCurrency, toCurrency]`
- index `[companyId]`
- index `[rateDate]`

### BankMatchingRule

Auto-match rule — maps a description pattern to a transaction category. Replaces the previous systemsetting KV store approach. Run: npm run db:push && npm run db:generate

_Table `bankmatchingrule` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `pattern` | `String` | @db.VarChar(200) | Case-insensitive substring to match in transaction description |
| `type` | `String` | @default("ANY") @db.VarChar(20) | INCOME \| EXPENSE \| ANY |
| `categoryId` | `String?` | @db.VarChar(36) | — |
| `categoryName` | `String?` | @db.VarChar(100) | — |
| `priority` | `Int` | @default(0) | Sort order — lower number = higher priority (evaluated first) |
| `isActive` | `Boolean` | @default(true) | — |
| `hits` | `Int` | @default(0) | Cumulative count of transactions this rule has categorized |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`bankMatchingRule`

**Indexes**

- index `[companyId]`
- index `[isActive]`

### BankPayrollExport

_Table `bank_payroll_export` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `period` | `String` | @db.VarChar(7) | — |
| `bankFormat` | `String` | @default("GENERIC") @db.VarChar(20) | CBE \| AWASH \| DASHEN \| ABYSSINIA \| BERHAN \| GENERIC |
| `employeeCount` | `Int` | @default(0) | — |
| `totalAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `fileName` | `String?` | @db.VarChar(255) | — |
| `fileData` | `String?` | @db.LongText | — |
| `status` | `String` | @default("GENERATED") @db.VarChar(20) | GENERATED \| SENT \| CONFIRMED \| FAILED |
| `generatedBy` | `String?` | @db.VarChar(100) | — |
| `sentAt` | `DateTime?` | — | — |
| `confirmedAt` | `DateTime?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Indexes**

- index `[companyId]`
- index `[period]`
- index `[status]`

### BankStatementLine

_Table `bank_statement_line` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `bankAccountId` | `String` | — | — |
| `date` | `DateTime` | @default(now()) | — |
| `description` | `String` | @db.VarChar(500) | — |
| `amount` | `Decimal` | @db.Decimal(19, 4) | — |
| `type` | `BankTxnType` | — | — |
| `matched` | `Boolean` | @default(false) | — |
| `matchedEntryId` | `String?` | @db.VarChar(36) | — |
| `companyId` | `String` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`bankStatementLines`

**Indexes**

- index `[bankAccountId]`
- index `[companyId, matched]`

### BankTransaction

_Table `banktransaction` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `bankAccountId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `date` | `DateTime` | — | — |
| `description` | `String` | — | — |
| `amount` | `Decimal` | — | — |
| `reference` | `String?` | @db.VarChar(200) | — |
| `status` | `String` | @default("PENDING") | — |
| `journalEntryId` | `String?` | — | — |
| `bankName` | `String?` | @db.VarChar(100) | — |
| `counterparty` | `String?` | @db.VarChar(200) | — |
| `matchMethod` | `String?` | @db.VarChar(30) | — |
| `matchScore` | `Int` | @default(0) | — |
| `matchedBillId` | `String?` | @db.VarChar(36) | — |
| `matchedInvoiceId` | `String?` | @db.VarChar(36) | — |
| `notes` | `String?` | @db.Text | — |
| `qrCode` | `String?` | @db.Text | — |
| `telecomRef` | `String?` | @db.VarChar(100) | — |
| `type` | `String` | @default("CREDIT") @db.VarChar(10) | — |
| `voucherCode` | `String?` | @db.VarChar(100) | — |
| `category` | `String?` | @db.VarChar(100) | Category label (denormalised for fast display — also linked via categoryId) |
| `categoryId` | `String?` | @db.VarChar(36) | — |
| `isDuplicate` | `Boolean` | @default(false) | Marks a transaction as a duplicate of another (for feed dedup) |
| `duplicateOfId` | `String?` | @db.VarChar(36) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `bankAccount` | [`BankAccount`](#bankaccount) | one | `bankAccountId` → `id` | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `journalEntry` | [`JournalEntry`](#journalentry) | optional one | `journalEntryId` → `id` | — |
| `invoicePayments` | [`InvoicePayment`](#invoicepayment) | many | _back-reference_ | — |
| `billPayments` | [`BillPayment`](#billpayment) | many | _back-reference_ | — |
| `fxAdjustments` | [`BankTransactionFx`](#banktransactionfx) | many | _back-reference_ | — |

**Referenced by:** [`BankAccount`](#bankaccount).`bankTransaction` · [`BankTransactionFx`](#banktransactionfx).`bankTransaction` · [`BillPayment`](#billpayment).`bankTransaction` · [`Company`](#company).`bankTransaction` · [`InvoicePayment`](#invoicepayment).`bankTransaction` · [`JournalEntry`](#journalentry).`bankTransaction`

**Indexes**

- index `[date]`
- index `[reference]`
- index `[status]`
- index `[telecomRef]`
- index `[bankAccountId]`
- index `[journalEntryId]`
- index `[companyId]`
- index `[categoryId]`

### BankTransactionFx

Per-transaction FX adjustment — captures the realized exchange gain or loss when a foreign-currency bank transaction is settled or reconciled.

_Table `banktransactionfx` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `bankTransactionId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `fromCurrency` | `String` | @db.VarChar(3) | — |
| `toCurrency` | `String` | @db.VarChar(3) | — |
| `originalAmount` | `Decimal` | — | — |
| `convertedAmount` | `Decimal` | — | — |
| `rateAtBooking` | `Decimal` | @db.Decimal(18, 6) | — |
| `rateAtSettlement` | `Decimal` | @db.Decimal(18, 6) | — |
| `gainLoss` | `Decimal` | — | — |
| `reason` | `String?` | @db.VarChar(50) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `bankTransaction` | [`BankTransaction`](#banktransaction) | one | `bankTransactionId` → `id` | Cascade |

**Referenced by:** [`BankTransaction`](#banktransaction).`fxAdjustments` · [`Company`](#company).`bankTransactionFxAdjustments`

**Indexes**

- index `[bankTransactionId]`
- index `[companyId]`

### BatchPayout

_Table `batch_payout` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `employeeId` | `String` | @db.VarChar(36) | — |
| `employeeName` | `String` | @db.VarChar(200) | — |
| `bankName` | `String?` | @db.VarChar(200) | — |
| `accountNumber` | `String?` | @db.VarChar(100) | — |
| `amount` | `Decimal` | — | — |
| `year` | `Int` | — | — |
| `month` | `Int` | — | — |
| `status` | `String` | @default("QUEUED") @db.VarChar(50) | — |
| `reference` | `String?` | @db.VarChar(200) | — |
| `processedAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`batchPayouts`

**Indexes**

- unique `[employeeId, year, month]`
- index `[companyId]`

### Bill

_Table `bill` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `billNumber` | `String` | @unique(map: "Bill_billNumber_key") | — |
| `date` | `DateTime` | @default(now()) | — |
| `category` | `String` | — | — |
| `categoryId` | `String?` | — | — |
| `companyId` | `String?` | — | — |
| `status` | `String` | @default("PENDING") | — |
| `currencyCode` | `String` | @default("ETB") @db.VarChar(3) | — |
| `currencyRate` | `Decimal` | @default(1.0) | — |
| `dueDate` | `DateTime` | — | — |
| `amount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `vatAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `total` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |
| `accountId` | `String?` | — | — |
| `journalEntryId` | `String?` | @db.VarChar(36) | — |
| `notes` | `String?` | @db.Text | — |
| `color` | `String?` | @db.VarChar(10) | Bill display color (hex) for branding — Ovds "Changing the Color of a Bill" |
| `guaranteePeriodDays` | `Int?` | — | Agency placement: guarantee window in days (Workflow A) |
| `placementDate` | `DateTime?` | — | Agency placement: date the candidate started work (Workflow A) |
| `linkedEmployeeId` | `String?` | @db.VarChar(36) | Agency placement: FK to hired Employee record (Workflow A) |
| `vendorId` | `String?` | — | — |
| `vatRate` | `Decimal?` | — | — |
| `vendorName` | `String?` | @db.VarChar(200) | — |
| `vendorTin` | `String?` | @db.VarChar(15) | — |
| `vendorFsNo` | `String?` | @db.VarChar(50) | Fiscal Sales Register Machine Number issued by ERCA for the vendor's SRM device Required on all vendor invoices where whtApplicable=true (Proc. 1395/2025 Art. 94) |
| `vendorVatRegNo` | `String?` | @db.VarChar(50) | Vendor VAT registration number (for input VAT claimability) |
| `hsCode` | `String?` | @db.VarChar(20) | HS tariff code for imported goods (customs + input VAT linkage) |
| `whtApplicable` | `Boolean` | @default(false) | — |
| `whtAmount` | `Decimal` | @default(0.000000000000000000000000000000) | WHT amount withheld (auto-calculated when whtApplicable=true — Proc. 1395/2025 Art. 94) |
| `whtType` | `String?` | @db.VarChar(20) | WHT type: GOODS \| SERVICES \| SERVICES_NR \| RENT |
| `isRecurring` | `Boolean` | @default(false) | — |
| `recurringInterval` | `String?` | @db.VarChar(20) | — |
| `recurringNextDate` | `DateTime?` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `categoryRef` | [`Category`](#category) | optional one | `categoryId` → `id` | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `vendor` | [`Vendor`](#vendor) | optional one | `vendorId` → `id` | — |
| `journalEntry` | [`JournalEntry`](#journalentry) | optional one | `journalEntryId` → `id` | — |
| `billItem` | [`BillItem`](#billitem) | many | _back-reference_ | — |
| `billPayment` | [`BillPayment`](#billpayment) | many | _back-reference_ | — |
| `paymentBatchItem` | [`PaymentBatchItem`](#paymentbatchitem) | many | _back-reference_ | — |
| `vendorPayments` | [`VendorPayment`](#vendorpayment) | many | _back-reference_ | — |

**Referenced by:** [`BillItem`](#billitem).`bill` · [`BillPayment`](#billpayment).`bill` · [`Category`](#category).`bills` · [`Company`](#company).`bill` · [`JournalEntry`](#journalentry).`bill` · [`PaymentBatchItem`](#paymentbatchitem).`bill` · [`Vendor`](#vendor).`bill` · [`VendorPayment`](#vendorpayment).`bill`

**Indexes**

- index `[companyId]`
- index `[companyId, status]`
- index `[companyId, dueDate]`
- index `[dueDate]`
- index `[status]`
- index `[vendorId]`
- index `[journalEntryId]`
- index `[linkedEmployeeId]`

### BillItem

_Table `billitem` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `billId` | `String` | — | — |
| `itemId` | `String?` | — | — |
| `companyId` | `String?` | — | — |
| `description` | `String?` | @db.VarChar(500) | — |
| `quantity` | `Int` | @default(1) | — |
| `purchasePrice` | `Decimal` | — | — |
| `vatRate` | `Decimal` | @default(15.000000000000000000000000000000) | — |
| `vatAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `totalAmount` | `Decimal` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `bill` | [`Bill`](#bill) | one | `billId` → `id` | Cascade |
| `item` | [`Item`](#item) | optional one | `itemId` → `id` | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Bill`](#bill).`billItem` · [`Company`](#company).`billItem` · [`Item`](#item).`billItem`

**Indexes**

- index `[billId]`
- index `[itemId]`
- index `[companyId]`

### BillPayment

_Table `billpayment` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `billId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `amount` | `Decimal` | — | — |
| `currencyCode` | `String` | @default("ETB") @db.VarChar(3) | — |
| `currencyRate` | `Decimal` | @default(1.0) | — |
| `method` | `String` | @default("CASH") | — |
| `reference` | `String?` | @db.VarChar(200) | — |
| `notes` | `String?` | @db.VarChar(500) | — |
| `paidAt` | `DateTime` | @default(now()) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `journalEntryId` | `String?` | @db.VarChar(36) | — |
| `bankAccountId` | `String?` | — | — |
| `bankTransactionId` | `String?` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `bill` | [`Bill`](#bill) | one | `billId` → `id` | Cascade |
| `journalEntry` | [`JournalEntry`](#journalentry) | optional one | `journalEntryId` → `id` | — |
| `bankAccount` | [`BankAccount`](#bankaccount) | optional one | `bankAccountId` → `id` | — |
| `bankTransaction` | [`BankTransaction`](#banktransaction) | optional one | `bankTransactionId` → `id` | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`BankAccount`](#bankaccount).`billPayments` · [`BankTransaction`](#banktransaction).`billPayments` · [`Bill`](#bill).`billPayment` · [`Company`](#company).`billPayment` · [`JournalEntry`](#journalentry).`billPayment`

**Indexes**

- index `[billId]`
- index `[journalEntryId]`
- index `[companyId]`

### BiometricData

_Table `biometricdata` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `type` | `BiometricType` | — | — |
| `template` | `String` | — | — |
| `employeeId` | `String` | — | — |
| `registeredAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `employee` | [`Employee`](#employee) | one | `employeeId` → `id` | Cascade |

**Referenced by:** [`Employee`](#employee).`biometricData`

**Indexes**

- index `[employeeId]`

### BomHeader

_Table `bom_header` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(cuid()) | — |
| `companyId` | `String` | — | — |
| `itemCode` | `String` | @db.VarChar(100) | — |
| `description` | `String?` | @db.Text | — |
| `quantity` | `Int` | @default(0) | — |
| `unit` | `String?` | @default("EA") @db.VarChar(10) | — |
| `CostRollupDate` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |
| `lines` | [`BomLine`](#bomline) | many | _back-reference_ | — |

**Referenced by:** [`BomLine`](#bomline).`bomHeader` · [`Company`](#company).`bomHeaders`

**Indexes**

- index `[companyId]`

### BomLine

_Table `bom_line` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(cuid()) | — |
| `BomHeaderId` | `String` | — | — |
| `LineOrder` | `Int` | @default(0) | — |
| `ComponentCode` | `String?` | @db.VarChar(100) | — |
| `description` | `String?` | @db.Text | — |
| `quantity` | `Int` | @default(0) | — |
| `unit` | `String?` | @default("EA") @db.VarChar(10) | — |
| `IsPhantom` | `Boolean` | @default(false) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `bomHeader` | [`BomHeader`](#bomheader) | one | `BomHeaderId` → `id` | Cascade |

**Referenced by:** [`BomHeader`](#bomheader).`lines`

### Budget

_Table `budget` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `accountId` | `String?` | — | — |
| `name` | `String?` | @db.VarChar(200) | Account name (denormalized for display when accountId is null) |
| `category` | `String?` | @db.VarChar(50) | Account category (EXPENSE, REVENUE, etc.) |
| `year` | `Int` | — | — |
| `period` | `String?` | @db.VarChar(7) | Budget period YYYY-MM (for monthly budgets) |
| `amount` | `Decimal` | @default(0) @db.Decimal(18, 2) | Monthly budget amount |
| `annualAmount` | `Decimal?` | @db.Decimal(18, 2) | Annual budget total |
| `actualAmount` | `Decimal?` | @db.Decimal(18, 2) | Actual spend auto-populated from posted JournalLines by the budget-actuals cron job. Used by BudgetVariance page for live budget-vs-actual without a separate table. |
| `ytdActual` | `Decimal?` | @db.Decimal(18, 2) | Year-to-date actual spend (sum of actualAmount across all months to date) |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `account` | [`Account`](#account) | optional one | `accountId` → `id` | — |

**Referenced by:** [`Account`](#account).`budgets`

**Indexes**

- index `[companyId]`
- index `[accountId]`
- index `[year]`
- index `[period]`

### BusinessLoan

_Table `businessloan` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `loanNumber` | `String` | @unique(map: "BusinessLoan_loanNumber_key") @db.VarChar(100) | — |
| `bankName` | `String` | @db.VarChar(200) | — |
| `loanType` | `LoanType` | @default(TERM_LOAN) | — |
| `status` | `LoanStatus` | @default(APPLIED) | — |
| `appliedAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `approvedAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `disbursedAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `outstandingBalance` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `interestRate` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `applicationDate` | `DateTime?` | — | — |
| `approvalDate` | `DateTime?` | — | — |
| `disbursementDate` | `DateTime?` | — | — |
| `maturityDate` | `DateTime?` | — | — |
| `purpose` | `String?` | @db.Text | — |
| `collateral` | `String?` | @db.Text | — |
| `partnershipId` | `String?` | — | — |
| `customerId` | `String?` | — | — |
| `organizationStructureScore` | `Int` | @default(0) | — |
| `customerRelationshipScore` | `Int` | @default(0) | — |
| `financialTransparencyScore` | `Int` | @default(0) | — |
| `overallCreditScore` | `Int` | @default(0) | — |
| `monthlyInstallment` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `totalRepaid` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `nextPaymentDate` | `DateTime?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `kycStatus` | `String?` | @db.VarChar(20) | — |
| `kycVerifiedAt` | `DateTime?` | — | — |
| `personalGuarantee` | `Boolean` | @default(false) | — |
| `guarantorName` | `String?` | @db.VarChar(200) | — |
| `guarantorTin` | `String?` | @db.VarChar(50) | — |
| `amlRiskLevel` | `String?` | @db.VarChar(20) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |
| `companyId` | `String?` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `customer` | [`Customer`](#customer) | optional one | `customerId` → `id` | — |
| `partnership` | [`Partnership`](#partnership) | optional one | `partnershipId` → `id` | — |
| `loanRepayment` | [`LoanRepayment`](#loanrepayment) | many | _back-reference_ | — |

**Referenced by:** [`Customer`](#customer).`businessLoan` · [`LoanRepayment`](#loanrepayment).`businessLoan` · [`Partnership`](#partnership).`businessLoan`

**Indexes**

- index `[companyId]`
- index `[customerId]`
- index `[partnershipId]`
- index `[status]`

### CapitalizationDecision

_Table `capitalization_decision` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `workItemId` | `String` | @unique | — |
| `approverId` | `String` | — | — |
| `reasonCode` | `String` | — | — |
| `evidenceRefs` | `Json` | — | — |
| `status` | `CapDecisionStatus` | @default(APPROVED) | — |
| `decidedAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `workItem` | [`SoftwareWorkItem`](#softwareworkitem) | one | `workItemId` → `id` | Cascade |

**Referenced by:** [`SoftwareWorkItem`](#softwareworkitem).`capitalizationDecision`

### CargoManifest

_Table `cargo_manifest` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `vehicleRef` | `String` | @db.VarChar(100) | Vessel/flight/truck number |
| `transportMode` | `String` | @default("SEA") @db.VarChar(10) | SEA \| AIR \| LAND |
| `portOfArrival` | `String?` | @db.VarChar(100) | — |
| `arrivalDate` | `DateTime?` | — | — |
| `eManifestRef` | `String?` | @db.VarChar(100) | e-Manifest reference from ECC |
| `totalBillsOfLading` | `Int` | @default(0) | — |
| `totalWeight` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `totalVolume` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `status` | `String` | @default("DRAFT") @db.VarChar(20) | DRAFT \| SUBMITTED \| ACCEPTED \| REJECTED |
| `submittedAt` | `DateTime?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[status]`

### CashForecast

_Table `cashforecast` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `period` | `String` | @unique(map: "CashForecast_period_key") @db.VarChar(20) | — |
| `inflows` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `outflows` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `netCash` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `projected` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `low` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `high` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `confidence` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `notes` | `String?` | @db.Text | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`cashForecast`

**Indexes**

- index `[companyId]`

### Category

_Table `category` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `type` | `String` | @db.VarChar(20) // income, expense, item, other | — |
| `color` | `String?` | @db.VarChar(10) | — |
| `enabled` | `Boolean` | @default(true) | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `revenues` | [`Revenue`](#revenue) | many | _back-reference_ | — |
| `payments` | [`Payment`](#payment) | many | _back-reference_ | — |
| `items` | [`Item`](#item) | many | _back-reference_ | — |
| `invoices` | [`Invoice`](#invoice) | many | _back-reference_ | — |
| `bills` | [`Bill`](#bill) | many | _back-reference_ | — |

**Referenced by:** [`Bill`](#bill).`categoryRef` · [`Company`](#company).`category` · [`Invoice`](#invoice).`categoryRef` · [`Item`](#item).`categoryRef` · [`Payment`](#payment).`category` · [`Revenue`](#revenue).`category`

**Indexes**

- unique `[name, type, companyId]`
- index `[companyId]`

### ClientNode

Registered workstation nodes for the hybrid Client. Each Enterprise plan company can register unlimited nodes. The node token is stored as a SHA-256 hash — the raw value is returned once at registration time and never stored in plaintext.

_Table `client_node` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @db.VarChar(64) | — |
| `companyId` | `String` | — | — |
| `friendlyName` | `String` | @db.VarChar(80) | Human-readable label set by the admin (e.g. "Office Workstation 1") |
| `role` | `String` | @default("REMOTE_TERMINAL") @db.VarChar(20) | REMOTE_TERMINAL \| PRIVATE_NODE |
| `tokenHash` | `String` | @db.VarChar(64) | SHA-256 hash of the one-time node token |
| `lastSeenAt` | `DateTime?` | — | UTC timestamp of last successful sync contact |
| `registeredAt` | `DateTime` | @default(now()) | — |
| `revoked` | `Boolean` | @default(false) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`clientNode`

**Indexes**

- index `[companyId]`
- index `[tokenHash]`

### CollectionCase

_Table `collectioncase` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `customerId` | `String` | — | — |
| `invoiceId` | `String?` | — | — |
| `amount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `stage` | `CollectionStage` | @default(NEW) | — |
| `status` | `String` | @default("OPEN") | — |
| `notes` | `String?` | @db.Text | — |
| `assignedTo` | `String?` | @db.VarChar(100) | — |
| `promiseDate` | `DateTime?` | — | — |
| `resolvedAt` | `DateTime?` | — | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `customer` | [`Customer`](#customer) | one | `customerId` → `id` | — |
| `invoice` | [`Invoice`](#invoice) | optional one | `invoiceId` → `id` | — |

**Referenced by:** [`Company`](#company).`collectionCase` · [`Customer`](#customer).`collectionCase` · [`Invoice`](#invoice).`collectionCase`

**Indexes**

- index `[companyId]`
- index `[customerId]`
- index `[invoiceId]`

### Company

_Table `company` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | @unique(map: "Company_name_key") | — |
| `type` | `CompanyType` | — | — |
| `tin` | `String?` | @db.VarChar(15) | — |
| `vatNumber` | `String?` | @db.VarChar(15) | — |
| `businessType` | `String?` | @db.VarChar(50) | — |
| `language` | `String?` | @default("en") @db.VarChar(10) | — |
| `location` | `String?` | @db.VarChar(200) | — |
| `apiKey` | `String?` | @unique @db.VarChar(100) | — |
| `currencyCode` | `String?` | @default("ETB") @db.VarChar(3) | — |
| `logoUrl` | `String?` | @db.VarChar(500) | — |
| `fiscalYearStart` | `Int?` | @default(2024) | — |
| `industry` | `String?` | @db.VarChar(100) | — |
| `teamSize` | `String?` | @db.VarChar(50) | — |
| `settings` | `String?` | @db.LongText | — |
| `ifrsConfig` | `String?` | @db.LongText | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `autoUpdate` | `Boolean` | @default(false) | — |
| `currentVersion` | `String?` | @default("2.0.0") | — |
| `environment` | `AppEnvironment` | @default(PRODUCTION) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `adminCreatedMenuItem` | [`AdminCreatedMenuItem`](#admincreatedmenuitem) | many | _back-reference_ | — |
| `auditEngagement` | [`AuditEngagement`](#auditengagement) | many | _back-reference_ | — |
| `auditFirm` | [`AuditFirm`](#auditfirm) | many | _back-reference_ | — |
| `bankAccount` | [`BankAccount`](#bankaccount) | many | _back-reference_ | — |
| `bankMatchingRule` | [`BankMatchingRule`](#bankmatchingrule) | many | _back-reference_ | — |
| `bill` | [`Bill`](#bill) | many | _back-reference_ | — |
| `debitNote` | [`DebitNote`](#debitnote) | many | _back-reference_ | — |
| `cashForecast` | [`CashForecast`](#cashforecast) | many | _back-reference_ | — |
| `collectionCase` | [`CollectionCase`](#collectioncase) | many | _back-reference_ | — |
| `featureFlags` | [`CompanyFeatureFlag`](#companyfeatureflag) | many | _back-reference_ | — |
| `releases` | [`CompanyRelease`](#companyrelease) | many | _back-reference_ | — |
| `creditHold` | [`CreditHold`](#credithold) | many | _back-reference_ | — |
| `customer` | [`Customer`](#customer) | many | _back-reference_ | — |
| `deduction` | [`Deduction`](#deduction) | many | _back-reference_ | — |
| `department` | [`Department`](#department) | many | _back-reference_ | — |
| `employee` | [`Employee`](#employee) | many | _back-reference_ | — |
| `financialStatementTemplate` | [`FinancialStatementTemplate`](#financialstatementtemplate) | many | _back-reference_ | — |
| `ifrsstandard` | [`ifrsstandard`](#ifrsstandard) | many | _back-reference_ | — |
| `incomeTaxFiling` | [`IncomeTaxFiling`](#incometaxfiling) | many | _back-reference_ | — |
| `totFiling` | [`TotFiling`](#totfiling) | many | _back-reference_ | — |
| `intercompanyFrom` | [`InterCompanyTransaction`](#intercompanytransaction) | many | _back-reference_ | — |
| `intercompanyTo` | [`InterCompanyTransaction`](#intercompanytransaction) | many | _back-reference_ | — |
| `invoice` | [`Invoice`](#invoice) | many | _back-reference_ | — |
| `item` | [`Item`](#item) | many | _back-reference_ | — |
| `loanRequest` | [`LoanRequest`](#loanrequest) | many | _back-reference_ | — |
| `loyaltyTierConfig` | [`LoyaltyTierConfig`](#loyaltytierconfig) | many | _back-reference_ | — |
| `otherPayment` | [`OtherPayment`](#otherpayment) | many | _back-reference_ | — |
| `otherPaymentHead` | [`OtherPaymentHead`](#otherpaymenthead) | many | _back-reference_ | — |
| `partnership` | [`Partnership`](#partnership) | many | _back-reference_ | — |
| `paymentBatch` | [`PaymentBatch`](#paymentbatch) | many | _back-reference_ | — |
| `payrollRecord` | [`PayrollRecord`](#payrollrecord) | many | _back-reference_ | — |
| `reimbursementClaim` | [`ReimbursementClaim`](#reimbursementclaim) | many | _back-reference_ | — |
| `review` | [`Review`](#review) | many | _back-reference_ | — |
| `reward` | [`Reward`](#reward) | many | _back-reference_ | — |
| `shift` | [`Shift`](#shift) | many | _back-reference_ | — |
| `user` | [`User`](#user) | many | _back-reference_ | — |
| `vatFiling` | [`VatFiling`](#vatfiling) | many | _back-reference_ | — |
| `vendor` | [`Vendor`](#vendor) | many | _back-reference_ | — |
| `lease` | [`Lease`](#lease) | many | _back-reference_ | — |
| `ticket` | [`Ticket`](#ticket) | many | _back-reference_ | — |
| `notificationTemplate` | [`NotificationTemplate`](#notificationtemplate) | many | _back-reference_ | — |
| `account` | [`Account`](#account) | many | _back-reference_ | — |
| `journalEntry` | [`JournalEntry`](#journalentry) | many | _back-reference_ | — |
| `journalLine` | [`JournalLine`](#journalline) | many | _back-reference_ | — |
| `billItem` | [`BillItem`](#billitem) | many | _back-reference_ | — |
| `invoiceItem` | [`InvoiceItem`](#invoiceitem) | many | _back-reference_ | — |
| `invoicePayment` | [`InvoicePayment`](#invoicepayment) | many | _back-reference_ | — |
| `billPayment` | [`BillPayment`](#billpayment) | many | _back-reference_ | — |
| `category` | [`Category`](#category) | many | _back-reference_ | — |
| `revenue` | [`Revenue`](#revenue) | many | _back-reference_ | — |
| `payment` | [`Payment`](#payment) | many | _back-reference_ | — |
| `vendorPayments` | [`VendorPayment`](#vendorpayment) | many | _back-reference_ | — |
| `fundTransfers` | [`FundTransfer`](#fundtransfer) | many | _back-reference_ | — |
| `pipelines` | [`Pipeline`](#pipeline) | many | _back-reference_ | — |
| `bankTransaction` | [`BankTransaction`](#banktransaction) | many | _back-reference_ | — |
| `bankFeed` | [`BankFeed`](#bankfeed) | many | _back-reference_ | — |
| `reconciliationPeriod` | [`ReconciliationPeriod`](#reconciliationperiod) | many | _back-reference_ | — |
| `reconciliationReport` | [`ReconciliationReport`](#reconciliationreport) | many | _back-reference_ | — |
| `disasterFundContribution` | [`DisasterFundContribution`](#disasterfundcontribution) | many | _back-reference_ | — |
| `scannedBill` | [`ScannedBill`](#scannedbill) | many | _back-reference_ | — |
| `monetizationSubscription` | [`MonetizationSubscription`](#monetizationsubscription) | many | _back-reference_ | — |
| `monetizationPurchase` | [`MonetizationPurchase`](#monetizationpurchase) | many | _back-reference_ | — |
| `monetizationTrial` | [`MonetizationTrial`](#monetizationtrial) | many | _back-reference_ | — |
| `monetizationEntitlement` | [`MonetizationEntitlement`](#monetizationentitlement) | many | _back-reference_ | — |
| `subscriptionUpdate` | [`SubscriptionUpdate`](#subscriptionupdate) | many | _back-reference_ | — |
| `offlineInvoiceQueue` | [`OfflineInvoiceQueue`](#offlineinvoicequeue) | many | _back-reference_ | — |
| `offlineDeviceRegistry` | [`OfflineDeviceRegistry`](#offlinedeviceregistry) | many | _back-reference_ | — |
| `clientNode` | [`ClientNode`](#clientnode) | many | _back-reference_ | — |
| `workOrders` | [`WorkOrder`](#workorder) | many | _back-reference_ | — |
| `bomHeaders` | [`BomHeader`](#bomheader) | many | _back-reference_ | — |
| `taxProfile` | [`CompanyTaxProfile`](#companytaxprofile) | optional one | _back-reference_ | — |
| `vatInputLedger` | [`VatInputLedger`](#vatinputledger) | many | _back-reference_ | — |
| `vatOutputLedger` | [`VatOutputLedger`](#vatoutputledger) | many | _back-reference_ | — |
| `vatReverseCharge` | [`VatReverseCharge`](#vatreversecharge) | many | _back-reference_ | — |
| `vatRefundClaim` | [`VatRefundClaim`](#vatrefundclaim) | many | _back-reference_ | — |
| `vatNote` | [`VatNote`](#vatnote) | many | _back-reference_ | — |
| `vatWithholding` | [`VatWithholding`](#vatwithholding) | many | _back-reference_ | — |
| `vatExportEvidence` | [`VatExportEvidence`](#vatexportevidence) | many | _back-reference_ | — |
| `vatETaxSubmission` | [`VatETaxSubmission`](#vatetaxsubmission) | many | _back-reference_ | — |
| `vatDeclaration` | [`VatDeclaration`](#vatdeclaration) | many | _back-reference_ | — |
| `modularSettings` | [`Setting`](#setting) | many | _back-reference_ | — |
| `companyModuleSettings` | [`CompanyModule`](#companymodule) | many | _back-reference_ | — |
| `appInstallations` | [`AppInstallation`](#appinstallation) | many | _back-reference_ | — |
| `customRoles` | [`RoleDefinition`](#roledefinition) | many | _back-reference_ | — |
| `customPermissions` | [`Permission`](#permission) | many | _back-reference_ | — |
| `companySettingValues` | [`SettingValue`](#settingvalue) | many | _back-reference_ | — |
| `moduleSettings` | [`ModuleSetting`](#modulesetting) | many | _back-reference_ | — |
| `verifiedLedgerStates` | [`VerifiedLedgerState`](#verifiedledgerstate) | many | _back-reference_ | — |
| `webhookEndpoints` | [`WebhookEndpoint`](#webhookendpoint) | many | _back-reference_ | — |
| `financialTrackings` | [`FinancialTracking`](#financialtracking) | many | _back-reference_ | — |
| `geographicTaxRules` | [`GeographicTaxRule`](#geographictaxrule) | many | _back-reference_ | — |
| `ocrExtractions` | [`OcrExtraction`](#ocrextraction) | many | _back-reference_ | — |
| `receiptStorages` | [`ReceiptStorage`](#receiptstorage) | many | _back-reference_ | — |
| `multiCurrencyExceptions` | [`MultiCurrencyException`](#multicurrencyexception) | many | _back-reference_ | — |
| `dualNodeVerifications` | [`DualNodeVerification`](#dualnodeverification) | many | _back-reference_ | — |
| `assetLiabilityLoops` | [`AssetLiabilityLoop`](#assetliabilityloop) | many | _back-reference_ | — |
| `profileMetadataScopes` | [`ProfileMetadataScope`](#profilemetadatascope) | many | _back-reference_ | — |
| `profileMetadatas` | [`ProfileMetadata`](#profilemetadata) | many | _back-reference_ | — |
| `payrollDeductionCalculations` | [`PayrollDeductionCalculation`](#payrolldeductioncalculation) | many | _back-reference_ | — |
| `batchPayouts` | [`BatchPayout`](#batchpayout) | many | _back-reference_ | — |
| `entities` | [`Entity`](#entity) | many | _back-reference_ | — |
| `stockMovements` | [`StockMovement`](#stockmovement) | many | _back-reference_ | — |
| `purchaseReceipts` | [`PurchaseReceipt`](#purchasereceipt) | many | _back-reference_ | — |
| `bankStatementLines` | [`BankStatementLine`](#bankstatementline) | many | _back-reference_ | — |
| `syncQueues` | [`SyncQueue`](#syncqueue) | many | _back-reference_ | — |
| `periodCloses` | [`PeriodClose`](#periodclose) | many | _back-reference_ | — |
| `iotFiscalEvents` | [`IotFiscalEvent`](#iotfiscalevent) | many | _back-reference_ | — |
| `whtWithholdings` | [`WhtWithholding`](#whtwithholding) | many | _back-reference_ | — |
| `payrollLines` | [`PayrollLine`](#payrollline) | many | _back-reference_ | — |
| `featureEntitlements` | [`FeatureEntitlement`](#featureentitlement) | many | _back-reference_ | — |
| `eclProvisions` | [`EclProvision`](#eclprovision) | many | _back-reference_ | — |
| `ifrs15Schedules` | [`Ifrs15Schedule`](#ifrs15schedule) | many | _back-reference_ | — |
| `fixedAssetDisposals` | [`FixedAssetDisposal`](#fixedassetdisposal) | many | _back-reference_ | — |
| `fxRates` | [`FxRate`](#fxrate) | many | _back-reference_ | — |
| `entityGroups` | [`EntityGroup`](#entitygroup) | many | _back-reference_ | — |
| `eliminationEntries` | [`EliminationEntry`](#eliminationentry) | many | _back-reference_ | — |
| `translationReserves` | [`TranslationReserve`](#translationreserve) | many | _back-reference_ | — |
| `reportDefinitions` | [`ReportDefinition`](#reportdefinition) | many | _back-reference_ | — |
| `reportLines` | [`ReportLine`](#reportline) | many | _back-reference_ | — |
| `customFields` | [`CustomField`](#customfield) | many | _back-reference_ | — |
| `customFieldValues` | [`CustomFieldValue`](#customfieldvalue) | many | _back-reference_ | — |
| `eimsSourceSystems` | [`EimsSourceSystem`](#eimssourcesystem) | many | _back-reference_ | — |
| `notifications` | [`Notification`](#notification) | many | _back-reference_ | — |
| `notificationCampaigns` | [`NotificationCampaign`](#notificationcampaign) | many | _back-reference_ | — |
| `paymentBatchItems` | [`PaymentBatchItem`](#paymentbatchitem) | many | _back-reference_ | — |
| `accrualPostings` | [`AccrualPosting`](#accrualposting) | many | _back-reference_ | — |
| `ledgerEntries` | [`LedgerEntry`](#ledgerentry) | many | _back-reference_ | — |
| `salesOrderCreditNoteItems` | [`SalesOrderCreditNoteItem`](#salesordercreditnoteitem) | many | _back-reference_ | — |
| `bankFxRates` | [`BankFxRate`](#bankfxrate) | many | _back-reference_ | — |
| `bankTransactionFxAdjustments` | [`BankTransactionFx`](#banktransactionfx) | many | _back-reference_ | — |
| `ledgerMappingRules` | [`LedgerMappingRule`](#ledgermappingrule) | many | _back-reference_ | — |
| `fiscalYears` | [`FiscalYear`](#fiscalyear) | many | _back-reference_ | — |
| `securityAssessment` | [`SecurityAssessment`](#securityassessment) | many | _back-reference_ | — |

**Referenced by:** [`Account`](#account).`company` · [`AccrualPosting`](#accrualposting).`company` · [`AdminCreatedMenuItem`](#admincreatedmenuitem).`company` · [`AppInstallation`](#appinstallation).`company` · [`AssetLiabilityLoop`](#assetliabilityloop).`company` · [`AuditEngagement`](#auditengagement).`company` · [`AuditFirm`](#auditfirm).`company` · [`BankAccount`](#bankaccount).`company` · [`BankFeed`](#bankfeed).`company` · [`BankFxRate`](#bankfxrate).`company` · [`BankMatchingRule`](#bankmatchingrule).`company` · [`BankStatementLine`](#bankstatementline).`company` · [`BankTransaction`](#banktransaction).`company` · [`BankTransactionFx`](#banktransactionfx).`company` · [`BatchPayout`](#batchpayout).`company` · [`Bill`](#bill).`company` · [`BillItem`](#billitem).`company` · [`BillPayment`](#billpayment).`company` · [`BomHeader`](#bomheader).`company` · [`CashForecast`](#cashforecast).`company` · [`Category`](#category).`company` · [`ClientNode`](#clientnode).`company` · [`CollectionCase`](#collectioncase).`company` · [`CompanyFeatureFlag`](#companyfeatureflag).`company` · [`CompanyModule`](#companymodule).`company` · [`CompanyRelease`](#companyrelease).`company` · [`CompanyTaxProfile`](#companytaxprofile).`company` · [`CreditHold`](#credithold).`company` · [`Customer`](#customer).`company` · [`CustomField`](#customfield).`company` · [`CustomFieldValue`](#customfieldvalue).`company` · [`DebitNote`](#debitnote).`company` · [`Deduction`](#deduction).`company` · [`Department`](#department).`company` · [`DisasterFundContribution`](#disasterfundcontribution).`company` · [`DualNodeVerification`](#dualnodeverification).`company` · [`EclProvision`](#eclprovision).`company` · [`EimsSourceSystem`](#eimssourcesystem).`company` · [`EliminationEntry`](#eliminationentry).`company` · [`Employee`](#employee).`company` · [`Entity`](#entity).`company` · [`EntityGroup`](#entitygroup).`companies` · [`FeatureEntitlement`](#featureentitlement).`company` · [`FinancialStatementTemplate`](#financialstatementtemplate).`company` · [`FinancialTracking`](#financialtracking).`company` · [`FiscalYear`](#fiscalyear).`company` · [`FixedAssetDisposal`](#fixedassetdisposal).`company` · [`FundTransfer`](#fundtransfer).`company` · [`FxRate`](#fxrate).`company` · [`GeographicTaxRule`](#geographictaxrule).`company` · [`Ifrs15Schedule`](#ifrs15schedule).`company` · [`ifrsstandard`](#ifrsstandard).`company` · [`IncomeTaxFiling`](#incometaxfiling).`company` · [`InterCompanyTransaction`](#intercompanytransaction).`fromCompany` · [`InterCompanyTransaction`](#intercompanytransaction).`toCompany` · [`Invoice`](#invoice).`company` · [`InvoiceItem`](#invoiceitem).`company` · [`InvoicePayment`](#invoicepayment).`company` · [`IotFiscalEvent`](#iotfiscalevent).`company` · [`Item`](#item).`company` · [`JournalEntry`](#journalentry).`company` · [`JournalLine`](#journalline).`company` · [`Lease`](#lease).`company` · [`LedgerEntry`](#ledgerentry).`company` · [`LedgerMappingRule`](#ledgermappingrule).`company` · [`LoanRequest`](#loanrequest).`company` · [`LoyaltyTierConfig`](#loyaltytierconfig).`company` · [`ModuleSetting`](#modulesetting).`company` · [`MonetizationEntitlement`](#monetizationentitlement).`company` · [`MonetizationPurchase`](#monetizationpurchase).`company` · [`MonetizationSubscription`](#monetizationsubscription).`company` · [`MonetizationTrial`](#monetizationtrial).`company` · [`MultiCurrencyException`](#multicurrencyexception).`company` · [`Notification`](#notification).`company` · [`NotificationCampaign`](#notificationcampaign).`company` · [`NotificationTemplate`](#notificationtemplate).`company` · [`OcrExtraction`](#ocrextraction).`company` · [`OfflineDeviceRegistry`](#offlinedeviceregistry).`company` · [`OfflineInvoiceQueue`](#offlineinvoicequeue).`company` · [`OtherPayment`](#otherpayment).`company` · [`OtherPaymentHead`](#otherpaymenthead).`company` · [`Partnership`](#partnership).`company` · [`Payment`](#payment).`company` · [`PaymentBatch`](#paymentbatch).`company` · [`PaymentBatchItem`](#paymentbatchitem).`company` · [`PayrollDeductionCalculation`](#payrolldeductioncalculation).`company` · [`PayrollLine`](#payrollline).`company` · [`PayrollRecord`](#payrollrecord).`company` · [`PeriodClose`](#periodclose).`company` · [`Permission`](#permission).`company` · [`Pipeline`](#pipeline).`company` · [`ProfileMetadata`](#profilemetadata).`company` · [`ProfileMetadataScope`](#profilemetadatascope).`company` · [`PurchaseReceipt`](#purchasereceipt).`company` · [`ReceiptStorage`](#receiptstorage).`company` · [`ReconciliationPeriod`](#reconciliationperiod).`company` · [`ReconciliationReport`](#reconciliationreport).`company` · [`ReimbursementClaim`](#reimbursementclaim).`company` · [`ReportDefinition`](#reportdefinition).`company` · [`ReportLine`](#reportline).`company` · [`Revenue`](#revenue).`company` · [`Review`](#review).`company` · [`Reward`](#reward).`company` · [`RoleDefinition`](#roledefinition).`company` · [`SalesOrderCreditNoteItem`](#salesordercreditnoteitem).`company` · [`ScannedBill`](#scannedbill).`company` · [`SecurityAssessment`](#securityassessment).`company` · [`Setting`](#setting).`company` · [`SettingValue`](#settingvalue).`company` · [`Shift`](#shift).`company` · [`StockMovement`](#stockmovement).`company` · [`SubscriptionUpdate`](#subscriptionupdate).`company` · [`SyncQueue`](#syncqueue).`company` · [`Ticket`](#ticket).`company` · [`TotFiling`](#totfiling).`company` · [`TranslationReserve`](#translationreserve).`company` · [`User`](#user).`company` · [`VatDeclaration`](#vatdeclaration).`company` · [`VatETaxSubmission`](#vatetaxsubmission).`company` · [`VatExportEvidence`](#vatexportevidence).`company` · [`VatFiling`](#vatfiling).`company` · [`VatInputLedger`](#vatinputledger).`company` · [`VatNote`](#vatnote).`company` · [`VatOutputLedger`](#vatoutputledger).`company` · [`VatRefundClaim`](#vatrefundclaim).`company` · [`VatReverseCharge`](#vatreversecharge).`company` · [`VatWithholding`](#vatwithholding).`company` · [`Vendor`](#vendor).`company` · [`VendorPayment`](#vendorpayment).`company` · [`VerifiedLedgerState`](#verifiedledgerstate).`company` · [`WebhookEndpoint`](#webhookendpoint).`company` · [`WhtWithholding`](#whtwithholding).`company` · [`WorkOrder`](#workorder).`company`

### CompanyFeatureFlag

_Table `company_feature_flag` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `flagId` | `String` | — | — |
| `isEnabled` | `Boolean` | @default(false) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | — |
| `featureFlag` | [`FeatureFlag`](#featureflag) | one | `flagId` → `id` | — |

**Referenced by:** [`Company`](#company).`featureFlags` · [`FeatureFlag`](#featureflag).`companies`

**Indexes**

- unique `[companyId, flagId]`
- index `[flagId]`

### CompanyModule

Per-company module enablement + module-specific settings. Replaces ad-hoc module toggles scattered in systemsetting.

_Table `company_module` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `moduleKey` | `String` | @db.VarChar(50) | — |
| `isEnabled` | `Boolean` | @default(false) | — |
| `settings` | `String?` | @db.LongText | — |
| `activatedAt` | `DateTime?` | — | Set when isEnabled transitions to true; cleared on disable. |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `module` | [`Module`](#module) | one | `moduleKey` → `key` | Cascade |
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`companyModuleSettings` · [`Module`](#module).`companyModules`

**Indexes**

- unique `[companyId, moduleKey]`
- index `[companyId]`
- index `[moduleKey]`

### CompanyRelease

_Table `company_release` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `releaseId` | `String` | — | — |
| `status` | `CompanyReleaseStatus` | @default(AVAILABLE) | — |
| `appliedAt` | `DateTime?` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | — |
| `release` | [`Release`](#release) | one | `releaseId` → `id` | — |

**Referenced by:** [`Company`](#company).`releases` · [`Release`](#release).`companies`

**Indexes**

- unique `[companyId, releaseId]`
- index `[releaseId]`

### CompanyTaxProfile

Per-tenant tax configuration profile. One row per company. Replaces ad-hoc systemsetting keys for tax config. All tax calculators, schedulers, and filing services read from this model.

_Table `company_tax_profile` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | @unique | — |
| `tin` | `String` | @db.VarChar(20) | — |
| `vatNumber` | `String?` | @db.VarChar(30) | — |
| `srmDeviceSerial` | `String?` | @db.VarChar(50) | — |
| `aabeFramework` | `String` | @default("EFRS_SMALL") @db.VarChar(20) | FULL_IFRS \| IFRS_FOR_SMES \| EFRS_SMALL \| EFRS_MICRO |
| `isPie` | `Boolean` | @default(false) | — |
| `annualTurnoverEtb` | `Decimal` | @default(0) | — |
| `sector` | `String` | @default("OTHER") @db.VarChar(50) | EthiopianSector enum value (stored as string) |
| `entityType` | `String` | @default("PLC") @db.VarChar(25) | SOLE_PROPRIETORSHIP \| PLC \| ONE_MEMBER_PLC \| SHARE_COMPANY |
| `vatTotBand` | `String` | @default("C") @db.VarChar(1) | A=VAT registered, B=TOT 500K-2M, C=<500K |
| `incomeTaxSchedule` | `String` | @default("C") @db.VarChar(1) | A>1M, B=500K-1M, C<500K annual turnover |
| `isVatRegistered` | `Boolean` | @default(false) | — |
| `isTotApplicable` | `Boolean` | @default(true) | — |
| `activeTaxes` | `String` | @db.LongText | JSON map: { vat: bool, tot: bool, bit: bool, pit: bool, ... } |
| `rateOverrides` | `String?` | @db.Text | JSON map: { VAT: 0.15, WHT_GOODS: 0.03, ... } — only when MoR grants special rate |
| `fiscalYearStartMonth` | `Int` | @default(7) | Filing calendar |
| `vatFilingDay` | `Int` | @default(30) | — |
| `pitFilingDay` | `Int` | @default(30) | — |
| `drrfFilingDay` | `Int` | @default(15) | — |
| `bitDeadlineMonth` | `Int` | @default(11) | — |
| `bitDeadlineDay` | `Int` | @default(7) | — |
| `enableDeferredTax` | `Boolean` | @default(false) | IAS 12 deferred tax settings |
| `deferredTaxRate` | `Decimal` | @default(0.3000) | — |
| `poolCat1` | `Decimal` | @default(0.2500) | Ethiopian pool depreciation rates — Proc. 979/2016 Art. 25 |
| `poolCat2` | `Decimal` | @default(0.2000) | — |
| `poolCat3` | `Decimal` | @default(0.1500) | — |
| `poolCat4` | `Decimal` | @default(0.1000) | — |
| `materialityThresholdEtb` | `Decimal` | @default(5000) | — |
| `roundingMethod` | `String` | @default("HALF_UP") @db.VarChar(10) | HALF_UP \| HALF_EVEN |
| `etaxAutoSubmit` | `Boolean` | @default(false) | Integration flags |
| `srmIntegrated` | `Boolean` | @default(false) | — |
| `cbeReconciliation` | `Boolean` | @default(false) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`taxProfile`

**Indexes**

- index `[vatTotBand, incomeTaxSchedule]`
- index `[sector]`

### ContractSnapshot

_Table `contract_snapshot` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `contractRef` | `String` | — | — |
| `version` | `Int` | @default(1) | — |
| `companyId` | `String` | — | — |
| `invoiceId` | `String?` | — | — |
| `transactionPrice` | `Decimal` | @db.Decimal(15, 2) | — |
| `snapshotJson` | `Json` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `obligations` | [`PerformanceObligation`](#performanceobligation) | many | _back-reference_ | — |
| `allocations` | [`RevenueAllocation`](#revenueallocation) | many | _back-reference_ | — |
| `scheduleRows` | [`RecognitionScheduleRow`](#recognitionschedulerow) | many | _back-reference_ | — |
| `ifrsGlJournals` | [`IfrsGlJournal`](#ifrsgljournal) | many | _back-reference_ | — |

**Referenced by:** [`IfrsGlJournal`](#ifrsgljournal).`snapshot` · [`PerformanceObligation`](#performanceobligation).`snapshot` · [`RecognitionScheduleRow`](#recognitionschedulerow).`snapshot` · [`RevenueAllocation`](#revenueallocation).`snapshot`

**Indexes**

- index `[contractRef, companyId]`
- index `[invoiceId]`

### CostCenter

_Table `cost_center` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `code` | `String` | @db.VarChar(50) | — |
| `name` | `String` | @db.VarChar(200) | — |
| `type` | `CostCenterType` | @default(COST) | — |
| `department` | `String?` | @db.VarChar(200) | — |
| `managerId` | `String?` | — | — |
| `budget` | `Decimal?` | @db.Decimal(18, 2) | — |
| `isActive` | `Boolean` | @default(true) | — |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `journalLines` | [`JournalLine`](#journalline) | many | _back-reference_ | — |

**Referenced by:** [`JournalLine`](#journalline).`costCenter`

**Indexes**

- unique `[companyId, code]`
- index `[companyId]`

### CreditHold

_Table `credithold` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `customerId` | `String` | — | — |
| `reason` | `String?` | @db.Text | — |
| `heldBy` | `String?` | @db.VarChar(100) | — |
| `heldAt` | `DateTime` | @default(now()) | — |
| `releasedAt` | `DateTime?` | — | — |
| `companyId` | `String?` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `customer` | [`Customer`](#customer) | one | `customerId` → `id` | — |

**Referenced by:** [`Company`](#company).`creditHold` · [`Customer`](#customer).`creditHold`

**Indexes**

- index `[companyId]`
- index `[customerId]`

### CrmActivity

_Table `crm_activity` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `type` | `String` | @default("CALL") @db.VarChar(30) | — |
| `title` | `String` | @db.VarChar(300) | — |
| `description` | `String?` | @db.Text | — |
| `status` | `String` | @default("PENDING") @db.VarChar(20) | — |
| `dueDate` | `DateTime?` | — | — |
| `completedAt` | `DateTime?` | — | — |
| `contactId` | `String?` | — | — |
| `contactName` | `String?` | @db.VarChar(300) | — |
| `dealId` | `String?` | — | — |
| `dealTitle` | `String?` | @db.VarChar(300) | — |
| `assignedTo` | `String?` | @db.VarChar(200) | — |
| `createdBy` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[status]`
- index `[type]`
- index `[dueDate]`

### CrmCompany

_Table `crm_company` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `name` | `String` | @db.VarChar(300) | — |
| `email` | `String?` | @db.VarChar(300) | — |
| `phone` | `String?` | @db.VarChar(50) | — |
| `address` | `String?` | @db.Text | — |
| `website` | `String?` | @db.VarChar(500) | — |
| `industry` | `String?` | @db.VarChar(100) | — |
| `size` | `String?` | @default("SMALL") @db.VarChar(20) | — |
| `tin` | `String?` | @db.VarChar(20) | — |
| `vatNumber` | `String?` | @db.VarChar(50) | — |
| `notes` | `String?` | @db.Text | — |
| `status` | `String` | @default("ACTIVE") @db.VarChar(20) | — |
| `contactCount` | `Int` | @default(0) | — |
| `dealCount` | `Int` | @default(0) | — |
| `totalRevenue` | `Decimal` | @default(0) | — |
| `createdBy` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[status]`

### CrmContact

_Table `crm_contact` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `name` | `String` | @db.VarChar(300) | — |
| `email` | `String?` | @db.VarChar(300) | — |
| `phone` | `String?` | @db.VarChar(50) | — |
| `address` | `String?` | @db.Text | — |
| `tin` | `String?` | @db.VarChar(20) | — |
| `vatNumber` | `String?` | @db.VarChar(50) | — |
| `website` | `String?` | @db.VarChar(500) | — |
| `paymentTerms` | `String?` | @default("NET30") @db.VarChar(20) | — |
| `notes` | `String?` | @db.Text | — |
| `creditLimit` | `Decimal?` | — | — |
| `riskLevel` | `String?` | @default("MEDIUM") @db.VarChar(20) | — |
| `status` | `String` | @default("ACTIVE") @db.VarChar(20) | — |
| `type` | `String` | @default("PERSON") @db.VarChar(20) | — |
| `jobTitle` | `String?` | @db.VarChar(200) | — |
| `companyName` | `String?` | @db.VarChar(300) | — |
| `assignedTo` | `String?` | @db.VarChar(200) | — |
| `preferredInteractionType` | `String?` | @default("EMAIL") @db.VarChar(20) | — |
| `outstandingBalance` | `Decimal?` | @default(0) | — |
| `totalInvoiced` | `Decimal?` | @default(0) | — |
| `creditScore` | `Int?` | — | — |
| `loyaltyTier` | `String?` | @db.VarChar(20) | — |
| `lastContactedAt` | `DateTime?` | — | — |
| `pipelineStage` | `String?` | @db.VarChar(50) | — |
| `tags` | `String?` | @db.Text | — |
| `createdBy` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[status]`
- index `[type]`

### CrmDeal

_Table `crmdeal` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `title` | `String` | @db.VarChar(300) | — |
| `customerName` | `String` | @db.VarChar(200) | — |
| `value` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `stage` | `String` | @default("LEAD") @db.VarChar(50) | — |
| `probability` | `Int` | @default(10) | — |
| `expectedCloseDate` | `DateTime?` | — | — |
| `assignedTo` | `String?` | @db.VarChar(200) | — |
| `notes` | `String?` | @db.Text | — |
| `companyId` | `String?` | — | — |
| `contactId` | `String?` | — | — |
| `crmCompanyId` | `String?` | — | — |
| `pipelineId` | `String?` | — | — |
| `tags` | `String?` | @db.Text | — |
| `createdBy` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[stage]`
- index `[pipelineId]`

### CrmPipeline

_Table `crm_pipeline` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `name` | `String` | @db.VarChar(200) | — |
| `description` | `String?` | @db.Text | — |
| `isDefault` | `Boolean` | @default(false) | — |
| `stagesJson` | `String` | @db.LongText | — |
| `dealCount` | `Int` | @default(0) | — |
| `totalValue` | `Decimal` | @default(0) | — |
| `createdBy` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`

### Currency

_Table `currency` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `code` | `String` | @unique @db.VarChar(3) // ETB, USD, etc. | — |
| `symbol` | `String?` | @db.VarChar(5) | — |
| `rate` | `Decimal` | @default(1.0) | — |
| `enabled` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

### currencyrate

_Table `currencyrate` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id | — |
| `fromCurrency` | `String` | — | — |
| `toCurrency` | `String` | — | — |
| `rate` | `Decimal` | — | — |
| `date` | `DateTime` | — | — |
| `source` | `String?` | — | — |

**Indexes**

- unique `[fromCurrency, toCurrency, date]`

### Customer

_Table `customer` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `email` | `String?` | @db.VarChar(200) | — |
| `phone` | `String?` | @db.VarChar(50) | — |
| `address` | `String?` | @db.VarChar(500) | — |
| `tin` | `String?` | @db.VarChar(50) | — |
| `companyId` | `String?` | — | — |
| `userId` | `String?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `paymentTerms` | `String?` | @db.VarChar(20) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |
| `creditScore` | `Int?` | — | — |
| `kycStatus` | `String?` | @db.VarChar(20) | — |
| `kycVerifiedAt` | `DateTime?` | — | — |
| `nationalId` | `String?` | @db.VarChar(50) | — |
| `businessType` | `String?` | @db.VarChar(50) | — |
| `currencyCode` | `String?` | @default("ETB") @db.VarChar(3) | — |
| `creditLimit` | `Decimal?` | @db.Decimal(18, 2) | — |
| `riskLevel` | `String?` | @default("MEDIUM") @db.VarChar(20) | — |
| `vatNumber` | `String?` | @db.VarChar(50) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `businessLoan` | [`BusinessLoan`](#businessloan) | many | _back-reference_ | — |
| `collectionCase` | [`CollectionCase`](#collectioncase) | many | _back-reference_ | — |
| `creditHold` | [`CreditHold`](#credithold) | many | _back-reference_ | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `customerInteraction` | [`CustomerInteraction`](#customerinteraction) | many | _back-reference_ | — |
| `customerLoyalty` | [`CustomerLoyalty`](#customerloyalty) | optional one | _back-reference_ | — |
| `investment` | [`Investment`](#investment) | many | _back-reference_ | — |
| `partnershipCustomer` | [`PartnershipCustomer`](#partnershipcustomer) | many | _back-reference_ | — |
| `pipelines` | [`Pipeline`](#pipeline) | many | _back-reference_ | — |
| `revenues` | [`Revenue`](#revenue) | many | _back-reference_ | — |
| `invoices` | [`Invoice`](#invoice) | many | _back-reference_ | — |

**Referenced by:** [`BusinessLoan`](#businessloan).`customer` · [`CollectionCase`](#collectioncase).`customer` · [`Company`](#company).`customer` · [`CreditHold`](#credithold).`customer` · [`CustomerInteraction`](#customerinteraction).`customer` · [`CustomerLoyalty`](#customerloyalty).`customer` · [`Investment`](#investment).`customer` · [`Invoice`](#invoice).`customer` · [`PartnershipCustomer`](#partnershipcustomer).`customer` · [`Pipeline`](#pipeline).`customer` · [`Revenue`](#revenue).`customer`

**Indexes**

- unique `[name, companyId]`
- index `[companyId]`
- index `[kycStatus]`

### CustomerInteraction

_Table `customerinteraction` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `customerId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `type` | `String` | @db.VarChar(50) | — |
| `summary` | `String` | @db.Text | — |
| `outcome` | `String?` | @db.VarChar(200) | — |
| `performedBy` | `String?` | @db.VarChar(100) | — |
| `interactedAt` | `DateTime` | @default(now()) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `customer` | [`Customer`](#customer) | one | `customerId` → `id` | Cascade |

**Referenced by:** [`Customer`](#customer).`customerInteraction`

**Indexes**

- index `[companyId]`
- index `[customerId]`

### CustomerLoyalty

_Table `customerloyalty` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `customerId` | `String` | @unique(map: "CustomerLoyalty_customerId_key") | — |
| `companyId` | `String?` | — | — |
| `currentTier` | `LoyaltyTier` | @default(BRONZE) | — |
| `tierConfigId` | `String?` | — | — |
| `totalPoints` | `BigInt` | @default(0) | — |
| `lifetimePoints` | `BigInt` | @default(0) | — |
| `balance` | `BigInt` | @default(0) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `customer` | [`Customer`](#customer) | one | `customerId` → `id` | Cascade |
| `loyaltyTierConfig` | [`LoyaltyTierConfig`](#loyaltytierconfig) | optional one | `tierConfigId` → `id` | — |
| `fraudLog` | [`FraudLog`](#fraudlog) | many | _back-reference_ | — |
| `loyaltyRedemption` | [`LoyaltyRedemption`](#loyaltyredemption) | many | _back-reference_ | — |
| `loyaltyTransaction` | [`LoyaltyTransaction`](#loyaltytransaction) | many | _back-reference_ | — |

**Referenced by:** [`Customer`](#customer).`customerLoyalty` · [`FraudLog`](#fraudlog).`customerLoyalty` · [`LoyaltyRedemption`](#loyaltyredemption).`customerLoyalty` · [`LoyaltyTierConfig`](#loyaltytierconfig).`customerLoyalty` · [`LoyaltyTransaction`](#loyaltytransaction).`customerLoyalty`

**Indexes**

- index `[companyId]`
- index `[currentTier]`
- index `[customerId]`
- index `[tierConfigId]`

### CustomField

_Table `custom_field` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `feature` | `String` | @db.VarChar(50) | — |
| `label` | `String` | @db.VarChar(200) | — |
| `type` | `CustomFieldType` | @default(TEXT) | — |
| `options` | `String?` | @db.LongText | — |
| `isRequired` | `Boolean` | @default(false) | — |
| `sortOrder` | `Int` | @default(0) | — |
| `isActive` | `Boolean` | @default(true) | — |
| `placeholder` | `String?` | @db.VarChar(200) | — |
| `hint` | `String?` | @db.VarChar(500) | — |
| `defaultValue` | `String?` | @db.LongText | — |
| `width` | `String?` | @db.VarChar(20) @default("full") | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | Cascade |
| `values` | [`CustomFieldValue`](#customfieldvalue) | many | _back-reference_ | — |

**Referenced by:** [`Company`](#company).`customFields` · [`CustomFieldValue`](#customfieldvalue).`customField`

**Indexes**

- index `[companyId, feature]`

### CustomFieldValue

_Table `custom_field_value` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `customFieldId` | `String` | — | — |
| `entityId` | `String` | @db.VarChar(36) | — |
| `value` | `String?` | @db.LongText | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `customField` | [`CustomField`](#customfield) | one | `customFieldId` → `id` | Cascade |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`customFieldValues` · [`CustomField`](#customfield).`values`

**Indexes**

- unique `[customFieldId, entityId]`
- index `[entityId]`
- index `[companyId]`

### CustomsDeclaration

_Table `customs_declaration` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `sadNumber` | `String?` | @db.VarChar(50) | Assigned by ASYCUDA World on submission |
| `declarationType` | `String` | @default("IMPORT") @db.VarChar(20) | IMPORT \| EXPORT \| TRANSIT \| WAREHOUSE |
| `eSadReference` | `String?` | @db.VarChar(100) | e-SAD submission reference from Customs Trade Portal |
| `shipmentId` | `String?` | @db.VarChar(36) | Related trade shipment ID |
| `importerExporterName` | `String` | @db.VarChar(255) | — |
| `importerTin` | `String?` | @db.VarChar(20) | — |
| `originCountry` | `String?` | @db.VarChar(3) | Country of origin (ISO 3166-1 alpha-2) |
| `destinationCountry` | `String?` | @db.VarChar(3) | — |
| `portOfEntry` | `String?` | @db.VarChar(100) | — |
| `declarationDate` | `DateTime` | @default(now()) | — |
| `hsCode` | `String?` | @db.VarChar(10) | HS commodity code (6 or 8 digit WCO standard) |
| `hsDescription` | `String?` | @db.VarChar(500) | — |
| `goodsDescription` | `String?` | @db.VarChar(500) | — |
| `quantity` | `Decimal` | @default(0) @db.Decimal(18, 4) | Quantity and unit |
| `unit` | `String?` | @db.VarChar(30) | — |
| `cifValueUsd` | `Decimal` | @default(0) @db.Decimal(18, 2) | CIF value (Cost, Insurance, Freight) — base for all customs calculations |
| `cifValueEtb` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `exchangeRate` | `Decimal` | @default(1) @db.Decimal(10, 4) | — |
| `customsDutyRate` | `Decimal` | @default(0) @db.Decimal(8, 6) | Customs duty (0–35% of CIF) |
| `customsDutyAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `exciseDutyAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | Excise duty (5–500% depending on goods — Proc. 1186/2020) |
| `surtaxAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | Import surtax (10% of CIF + customs + excise, exempt for capital goods) |
| `vatOnImportAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | VAT on imports (15% of CIF + customs + excise + surtax) |
| `totalTaxBurden` | `Decimal` | @default(0) @db.Decimal(18, 2) | Total tax burden on import |
| `advanceBitAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | Advance BIT payment (3% of CIF — Schedule C importers) |
| `comesaPreferential` | `Boolean` | @default(false) | COMESA preferential rate applied? (10% lower than standard rate) |
| `isCapitalGoods` | `Boolean` | @default(false) | Capital goods (exempt from surtax) |
| `paymentReference` | `String?` | @db.VarChar(200) | Payment reference after customs duties paid |
| `status` | `String` | @default("DRAFT") @db.VarChar(20) | DRAFT \| SUBMITTED \| ASSESSED \| PAID \| CLEARED \| REJECTED |
| `assessedAt` | `DateTime?` | — | — |
| `paidAt` | `DateTime?` | — | — |
| `clearedAt` | `DateTime?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[declarationType]`
- index `[status]`
- index `[hsCode]`

### DebitNote

Standalone Debit Note model — used by /ovds/debit-notes CRUD UI. Agency placement refunds (Workflow A guarantee failure) are created here in addition to the negative-bill approach in MissingFeaturesService.

_Table `debitnote` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `debitNoteNumber` | `String` | @unique(map: "DebitNote_debitNoteNumber_key") @db.VarChar(100) | — |
| `billId` | `String?` | @db.VarChar(36) | FK to the original Bill this debit note is raised against |
| `billNumber` | `String?` | @db.VarChar(100) | — |
| `vendorId` | `String?` | @db.VarChar(36) | — |
| `vendorName` | `String?` | @db.VarChar(200) | — |
| `debitDate` | `DateTime` | @default(now()) | — |
| `reason` | `String?` | @db.VarChar(500) | — |
| `subtotal` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `taxAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `total` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `notes` | `String?` | @db.Text | — |
| `status` | `String` | @default("DRAFT") | DRAFT \| ISSUED \| APPLIED \| VOIDED |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`debitNote`

**Indexes**

- index `[companyId]`
- index `[billId]`
- index `[vendorId]`
- index `[status]`

### Deduction

_Table `deduction` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `employeeId` | `String?` | — | — |
| `invoiceId` | `String?` | — | — |
| `type` | `String` | @default("OTHER") | — |
| `reason` | `DeductionReason?` | — | — |
| `amount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `status` | `DeductionStatus` | @default(PENDING) | — |
| `year` | `Int` | @default(0) | — |
| `month` | `Int` | @default(0) | — |
| `notes` | `String?` | @db.VarChar(500) | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `employee` | [`Employee`](#employee) | optional one | `employeeId` → `id` | — |
| `invoice` | [`Invoice`](#invoice) | optional one | `invoiceId` → `id` | — |

**Referenced by:** [`Company`](#company).`deduction` · [`Employee`](#employee).`deduction` · [`Invoice`](#invoice).`deduction`

**Indexes**

- index `[companyId]`
- index `[employeeId]`
- index `[invoiceId]`

### DeliveryPerformance

DIFOT delivery performance — one row per sales order

_Table `delivery_performance` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `SalesOrderId` | `String` | — | — |
| `DispatchDocketId` | `String?` | — | — |
| `PromisedDeliveryDate` | `DateTime?` | — | — |
| `ActualDeliveryDate` | `DateTime?` | — | — |
| `IsDeliveredInFull` | `Boolean` | @default(false) | — |
| `IsDeliveredOnTime` | `Boolean` | @default(false) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `SalesOrder` | [`SalesOrder`](#salesorder) | one | `SalesOrderId` → `id` | Cascade |
| `DispatchDocket` | [`DispatchDocket`](#dispatchdocket) | optional one | `DispatchDocketId` → `id` | — |

**Referenced by:** [`DispatchDocket`](#dispatchdocket).`DeliveryPerformance` · [`SalesOrder`](#salesorder).`DeliveryPerformance`

**Indexes**

- index `[SalesOrderId]`
- index `[companyId]`

### Department

_Table `department` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `code` | `String?` | @db.VarChar(50) | — |
| `parentId` | `String?` | — | — |
| `description` | `String?` | @db.Text | — |
| `isActive` | `Boolean` | @default(true) | — |
| `companyId` | `String?` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `employee` | [`Employee`](#employee) | many | _back-reference_ | — |
| `shift` | [`Shift`](#shift) | many | _back-reference_ | — |

**Referenced by:** [`Company`](#company).`department` · [`Employee`](#employee).`department` · [`Shift`](#shift).`department`

**Indexes**

- unique `[name, companyId]`
- index `[companyId]`

### DepreciationSchedule

_Table `depreciation_schedule` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `assetId` | `String` | @db.VarChar(36) | — |
| `companyId` | `String?` | — | — |
| `period` | `String` | @db.VarChar(7) // YYYY-MM | — |
| `openingCarrying` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `depreciationAmt` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `closingCarrying` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `accumulatedDepr` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `method` | `String` | @default("STRAIGHT_LINE") @db.VarChar(30) | — |
| `journalEntryId` | `String?` | @db.VarChar(36) | — |
| `status` | `String` | @default("SCHEDULED") @db.VarChar(20) | SCHEDULED \| POSTED \| SKIPPED |
| `notes` | `String?` | @db.VarChar(300) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Indexes**

- unique `[assetId, period]`
- index `[companyId]`
- index `[assetId]`
- index `[period]`
- index `[status]`

### DeviceControlChangeRequest

Maker-checker change request for an org-wide device control policy.

_Table `device_control_change_request` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `category` | `DeviceControlCategory` | — | — |
| `settings` | `String` | @db.LongText | Proposed settings (JSON string) enforced on approval. |
| `reason` | `String?` | @db.Text | Human-readable business justification (required for audit). |
| `status` | `DeviceControlChangeStatus` | @default(DRAFT) | — |
| `makerId` | `String?` | — | Maker (submitter). Cannot be the checker (segregation of duties). |
| `makerName` | `String?` | — | — |
| `submittedAt` | `DateTime?` | — | — |
| `checkerId` | `String?` | — | Checker (approver/rejecter). |
| `checkerName` | `String?` | — | — |
| `reviewedAt` | `DateTime?` | — | — |
| `reviewNote` | `String?` | @db.Text | — |
| `resultingPolicyId` | `String?` | — | Set when approved+applied: id of the resulting DeviceControlPolicy. |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Indexes**

- index `[companyId, status]`
- index `[companyId, category]`

### DeviceControlPolicy

─── Device Control Governance (org-wide maker-checker) ───────────────────── Enforced org-wide device control policy per company + category. A company has at most one enforced policy per category; it is replaced (and broadcast to every device) only after a maker-checker change request is approved.

_Table `device_control_policy` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `category` | `DeviceControlCategory` | — | — |
| `version` | `Int` | @default(1) | Monotonic version per company+category, incremented on each enforced change. |
| `settings` | `String` | @db.LongText | Enforced settings (JSON string). Shape depends on category — see @ovds/shared. |
| `changeRequestId` | `String?` | — | Change request that produced this enforced version. |
| `enforcedAt` | `DateTime` | @default(now()) | — |
| `enforcedById` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Indexes**

- unique `[companyId, category]`
- index `[companyId]`

### DisasterFundAuditLog

_Table `disasterfundauditlog` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `contributionId` | `String` | — | — |
| `action` | `String` | @db.VarChar(60) | — |
| `fromStatus` | `String?` | @db.VarChar(20) | — |
| `toStatus` | `String?` | @db.VarChar(20) | — |
| `performedBy` | `String?` | @db.VarChar(100) | — |
| `detail` | `String?` | @db.VarChar(500) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Indexes**

- index `[contributionId]`

### DisasterFundContribution

_Table `disasterfundcontribution` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `category` | `ContributionCategory` | — | — |
| `description` | `String?` | @db.VarChar(500) | — |
| `baseAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `levyAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `period` | `String` | @db.VarChar(20) | — |
| `status` | `ContributionStatus` | @default(PENDING) | — |
| `remittedAt` | `DateTime?` | — | — |
| `dueDate` | `DateTime?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`disasterFundContribution`

**Indexes**

- index `[category]`
- index `[period]`
- index `[status]`
- index `[companyId]`

### DisasterFundNote

_Table `disasterfundnote` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `contributionId` | `String` | — | — |
| `content` | `String` | @db.Text | — |
| `authorName` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Indexes**

- index `[contributionId]`

### DisasterFundRemittance

_Table `disasterfundremittance` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `contributionId` | `String` | — | — |
| `amount` | `Decimal` | — | — |
| `bankName` | `String?` | @db.VarChar(100) | — |
| `referenceNo` | `String?` | @db.VarChar(100) | — |
| `remittedAt` | `DateTime` | @default(now()) | — |
| `remittedBy` | `String?` | @db.VarChar(100) | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Indexes**

- index `[contributionId]`

### DisasterFundReport

_Table `disasterfundreport` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `title` | `String` | @db.VarChar(200) | — |
| `period` | `String?` | @db.VarChar(20) | — |
| `year` | `Int?` | — | — |
| `status` | `String?` | @db.VarChar(20) | — |
| `totalLevy` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `totalRemitted` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `totalPending` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `totalOverdue` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `recordCount` | `Int` | @default(0) | — |
| `generatedBy` | `String?` | @db.VarChar(100) | — |
| `snapshotJson` | `String?` | @db.LongText | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Indexes**

- index `[year]`

### DisasterFundSchedule

_Table `disasterfundschedule` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `year` | `Int` | — | — |
| `quarter` | `Int` | — | — |
| `category` | `String` | @db.VarChar(60) | — |
| `dueDate` | `DateTime` | — | — |
| `estimatedLevy` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `status` | `String` | @default("UPCOMING") | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- unique `[year, quarter, category]`
- index `[year, quarter]`

### DisasterFundTarget

_Table `disasterfundtarget` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `year` | `Int` | — | — |
| `category` | `String` | @db.VarChar(60) | — |
| `targetAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- unique `[year, category]`
- index `[year]`

### DispatchDocket

Dispatch Docket — one docket per shipment against a sales order

_Table `dispatch_docket` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `SalesOrderId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `DispatchNumber` | `String` | @db.VarChar(50) | — |
| `DispatchDate` | `DateTime` | @default(now()) | — |
| `DispatchFromWarehouseId` | `String?` | @db.VarChar(36) | — |
| `ShipToAddressId` | `String?` | @db.VarChar(36) | — |
| `notes` | `String?` | @db.Text | — |
| `CreatedBy` | `String?` | @db.VarChar(36) | — |
| `status` | `String` | @default("DRAFT") @db.VarChar(30) | DRAFT \| CONFIRMED \| POSTED \| DELIVERED \| CANCELLED |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `SalesOrder` | [`SalesOrder`](#salesorder) | one | `SalesOrderId` → `id` | Cascade |
| `DispatchLines` | [`DispatchDocketLine`](#dispatchdocketline) | many | _back-reference_ | — |
| `DeliveryPerformance` | [`DeliveryPerformance`](#deliveryperformance) | many | _back-reference_ | — |
| `StockDemand` | [`StockDemandByOrder`](#stockdemandbyorder) | many | _back-reference_ | — |
| `invoices` | [`Invoice`](#invoice) | many | _back-reference_ | — |

**Referenced by:** [`DeliveryPerformance`](#deliveryperformance).`DispatchDocket` · [`DispatchDocketLine`](#dispatchdocketline).`DispatchDocket` · [`Invoice`](#invoice).`dispatchDocket` · [`SalesOrder`](#salesorder).`dispatches` · [`StockDemandByOrder`](#stockdemandbyorder).`DispatchDocket`

**Indexes**

- index `[SalesOrderId]`
- index `[companyId]`
- index `[status]`
- index `[DispatchNumber]`

### DispatchDocketLine

Dispatch Docket line items — what was actually shipped

_Table `dispatch_docket_line` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `DispatchDocketId` | `String` | — | — |
| `SalesOrderLineId` | `String?` | — | — |
| `LineNo` | `Int` | — | — |
| `ItemId` | `String?` | @db.VarChar(36) | — |
| `description` | `String?` | @db.VarChar(500) | — |
| `DispatchedQty` | `Decimal` | @default(0) @db.Decimal(18, 4) | — |
| `OrderedQtyAtDispatch` | `Decimal?` | @db.Decimal(18, 4) | — |
| `VarianceQty` | `Decimal` | @default(0) @db.Decimal(18, 4) | — |
| `VarianceReason` | `String?` | @db.VarChar(200) | — |
| `UnitWeight` | `Decimal?` | @db.Decimal(18, 4) | — |
| `UnitCubic` | `Decimal?` | @db.Decimal(18, 4) | — |
| `companyId` | `String?` | @db.VarChar(36) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `DispatchDocket` | [`DispatchDocket`](#dispatchdocket) | one | `DispatchDocketId` → `id` | Cascade |
| `SalesOrderLine` | [`SalesOrderLine`](#salesorderline) | optional one | `SalesOrderLineId` → `id` | — |

**Referenced by:** [`DispatchDocket`](#dispatchdocket).`DispatchLines` · [`SalesOrderLine`](#salesorderline).`dispatchLines`

**Indexes**

- index `[DispatchDocketId]`
- index `[SalesOrderLineId]`
- index `[ItemId]`

### DocArticle

─── Documentation Portal ──────────────────────────────────────────────────── Stores categorized knowledge-base articles for the public /docs portal. Populated by the categorization seed script (scripts/seed-docs.mjs). All fields are read-only from public-facing endpoints — no user data stored here.

_Table `doc_article` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `slug` | `String` | @unique @db.VarChar(200) | Slug used in URL: /docs/<slug> |
| `title` | `String` | @db.VarChar(300) | — |
| `category` | `String` | @db.VarChar(50) | One of: feature \| tutorial \| faq \| api_reference |
| `subcategory` | `String?` | @db.VarChar(100) | Sub-group within a category (e.g. "HR & Payroll", "VAT") |
| `summary` | `String?` | @db.Text | Short summary shown in search results / cards |
| `content` | `String` | @db.LongText | Full article body in Markdown |
| `tags` | `String?` | @db.Text | Tags for search/filtering (JSON array of strings) |
| `sortOrder` | `Int` | @default(0) | Optional display order within the category |
| `isPublished` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Indexes**

- index `[category]`
- index `[subcategory]`
- index `[isPublished]`

### DualNodeVerification

_Table `dual_node_verification` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `journalEntryId` | `String` | — | — |
| `reference` | `String?` | @db.VarChar(200) | — |
| `status` | `String` | @default("VERIFIED") @db.VarChar(50) | — |
| `expectedBalance` | `Decimal` | — | — |
| `actualBalance` | `Decimal` | — | — |
| `deviation` | `Decimal` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`dualNodeVerifications`

**Indexes**

- index `[companyId]`
- index `[journalEntryId]`

### EclProvision

_Table `ecl_provision` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `invoiceId` | `String?` | — | — |
| `amount` | `Decimal` | @db.Decimal(18, 2) | — |
| `period` | `String` | @db.VarChar(7) // YYYY-MM | — |
| `method` | `String` | // SIMPLE \| AGING \| MACRO \| SCORE_CARD | — |
| `stage` | `String` | @default("STAGE_1") // STAGE_1 \| STAGE_2 \| STAGE_3 | — |
| `currencyCode` | `String` | @default("ETB") @db.VarChar(3) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`eclProvisions`

**Indexes**

- index `[companyId, period]`
- index `[companyId, stage]`

### EimsBulkJob

Async bulk registration/cancellation job tracker

_Table `eims_bulk_job` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `jobType` | `String` | @db.VarChar(20) | BULK_REGISTER \| BULK_CANCEL |
| `conversationId` | `String?` | @db.VarChar(100) | — |
| `status` | `String` | @default("PENDING") @db.VarChar(20) | PENDING \| COMPLETED \| FAILED |
| `invoiceIds` | `String?` | @db.LongText | — |
| `requestCount` | `Int` | @default(0) | — |
| `successCount` | `Int` | @default(0) | — |
| `failureCount` | `Int` | @default(0) | — |
| `responsePayload` | `String?` | @db.LongText | — |
| `submissionMode` | `String` | @default("stub") @db.VarChar(10) | — |
| `completedAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[conversationId]`
- index `[status]`

### EimsCertificate

INSA-issued digital certificate for EIMS request signing

_Table `eims_certificate` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `sourceSystemId` | `String?` | — | — |
| `status` | `String` | @default("PENDING_CSR") @db.VarChar(20) | PENDING_CSR \| CSR_SUBMITTED \| ISSUED \| EXPIRING \| EXPIRED \| REVOKED |
| `privateKeyEnc` | `String?` | @db.LongText | PEM-encoded private key (AES-256-GCM encrypted) |
| `certificatePem` | `String?` | @db.LongText | PEM-encoded certificate from INSA |
| `certificateB64` | `String?` | @db.LongText | Base64-encoded certificate for EIMS API (cached) |
| `csrPem` | `String?` | @db.LongText | CSR PEM submitted to INSA (ica@insa.gov.et) |
| `subjectTin` | `String?` | @db.VarChar(20) | Certificate subject CN (TIN) |
| `serialNumber` | `String?` | @db.VarChar(50) | Certificate serial number (System Number) |
| `issuedAt` | `DateTime?` | — | — |
| `expiresAt` | `DateTime?` | — | — |
| `submittedAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `sourceSystem` | [`EimsSourceSystem`](#eimssourcesystem) | optional one | `sourceSystemId` → `id` | — |

**Referenced by:** [`EimsSourceSystem`](#eimssourcesystem).`certificates`

**Indexes**

- index `[companyId]`
- index `[sourceSystemId]`
- index `[status]`
- index `[expiresAt]`

### EimsReceipt

EIMS receipt registration (sales + withholding — EIMS Section 6)

_Table `eims_receipt` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `invoiceId` | `String?` | @db.VarChar(36) | — |
| `receiptNumber` | `String` | @db.VarChar(50) | — |
| `receiptType` | `String` | @db.VarChar(20) | SALES \| WITHHOLDING |
| `manualReceiptNumber` | `String?` | @db.VarChar(50) | — |
| `receiptIrn` | `String?` | @db.VarChar(64) | — |
| `collectedAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `status` | `String` | @default("PENDING") @db.VarChar(20) | PENDING \| REGISTERED \| FAILED |
| `requestPayload` | `String?` | @db.LongText | — |
| `responsePayload` | `String?` | @db.LongText | — |
| `submissionMode` | `String` | @default("stub") @db.VarChar(10) | — |
| `registeredAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[invoiceId]`
- index `[receiptNumber]`
- index `[status]`

### EimsRegistration

EIMS invoice registration record (IRN, signed QR, MoR acknowledgement)

_Table `eims_registration` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `sourceSystemId` | `String?` | — | — |
| `invoiceId` | `String?` | @db.VarChar(36) | — |
| `irn` | `String?` | @db.VarChar(64) | MoR Invoice Reference Number (64-char hash) |
| `documentNumber` | `String?` | @db.VarChar(50) | — |
| `status` | `String` | @default("PENDING") @db.VarChar(20) | NOT_REGISTERED \| PENDING \| REGISTERED \| FAILED \| CANCELLED |
| `reason` | `String?` | @db.VarChar(500) | — |
| `signedQr` | `String?` | @db.LongText | Base64 signed QR from EIMS |
| `signedInvoice` | `String?` | @db.LongText | MoR-signed invoice digest |
| `invoiceSignature` | `String?` | @db.LongText | — |
| `ackDate` | `DateTime?` | — | — |
| `previousIrn` | `String?` | @db.VarChar(64) | Previous IRN in chain |
| `requestPayload` | `String?` | @db.LongText | Full request payload sent (audit) |
| `responsePayload` | `String?` | @db.LongText | Full response from EIMS (audit) |
| `errorMessage` | `String?` | @db.VarChar(1000) | — |
| `attemptCount` | `Int` | @default(0) | — |
| `submissionMode` | `String` | @default("stub") @db.VarChar(10) | live \| sandbox \| stub |
| `registeredAt` | `DateTime?` | — | — |
| `cancelledAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `sourceSystem` | [`EimsSourceSystem`](#eimssourcesystem) | optional one | `sourceSystemId` → `id` | — |

**Referenced by:** [`EimsSourceSystem`](#eimssourcesystem).`registrations`

**Indexes**

- unique `[companyId, invoiceId]`
- index `[companyId]`
- index `[invoiceId]`
- index `[irn]`
- index `[status]`
- index `[sourceSystemId]`

### EimsSourceSystem

Registered EIMS source system per company (MoR portal source registration)

_Table `eims_source_system` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `systemNumber` | `String` | @db.VarChar(50) | MoR-assigned system number (e.g. "0A774FBBBE") |
| `systemType` | `String` | @default("ERP") @db.VarChar(20) | ERP \| POS \| MANUAL |
| `enterpriseId` | `String?` | @db.VarChar(100) | Enterprise name from MoR portal |
| `establishmentId` | `String?` | @db.VarChar(100) | Establishment name from MoR portal |
| `registrationStep` | `String?` | @default("ENTERPRISE_SELECTED") @db.VarChar(30) | Source registration progress step per Self-onboarding Guide |
| `status` | `String` | @default("PENDING") @db.VarChar(20) | PENDING \| APPROVED \| REJECTED \| SUSPENDED |
| `clientId` | `String?` | @db.VarChar(200) | EIMS portal API credentials (encrypted) |
| `clientSecret` | `String?` | @db.VarChar(500) | — |
| `apiKey` | `String?` | @db.VarChar(200) | — |
| `callbackUrl` | `String?` | @db.VarChar(500) | Callback URL for bulk registration/cancellation async responses |
| `lastAuthAt` | `DateTime?` | — | Last successful EIMS authentication timestamp |
| `invoiceCounter` | `Int` | @default(0) | Current invoice counter for SourceSystem.InvoiceCounter |
| `lastIrn` | `String?` | @db.VarChar(64) | Last registered IRN (for PreviousIrn chain) |
| `registeredAt` | `DateTime` | @default(now()) | — |
| `approvedAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |
| `certificates` | [`EimsCertificate`](#eimscertificate) | many | _back-reference_ | — |
| `registrations` | [`EimsRegistration`](#eimsregistration) | many | _back-reference_ | — |

**Referenced by:** [`Company`](#company).`eimsSourceSystems` · [`EimsCertificate`](#eimscertificate).`sourceSystem` · [`EimsRegistration`](#eimsregistration).`sourceSystem`

**Indexes**

- unique `[companyId, systemNumber]`
- index `[companyId]`
- index `[status]`

### EliminationEntry

_Table `elimination_entry` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `entityGroupId` | `String?` | — | — |
| `accountCode` | `String` | @db.VarChar(20) | — |
| `debit` | `Decimal` | @db.Decimal(18, 2) | — |
| `credit` | `Decimal` | @db.Decimal(18, 2) | — |
| `description` | `String?` | @db.Text | — |
| `period` | `String` | @db.VarChar(7) // YYYY-MM | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`eliminationEntries`

**Indexes**

- index `[companyId, period]`
- index `[entityGroupId]`

### Employee

_Table `employee` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `firstName` | `String` | — | — |
| `lastName` | `String` | — | — |
| `email` | `String` | @unique(map: "Employee_email_key") | — |
| `employeeId` | `String` | @unique(map: "Employee_employeeId_key") | — |
| `departmentId` | `String?` | — | — |
| `shiftId` | `String?` | — | — |
| `baseSalary` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `hourlyRate` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `monthlyDeductions` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |
| `leaveEntitlement` | `Int` | @default(22) | — |
| `employmentNature` | `String` | @default("Permanent") | — |
| `cadre` | `String` | @default("Non-Teaching") | — |
| `designation` | `String?` | — | — |
| `dateOfNextIncrement` | `DateTime?` | — | — |
| `employeeContribution` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `employerContribution` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `employerPensionRate` | `Decimal` | @default(11.000000000000000000000000000000) | — |
| `incomeTaxRate` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `loanBalance` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `loanMonthlyDeduction` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `pensionRate` | `Decimal` | @default(7.000000000000000000000000000000) | — |
| `pensionExempt` | `Boolean` | @default(false) | Marks the employee as a non-local / expatriate worker who is NOT enrolled in the Ethiopian private pension scheme (Proc. 1268/2023). When true, no employee (7%) or employer (11%) pension contribution is deducted and the full gross salary is taxed as employment income. |
| `accountNumber` | `String?` | — | — |
| `bankName` | `String?` | — | — |
| `dateOfSuperannuation` | `DateTime?` | — | — |
| `ifscCode` | `String?` | — | — |
| `payrollStatus` | `String` | @default("NOT_CONFIGURED") | — |
| `pfAccountNumber` | `String?` | — | — |
| `pfEmployeeRate` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `pfEmployerRate` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `pfSubscriptionType` | `String?` | — | — |
| `pfmsNumber` | `String?` | — | — |
| `businessType` | `EmployeeBusinessType?` | — | — |
| `companyId` | `String?` | — | — |
| `lastTransferDate` | `DateTime?` | — | — |
| `subsidiary` | `String?` | — | — |
| `transferReason` | `String?` | — | — |
| `phone` | `String?` | @db.VarChar(50) | — |
| `userId` | `String?` | @unique | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `arrearConfig` | [`ArrearConfig`](#arrearconfig) | many | _back-reference_ | — |
| `attendance` | [`Attendance`](#attendance) | many | _back-reference_ | — |
| `biometricData` | [`BiometricData`](#biometricdata) | many | _back-reference_ | — |
| `deduction` | [`Deduction`](#deduction) | many | _back-reference_ | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `department` | [`Department`](#department) | optional one | `departmentId` → `id` | — |
| `shift` | [`Shift`](#shift) | optional one | `shiftId` → `id` | — |
| `leave` | [`Leave`](#leave) | many | _back-reference_ | — |
| `loanRequest` | [`LoanRequest`](#loanrequest) | many | _back-reference_ | — |
| `notification` | [`Notification`](#notification) | many | _back-reference_ | — |
| `otherPayment` | [`OtherPayment`](#otherpayment) | many | _back-reference_ | — |
| `payrollRecord` | [`PayrollRecord`](#payrollrecord) | many | _back-reference_ | — |
| `reimbursementClaim` | [`ReimbursementClaim`](#reimbursementclaim) | many | _back-reference_ | — |
| `user` | [`User`](#user) | optional one | _back-reference_ | — |
| `gratuityRecords` | [`GratuityRecord`](#gratuityrecord) | many | _back-reference_ | — |
| `graduateTaxRecords` | [`GraduateTaxEmployee`](#graduatetaxemployee) | many | _back-reference_ | — |

**Referenced by:** [`ArrearConfig`](#arrearconfig).`employee` · [`Attendance`](#attendance).`employee` · [`BiometricData`](#biometricdata).`employee` · [`Company`](#company).`employee` · [`Deduction`](#deduction).`employee` · [`Department`](#department).`employee` · [`GraduateTaxEmployee`](#graduatetaxemployee).`employee` · [`GratuityRecord`](#gratuityrecord).`employee` · [`Leave`](#leave).`employee` · [`LoanRequest`](#loanrequest).`employee` · [`Notification`](#notification).`employee` · [`OtherPayment`](#otherpayment).`employee` · [`PayrollRecord`](#payrollrecord).`employee` · [`ReimbursementClaim`](#reimbursementclaim).`employee` · [`Shift`](#shift).`employee` · [`User`](#user).`employee`

**Indexes**

- index `[companyId]`
- index `[departmentId]`
- index `[shiftId]`
- index `[companyId, payrollStatus]`

### EmployeeBenefitObligation

_Table `employeebenefitobligation` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `employeeId` | `String` | @db.VarChar(36) | — |
| `companyId` | `String?` | @db.VarChar(36) | — |
| `type` | `String` | @default("GRATUITY") @db.VarChar(30) | GRATUITY \| END_OF_SERVICE \| ANNUAL_LEAVE \| PENSION_TOP_UP |
| `yearsService` | `Decimal` | @default(0) @db.Decimal(6, 2) | Years of continuous service at valuation date |
| `monthlySalary` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `obligationAmt` | `Decimal` | @default(0) @db.Decimal(18, 2) | Obligation per Ethiopian Labour Proclamation 1156/2019 |
| `fundedAmt` | `Decimal` | @default(0) @db.Decimal(18, 2) | Amount funded / set aside |
| `deficitAmt` | `Decimal` | @default(0) @db.Decimal(18, 2) | obligationAmt − fundedAmt (unfunded = balance sheet liability) |
| `actuarialRate` | `Decimal` | @default(10) @db.Decimal(5, 2) | Discount rate for present value (IAS 19.83) — Ethiopian govt bond yield |
| `valuationDate` | `DateTime` | @default(now()) | — |
| `journalEntryId` | `String?` | @db.VarChar(36) | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[employeeId]`
- index `[companyId]`

### Entity

_Table `entity` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `name` | `String` | @db.VarChar(200) | — |
| `code` | `String` | @db.VarChar(50) | — |
| `parentId` | `String?` | — | — |
| `isActive` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`entities`

**Indexes**

- unique `[companyId, code]`
- index `[companyId]`

### EntityGroup

_Table `entity_group` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `parentId` | `String?` | — | — |
| `reportCurrency` | `String` | @default("ETB") @db.VarChar(3) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `parent` | [`EntityGroup`](#entitygroup) | optional one | `parentId` → `id` | — |
| `children` | [`EntityGroup`](#entitygroup) | many | _back-reference_ | — |
| `companies` | [`Company`](#company) | many | _back-reference_ | — |

**Referenced by:** [`Company`](#company).`entityGroups` · [`EntityGroup`](#entitygroup).`parent` · [`EntityGroup`](#entitygroup).`children`

### ETaxSubmissionRecord

e-Tax Online Submission — tracks VAT declaration submissions to ERCA portal Extends VatFiling with e-service submission metadata

_Table `etax_submission_record` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `vatFilingId` | `String?` | @db.VarChar(36) | — |
| `submissionType` | `String` | @default("VAT_RETURN") @db.VarChar(30) | VAT_RETURN \| TOT_RETURN \| PAYE \| WHT \| BIT_PROVISIONAL |
| `period` | `String` | @db.VarChar(7) | — |
| `payloadJson` | `String?` | @db.LongText | Payload sent to ERCA e-Tax portal (JSON) |
| `responseJson` | `String?` | @db.LongText | Raw response from ERCA portal |
| `ercaReferenceNo` | `String?` | @db.VarChar(100) | ERCA-issued reference number on acceptance |
| `ercaAckXml` | `String?` | @db.LongText | — |
| `totalPayable` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `status` | `String` | @default("DRAFT") @db.VarChar(20) | DRAFT \| PENDING \| SUBMITTED \| ACCEPTED \| REJECTED \| FAILED |
| `mode` | `String` | @default("stub") @db.VarChar(10) | live \| sandbox \| stub |
| `submittedAt` | `DateTime?` | — | — |
| `acceptedAt` | `DateTime?` | — | — |
| `rejectedAt` | `DateTime?` | — | — |
| `rejectionReason` | `String?` | @db.VarChar(1000) | — |
| `submittedBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[period]`
- index `[status]`
- index `[submissionType]`

### ExciseTaxFiling

_Table `excise_tax_filing` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `period` | `String` | @db.VarChar(7) | — |
| `totalExciseDue` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `totalPaid` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `penaltyAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `status` | `ExciseTaxStatus` | @default(PENDING) | — |
| `ercaReferenceNo` | `String?` | @db.VarChar(100) | — |
| `filedAt` | `DateTime?` | — | — |
| `dueDate` | `DateTime` | — | — |
| `recordCount` | `Int` | @default(0) | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Indexes**

- index `[companyId]`
- index `[period]`

### ExciseTaxRecord

Excise Tax — Proclamation No. 1186/2020

_Table `excise_tax_record` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `period` | `String` | @db.VarChar(7) // YYYY-MM | — |
| `goodsCategory` | `String` | @db.VarChar(50) | — |
| `goodsDescription` | `String` | @db.VarChar(500) | — |
| `origin` | `ExciseTaxOrigin` | @default(LOCAL) | — |
| `quantity` | `Decimal` | @default(0) @db.Decimal(18, 4) | — |
| `unit` | `String` | @default("units") @db.VarChar(20) | — |
| `baseValue` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `exciseRate` | `Decimal?` | @db.Decimal(8, 6) | — |
| `specificRate` | `Decimal?` | @db.Decimal(18, 4) | — |
| `exciseTaxDue` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `vatOnExcise` | `Decimal?` | @db.Decimal(18, 2) | — |
| `totalTaxDue` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `status` | `ExciseTaxStatus` | @default(DRAFT) | — |
| `customsDeclarationNo` | `String?` | @db.VarChar(100) | — |
| `filedAt` | `DateTime?` | — | — |
| `paidAt` | `DateTime?` | — | — |
| `paymentReference` | `String?` | @db.VarChar(200) | — |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Indexes**

- index `[companyId]`
- index `[period]`
- index `[status]`

### ExpenseClaim

_Table `expense_claim` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `title` | `String` | @db.VarChar(200) | — |
| `amount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `currencyCode` | `String` | @default("ETB") | — |
| `category` | `String` | @db.VarChar(100) | — |
| `status` | `String` | @default("PENDING") | — |
| `description` | `String?` | @db.Text | — |
| `receiptUrl` | `String?` | @db.VarChar(500) | — |
| `submittedBy` | `String?` | @db.VarChar(100) | — |
| `approvedBy` | `String?` | @db.VarChar(100) | — |
| `approvedAt` | `DateTime?` | — | — |
| `companyId` | `String?` | — | — |
| `submittedAt` | `DateTime` | @default(now()) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Indexes**

- index `[status]`
- index `[companyId]`

### FeatureEntitlement

_Table `feature_entitlement` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `featureKey` | `String` | @db.VarChar(100) | — |
| `enabled` | `Boolean` | @default(false) | — |
| `expiresAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`featureEntitlements`

**Indexes**

- unique `[companyId, featureKey]`
- index `[companyId]`

### FeatureFlag

_Table `feature_flag` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | @unique | — |
| `description` | `String?` | @db.Text | — |
| `isActive` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `companies` | [`CompanyFeatureFlag`](#companyfeatureflag) | many | _back-reference_ | — |

**Referenced by:** [`CompanyFeatureFlag`](#companyfeatureflag).`featureFlag`

### fileattachment

_Table `fileattachment` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id | — |
| `filename` | `String` | — | — |
| `mimeType` | `String` | — | — |
| `fileSize` | `Int` | — | — |
| `fileData` | `String?` | @db.LongText | — |
| `attachableId` | `String` | — | — |
| `attachableType` | `String` | — | — |
| `description` | `String?` | — | — |
| `uploadedBy` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Indexes**

- index `[attachableType, attachableId]`

### FinancialCycle

_Table `financialcycle` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | @unique(map: "FinancialCycle_name_key") | — |
| `startMonth` | `Int` | — | — |
| `startYear` | `Int` | — | — |
| `endMonth` | `Int` | — | — |
| `endYear` | `Int` | — | — |
| `numberOfIncrements` | `Int` | @default(1) | — |
| `incrementInterval` | `Int` | @default(12) | — |
| `incrementPercentage` | `Decimal` | @default(5.000000000000000000000000000000) | — |
| `isActive` | `Boolean` | @default(false) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

### FinancialStatementTemplate

_Table `financial_statement_template` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `type` | `String` | — | BALANCE_SHEET, INCOME_STATEMENT, CASH_FLOW, NOTES |
| `name` | `String` | — | — |
| `period` | `String?` | — | e.g., "2024-Q1", "FY2024" |
| `isIfrs` | `Boolean` | @default(true) | — |
| `templateJson` | `String` | @db.LongText | Line items, formulas, IFRS refs |
| `previewHtml` | `String?` | @db.LongText | — |
| `isActive` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`financialStatementTemplate`

**Indexes**

- unique `[companyId, type, period]`
- index `[companyId]`

### FinancialTracking

_Table `financial_tracking` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | @unique | — |
| `totalRevenue` | `Decimal` | @default(0) | — |
| `totalExpenses` | `Decimal` | @default(0) | — |
| `lastTransactionAt` | `DateTime?` | — | — |
| `lastTransactionRef` | `String?` | @db.VarChar(200) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`financialTrackings`

### FiscalYear

_Table `fiscalyear` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `year` | `Int` | — | — |
| `startDate` | `String` | @db.VarChar(10) | — |
| `endDate` | `String` | @db.VarChar(10) | — |
| `status` | `String` | @default("OPEN") @db.VarChar(20) | — |
| `isCurrent` | `Boolean` | @default(false) | — |
| `closedAt` | `DateTime?` | — | — |
| `closedBy` | `String?` | — | — |
| `closingEntryId` | `String?` | — | — |
| `openingEntryId` | `String?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `closingEntry` | [`JournalEntry`](#journalentry) | optional one | `closingEntryId` → `id` | — |
| `openingEntry` | [`JournalEntry`](#journalentry) | optional one | `openingEntryId` → `id` | — |

**Referenced by:** [`Company`](#company).`fiscalYears` · [`JournalEntry`](#journalentry).`fiscalYearClosings` · [`JournalEntry`](#journalentry).`fiscalYearOpenings`

**Indexes**

- unique `[companyId, year]`
- index `[companyId]`
- index `[companyId, status]`

### FixedAsset

_Table `fixed_asset` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | @db.VarChar(200) | — |
| `category` | `String` | @db.VarChar(100) | — |
| `purchaseDate` | `DateTime` | — | — |
| `purchaseCost` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `salvageValue` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `usefulLifeYears` | `Int` | @default(1) | — |
| `depreciationMethod` | `String` | @default("STRAIGHT_LINE") | — |
| `status` | `String` | @default("ACTIVE") | — |
| `location` | `String?` | @db.VarChar(200) | — |
| `serialNumber` | `String?` | @db.VarChar(100) | — |
| `companyId` | `String?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Indexes**

- index `[status]`
- index `[companyId]`

### FixedAssetDisposal

_Table `fixed_asset_disposal` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `assetId` | `String` | — | — |
| `disposalType` | `String` | // SALE \| SCRAP \| TRADE_IN \| DONATION | — |
| `disposalDate` | `DateTime` | — | — |
| `proceeds` | `Decimal` | @db.Decimal(18, 2) | — |
| `netBookValue` | `Decimal` | @db.Decimal(18, 2) | — |
| `gainLoss` | `Decimal` | @db.Decimal(18, 2) | — |
| `buyerId` | `String?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`fixedAssetDisposals`

**Indexes**

- index `[companyId, disposalDate]`
- index `[assetId]`

### ForeignTaxCredit

_Table `foreign_tax_credit` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `taxYear` | `Int` | — | Tax year in which the foreign income was derived |
| `foreignCountry` | `String` | @db.VarChar(100) | — |
| `foreignIncome` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `foreignTaxPaid` | `Decimal` | @default(0) @db.Decimal(18, 2) | Foreign income tax paid in the foreign country |
| `ethiopianTaxOnForeignIncome` | `Decimal` | @default(0) @db.Decimal(18, 2) | Ethiopian Schedule C BIT on this specific foreign income (30% rate applied) |
| `creditAllowed` | `Decimal` | @default(0) @db.Decimal(18, 2) | Credit allowed = min(foreignTaxPaid, ethiopianTaxOnForeignIncome) |
| `foreignTaxReceiptRef` | `String?` | @db.VarChar(200) | Receipt/certificate from foreign tax authority (required) |
| `receiptDate` | `DateTime?` | — | — |
| `creditDeadline` | `DateTime?` | — | Must pay within 2 years of year-end in which foreign income was derived |
| `applied` | `Boolean` | @default(false) | Whether credit was applied in the final BIT filing for the year |
| `appliedInFilingId` | `String?` | — | — |
| `status` | `String` | @default("PENDING") @db.VarChar(20) | PENDING \| APPLIED \| EXPIRED \| DISALLOWED |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[taxYear]`
- index `[status]`

### ForexApproval

Forex approval record (NBE / commercial bank)

_Table `forex_approval` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `shipmentId` | `String` | — | — |
| `bankName` | `String` | @db.VarChar(200) | — |
| `applicationDate` | `DateTime?` | — | — |
| `approvalDate` | `DateTime?` | — | — |
| `approvalRef` | `String?` | @db.VarChar(100) | — |
| `foreignCurrency` | `String` | @default("USD") @db.VarChar(3) | — |
| `foreignAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `etbEquivalent` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `exchangeRate` | `Decimal` | @default(0) @db.Decimal(10, 6) | — |
| `status` | `String` | @default("PENDING") @db.VarChar(20) | PENDING \| APPROVED \| REJECTED \| EXPIRED |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `shipment` | [`TradeShipment`](#tradeshipment) | one | `shipmentId` → `id` | Cascade |

**Referenced by:** [`TradeShipment`](#tradeshipment).`forexApprovals`

**Indexes**

- index `[shipmentId]`
- index `[status]`

### FraudLog

_Table `fraudlog` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `customerLoyaltyId` | `String` | — | — |
| `action` | `String` | @db.VarChar(100) | — |
| `fraudScore` | `Float` | — | — |
| `decision` | `FraudStatus` | — | — |
| `rulesTriggered` | `String?` | — | — |
| `aiModel` | `String?` | @db.VarChar(100) | — |
| `ipAddress` | `String?` | — | — |
| `userAgent` | `String?` | — | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `customerLoyalty` | [`CustomerLoyalty`](#customerloyalty) | one | `customerLoyaltyId` → `id` | — |

**Referenced by:** [`CustomerLoyalty`](#customerloyalty).`fraudLog`

**Indexes**

- index `[customerLoyaltyId]`
- index `[decision]`

### FundTransfer

_Table `fund_transfer` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `fromAccountId` | `String` | — | — |
| `toAccountId` | `String` | — | — |
| `amount` | `Decimal` | — | — |
| `currencyCode` | `String` | @default("ETB") @db.VarChar(3) | — |
| `type` | `String` | @default("INTERNAL") | INTERNAL \| ACH \| WIRE |
| `status` | `String` | @default("PENDING") | PENDING \| COMPLETED \| FAILED |
| `reference` | `String?` | @db.VarChar(200) | — |
| `note` | `String?` | @db.Text | — |
| `companyId` | `String?` | — | — |
| `journalEntryId` | `String?` | @db.VarChar(36) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `fromBankAcc` | [`BankAccount`](#bankaccount) | one | `fromAccountId` → `id` | — |
| `toBankAcc` | [`BankAccount`](#bankaccount) | one | `toAccountId` → `id` | — |
| `journalEntry` | [`JournalEntry`](#journalentry) | optional one | `journalEntryId` → `id` | — |

**Referenced by:** [`BankAccount`](#bankaccount).`transfersFrom` · [`BankAccount`](#bankaccount).`transfersTo` · [`Company`](#company).`fundTransfers` · [`JournalEntry`](#journalentry).`fundTransfers`

**Indexes**

- index `[status]`
- index `[companyId]`

### fxdifference

_Table `fxdifference` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id | — |
| `intercompanyTxId` | `String?` | — | — |
| `monetaryItemRef` | `String` | — | — |
| `fromCurrency` | `String` | @default("USD") | — |
| `toCurrency` | `String` | @default("ETB") | — |
| `amountBase` | `Decimal` | — | — |
| `fxRate` | `Decimal` | — | — |
| `amountReporting` | `Decimal` | — | — |
| `fxGainLoss` | `Decimal` | — | — |
| `ias21Treatment` | `String` | @default("P_AND_L") | — |
| `taxDeferred` | `Boolean` | @default(false) | — |
| `period` | `String` | — | — |
| `notes` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `interCompanyTransaction` | [`InterCompanyTransaction`](#intercompanytransaction) | many | _back-reference_ | — |

**Referenced by:** [`InterCompanyTransaction`](#intercompanytransaction).`Fxdifference`

**Indexes**

- index `[intercompanyTxId]`

### FxRate

_Table `fx_rate` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `currency` | `String` | @db.VarChar(3) | — |
| `rate` | `Decimal` | @db.Decimal(18, 6) | — |
| `rateType` | `String` | // SPOT \| PERIOD_END \| AVERAGE | — |
| `asOf` | `DateTime` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`fxRates`

**Indexes**

- unique `[companyId, currency, rateType, asOf]`
- index `[companyId, currency]`

### GeographicTaxRule

_Table `geographic_tax_rule` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `region` | `String` | @db.VarChar(200) | — |
| `taxType` | `String` | @db.VarChar(100) | — |
| `rate` | `Decimal` | — | — |
| `threshold` | `Decimal?` | — | — |
| `isActive` | `Boolean` | @default(true) | — |
| `effectiveFrom` | `DateTime?` | — | — |
| `effectiveTo` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`geographicTaxRules`

**Indexes**

- index `[companyId]`
- index `[region]`

### GoodsReceivedNote

_Table `goodsreceivednote` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `grnNumber` | `String` | @unique @db.VarChar(100) | — |
| `purchaseOrderId` | `String?` | @db.VarChar(36) | — |
| `billId` | `String?` | @db.VarChar(36) | — |
| `vendorId` | `String?` | @db.VarChar(36) | — |
| `vendorName` | `String?` | @db.VarChar(200) | — |
| `status` | `String` | @default("DRAFT") @db.VarChar(20) | DRAFT \| CONFIRMED \| BILLED \| CANCELLED |
| `receivedBy` | `String?` | @db.VarChar(100) | — |
| `receivedAt` | `DateTime` | @default(now()) | — |
| `warehouseId` | `String?` | @db.VarChar(36) | — |
| `notes` | `String?` | @db.Text | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `items` | [`GrnItem`](#grnitem) | many | _back-reference_ | — |

**Referenced by:** [`GrnItem`](#grnitem).`grn`

**Indexes**

- index `[companyId]`
- index `[status]`
- index `[purchaseOrderId]`
- index `[billId]`

### GraduateTaxDeduction

_Table `graduate_tax_deduction` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `graduateTaxId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `period` | `String` | @db.VarChar(7) | YYYY-MM — payroll period this deduction was applied |
| `monthlySalary` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `deductionAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `ercaReference` | `String?` | @db.VarChar(100) | Reference to ERCA/MoR remittance |
| `remitted` | `Boolean` | @default(false) | — |
| `remittedAt` | `DateTime?` | — | — |
| `payrollRecordId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `graduateTax` | [`GraduateTaxEmployee`](#graduatetaxemployee) | one | `graduateTaxId` → `id` | Cascade |

**Referenced by:** [`GraduateTaxEmployee`](#graduatetaxemployee).`deductions`

**Indexes**

- index `[graduateTaxId]`
- index `[companyId]`
- index `[period]`

### GraduateTaxEmployee

_Table `graduate_tax_employee` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `employeeId` | `String?` | — | — |
| `employeeName` | `String` | @db.VarChar(200) | — |
| `employeeTin` | `String?` | @db.VarChar(20) | — |
| `institution` | `String` | @db.VarChar(300) | Name of the public higher-learning institution |
| `institutionRef` | `String?` | @db.VarChar(200) | Reference document issued by the institution |
| `totalOwed` | `Decimal` | @default(0) @db.Decimal(18, 2) | Total cost-sharing amount owed (from institution document) |
| `monthlyDeduction` | `Decimal` | @default(0) @db.Decimal(18, 2) | Amount deducted each month (≥10% of monthly income) |
| `totalDeducted` | `Decimal` | @default(0) @db.Decimal(18, 2) | Running total already deducted |
| `balanceRemaining` | `Decimal` | @default(0) @db.Decimal(18, 2) | Remaining balance to deduct |
| `deductionStartDate` | `DateTime?` | — | Date deduction started (within 6 months of graduation / 1 year max) |
| `employmentEndDate` | `DateTime?` | — | Date employment ended (for final statement) |
| `status` | `String` | @default("ACTIVE") @db.VarChar(20) | ACTIVE \| COMPLETED \| TERMINATED |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `employee` | [`Employee`](#employee) | optional one | `employeeId` → `id` | — |
| `deductions` | [`GraduateTaxDeduction`](#graduatetaxdeduction) | many | _back-reference_ | — |

**Referenced by:** [`Employee`](#employee).`graduateTaxRecords` · [`GraduateTaxDeduction`](#graduatetaxdeduction).`graduateTax`

**Indexes**

- index `[companyId]`
- index `[employeeId]`
- index `[status]`

### GratuityRecord

Gratuity — Labour Proclamation No. 1156/2019

_Table `gratuity_record` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `employeeId` | `String?` | — | — |
| `employeeName` | `String` | @db.VarChar(200) | — |
| `monthlySalary` | `Decimal` | @db.Decimal(18, 2) | — |
| `startDate` | `DateTime` | — | — |
| `endDate` | `DateTime` | — | — |
| `terminationType` | `TerminationType` | — | — |
| `contractType` | `ContractType` | @default(INDEFINITE) | — |
| `unusedLeaveDays` | `Int` | @default(0) | — |
| `noticePeriodGiven` | `Boolean` | @default(false) | — |
| `yearsOfService` | `Int` | @default(0) | — |
| `dailyRate` | `Decimal` | @db.Decimal(18, 2) | — |
| `basicSeverancePay` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `noticePay` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `unusedLeavePay` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `totalGratuity` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `paid` | `Boolean` | @default(false) | — |
| `paidAt` | `DateTime?` | — | — |
| `paymentReference` | `String?` | @db.VarChar(200) | — |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `employee` | [`Employee`](#employee) | optional one | `employeeId` → `id` | — |

**Referenced by:** [`Employee`](#employee).`gratuityRecords`

**Indexes**

- index `[companyId]`
- index `[employeeId]`
- index `[paid]`

### GrnItem

_Table `grnitem` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `grnId` | `String` | — | — |
| `itemId` | `String?` | @db.VarChar(36) | — |
| `companyId` | `String?` | — | — |
| `description` | `String?` | @db.VarChar(500) | — |
| `orderedQty` | `Decimal` | @default(0) @db.Decimal(18, 4) | — |
| `receivedQty` | `Decimal` | @default(0) @db.Decimal(18, 4) | — |
| `rejectedQty` | `Decimal` | @default(0) @db.Decimal(18, 4) | — |
| `unitCost` | `Decimal` | @default(0) @db.Decimal(18, 4) | — |
| `totalCost` | `Decimal` | @default(0) @db.Decimal(18, 4) | — |
| `notes` | `String?` | @db.VarChar(300) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `grn` | [`GoodsReceivedNote`](#goodsreceivednote) | one | `grnId` → `id` | Cascade |

**Referenced by:** [`GoodsReceivedNote`](#goodsreceivednote).`items`

**Indexes**

- index `[companyId]`
- index `[grnId]`
- index `[itemId]`

### Holiday

_Table `holiday` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `date` | `DateTime` | @unique(map: "Holiday_date_key") | — |
| `isAnnual` | `Boolean` | @default(true) | — |

### HsTariffEntry

_Table `hs_tariff_entry` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `hsCode` | `String` | @unique @db.VarChar(10) | WCO 6-digit HS code |
| `hsDescription` | `String` | @db.VarChar(500) | — |
| `chapter` | `String` | @db.VarChar(2) | Chapter (2-digit) and heading (4-digit) for grouping |
| `heading` | `String` | @db.VarChar(4) | — |
| `standardRate` | `Decimal` | @default(0) @db.Decimal(8, 6) | Standard customs duty rate (10–35%) |
| `comesaRate` | `Decimal` | @default(0) @db.Decimal(8, 6) | COMESA preferential rate (standard − 10%) |
| `exciseRate` | `Decimal?` | @db.Decimal(8, 6) | Excise tax rate if applicable |
| `surtaxApplies` | `Boolean` | @default(true) | Whether surtax (10%) applies |
| `isCapitalGoods` | `Boolean` | @default(false) | Whether goods qualify as capital goods (surtax exempt) |
| `restricted` | `Boolean` | @default(false) | Whether goods are prohibited or restricted |
| `restrictionNote` | `String?` | @db.VarChar(500) | — |
| `lastSyncedAt` | `DateTime` | @default(now()) | Last sync from ECC portal |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[chapter]`
- index `[heading]`

### Ifrs15Schedule

_Table `ifrs15_schedule` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `contractId` | `String` | — | — |
| `performanceObligation` | `String` | — | — |
| `totalTransactionPrice` | `Decimal` | @db.Decimal(18, 2) | — |
| `recognizedAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `remainingAmount` | `Decimal` | @db.Decimal(18, 2) | — |
| `currencyCode` | `String` | @default("ETB") @db.VarChar(3) | — |
| `startDate` | `DateTime` | — | — |
| `endDate` | `DateTime` | — | — |
| `recognitionMethod` | `String` | // OVER_TIME \| POINT_IN_TIME | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`ifrs15Schedules`

**Indexes**

- index `[companyId, contractId]`
- index `[companyId, startDate]`

### IfrsGlJournal

_Table `ifrs_gl_journal` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `standard` | `IfrsStandardCode` | — | — |
| `journalEntryId` | `String` | — | — |
| `contractVersionSnapshotId` | `String?` | — | — |
| `allocationTableId` | `String?` | — | — |
| `scheduleRowId` | `String?` | — | — |
| `sourceEventId` | `String?` | — | — |
| `sourceEventType` | `String?` | — | — |
| `leaseId` | `String?` | — | — |
| `softwareAssetId` | `String?` | — | — |
| `companyId` | `String` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `snapshot` | [`ContractSnapshot`](#contractsnapshot) | optional one | `contractVersionSnapshotId` → `id` | — |
| `allocation` | [`RevenueAllocation`](#revenueallocation) | optional one | `allocationTableId` → `id` | — |
| `scheduleRow` | [`RecognitionScheduleRow`](#recognitionschedulerow) | optional one | `scheduleRowId` → `id` | — |

**Referenced by:** [`ContractSnapshot`](#contractsnapshot).`ifrsGlJournals` · [`RecognitionScheduleRow`](#recognitionschedulerow).`ifrsGlJournals` · [`RevenueAllocation`](#revenueallocation).`ifrsGlJournals`

**Indexes**

- index `[journalEntryId]`
- index `[leaseId]`
- index `[softwareAssetId]`
- index `[companyId]`

### IfrsReportingBalance

_Table `ifrs_reporting_balance` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `accountCode` | `String` | — | — |
| `accountName` | `String` | — | — |
| `accountType` | `String` | — | — |
| `period` | `String` | // YYYY-MM | — |
| `openingBalance` | `Decimal` | @db.Decimal(15, 2) | — |
| `periodDebit` | `Decimal` | @db.Decimal(15, 2) | — |
| `periodCredit` | `Decimal` | @db.Decimal(15, 2) | — |
| `closingBalance` | `Decimal` | @db.Decimal(15, 2) | — |
| `projectionEngine` | `ProjectionEngine` | @default(IFRS) | — |
| `reconciledAt` | `DateTime` | @default(now()) | — |

**Indexes**

- unique `[companyId, accountCode, period]`
- index `[companyId, period]`

### ifrsstandard

_Table `ifrsstandard` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id | — |
| `code` | `String` | @unique(map: "IfrsStandard_code_key") | — |
| `name` | `String` | — | — |
| `version` | `String` | @default("2024") | — |
| `type` | `ifrsstandard_type` | — | — |
| `appliesToBusinessTypes` | `String?` | @db.VarChar(500) | — |
| `description` | `String?` | @db.Text | — |
| `disclosureJson` | `String?` | @db.LongText | — |
| `isActive` | `Boolean` | @default(true) | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`ifrsstandard`

**Indexes**

- index `[companyId]`
- index `[type]`

### ImportAdvanceTax

_Table `import_advance_tax` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `period` | `String` | @db.VarChar(7) | YYYY-MM period of the import |
| `importDeclarationNo` | `String?` | @db.VarChar(100) | — |
| `cifValue` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `advanceTaxRate` | `Decimal` | @default(0.03) @db.Decimal(8, 6) | — |
| `advanceTaxPaid` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `paymentDate` | `DateTime?` | — | — |
| `paymentReference` | `String?` | @db.VarChar(200) | — |
| `creditedAgainstBit` | `Decimal` | @default(0) @db.Decimal(18, 2) | Amount credited against final BIT |
| `refundPending` | `Decimal` | @default(0) @db.Decimal(18, 2) | Amount pending refund after crediting against BIT |
| `customsDeclaration` | `String?` | @db.VarChar(200) | — |
| `status` | `String` | @default("PAID") @db.VarChar(20) | PAID \| CREDITED \| REFUND_PENDING \| REFUNDED |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[period]`
- index `[status]`

### ImportShipment

_Table `import_shipment` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `shipmentReference` | `String` | @db.VarChar(100) | Shipment reference (e.g. HBL, AWB, tracking number) |
| `shipmentType` | `String` | @default("FREIGHT_FORWARDER") @db.VarChar(30) | FREIGHT_FORWARDER \| SUPPLIER \| BANK \| OTHER |
| `lcId` | `String?` | — | Linked documents |
| `poId` | `String?` | — | — |
| `customsDeclarationId` | `String?` | — | — |
| `billId` | `String?` | — | — |
| `freightForwarder` | `String?` | @db.VarChar(200) | Logistics parties |
| `shippingLine` | `String?` | @db.VarChar(200) | — |
| `portOfLoading` | `String?` | @db.VarChar(100) | Route |
| `portOfDischarge` | `String?` | @db.VarChar(100) | — |
| `finalDestination` | `String?` | @db.VarChar(100) | — |
| `vesselFlight` | `String?` | @db.VarChar(100) | Vessel / flight / truck |
| `etd` | `DateTime?` | — | Dates |
| `eta` | `DateTime?` | — | — |
| `actualArrival` | `DateTime?` | — | — |
| `clearedAt` | `DateTime?` | — | — |
| `grossWeight` | `Decimal?` | @db.Decimal(18, 2) | Weight and volume |
| `netWeight` | `Decimal?` | @db.Decimal(18, 2) | — |
| `volume` | `Decimal?` | @db.Decimal(18, 2) | — |
| `containerNumber` | `String?` | @db.VarChar(100) | Container info |
| `containerType` | `String?` | @db.VarChar(50) | — |
| `sealNumber` | `String?` | @db.VarChar(100) | — |
| `status` | `String` | @default("BOOKED") @db.VarChar(30) | Status tracking |
| `trackingEvents` | `String?` | @db.LongText | DRAFT \| BOOKED \| IN_TRANSIT \| ARRIVED \| CLEARED \| DELIVERED \| CANCELLED |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[status]`
- index `[eta]`
- index `[lcId]`
- index `[poId]`

### IncomeTaxFiling

_Table `incometaxfiling` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `year` | `Int` | — | — |
| `fiscalYear` | `Int` | — | — |
| `netProfit` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `taxRate` | `Decimal` | @default(30.000000000000000000000000000000) | — |
| `taxPayable` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `taxableIncome` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `grossIncome` | `Decimal` | @default(0.000000000000000000000000000000) | Gross income (turnover) — used for MAT (2.5% × turnover) calculation |
| `paid` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `whtCredits` | `Decimal` | @default(0.000000000000000000000000000000) | WHT credits applied against BIT balance (Proc. 1395/2025 Art. 94) |
| `provisionalPaid` | `Decimal` | @default(0.000000000000000000000000000000) | Quarterly provisional tax payments already remitted (25% × estimated BIT) |
| `permanentAddBacks` | `Decimal` | @default(0.000000000000000000000000000000) | IAS 12 permanent add-backs (non-deductible items: fines, entertainment > threshold) |
| `permanentDeductions` | `Decimal` | @default(0.000000000000000000000000000000) | IAS 12 permanent deductions (tax-exempt income: dividends received, grants) |
| `timingDifferences` | `Decimal` | @default(0.000000000000000000000000000000) | IAS 12 net timing differences (accelerated depreciation, provisions, etc.) |
| `balanceDue` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `status` | `String` | @default("DRAFT") | — |
| `filedAt` | `DateTime?` | — | — |
| `dueDate` | `DateTime?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`incomeTaxFiling`

**Indexes**

- unique `[companyId, fiscalYear]`
- index `[companyId]`

### ingestionjob

_Table `ingestionjob` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id | — |
| `sourceType` | `String` | @db.VarChar(20) | — |
| `targetType` | `String` | @db.VarChar(20) | — |
| `status` | `String` | @default("RECEIVED") @db.VarChar(20) | — |
| `companyId` | `String?` | — | — |
| `createdBy` | `String?` | — | — |
| `fileName` | `String?` | @db.VarChar(255) | — |
| `mimeType` | `String?` | @db.VarChar(100) | — |
| `rawPayload` | `String?` | @db.Text | — |
| `parsedPayload` | `String?` | @db.LongText | — |
| `committedIds` | `String?` | @db.Text | — |
| `errors` | `String?` | @db.Text | — |
| `rowsParsed` | `Int` | @default(0) | — |
| `rowsCommitted` | `Int` | @default(0) | — |
| `rowsFailed` | `Int` | @default(0) | — |
| `rowsForReview` | `Int` | @default(0) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `completedAt` | `DateTime?` | — | — |

**Indexes**

- index `[companyId]`
- index `[createdAt]`
- index `[status]`

### IntercompanyElimination

_Table `intercompany_elimination` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `fromCompanyId` | `String` | @db.VarChar(36) | — |
| `toCompanyId` | `String` | @db.VarChar(36) | — |
| `intercompanyTxId` | `String?` | @db.VarChar(36) | — |
| `period` | `String` | @db.VarChar(7) | — |
| `eliminationType` | `String` | @default("RECEIVABLE") @db.VarChar(20) | RECEIVABLE \| PAYABLE \| REVENUE \| EXPENSE \| DIVIDEND \| INVESTMENT |
| `amount` | `Decimal` | @db.Decimal(18, 2) | — |
| `journalEntryId` | `String?` | @db.VarChar(36) | — |
| `status` | `String` | @default("PENDING") @db.VarChar(20) | PENDING \| POSTED \| REVERSED |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[fromCompanyId]`
- index `[toCompanyId]`
- index `[period]`
- index `[status]`

### InterCompanyTransaction

_Table `intercompanytransaction` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `fromCompanyId` | `String` | — | — |
| `toCompanyId` | `String` | — | — |
| `journalEntryId` | `String?` | — | — |
| `amount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `type` | `String` | @default("TRANSFER") | — |
| `description` | `String?` | @db.Text | — |
| `status` | `String` | @default("PENDING") | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |
| `fxDifferenceId` | `String?` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `Fxdifference` | [`fxdifference`](#fxdifference) | optional one | `fxDifferenceId` → `id` | — |
| `fromCompany` | [`Company`](#company) | one | `fromCompanyId` → `id` | — |
| `journalEntry` | [`JournalEntry`](#journalentry) | optional one | `journalEntryId` → `id` | — |
| `toCompany` | [`Company`](#company) | one | `toCompanyId` → `id` | — |

**Referenced by:** [`Company`](#company).`intercompanyFrom` · [`Company`](#company).`intercompanyTo` · [`fxdifference`](#fxdifference).`interCompanyTransaction` · [`JournalEntry`](#journalentry).`interCompanyTransaction`

**Indexes**

- index `[fromCompanyId]`
- index `[fxDifferenceId]`
- index `[journalEntryId]`
- index `[toCompanyId]`

### InventoryAdjustment

_Table `inventoryadjustment` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `reference` | `String` | @unique @db.VarChar(100) | — |
| `itemId` | `String` | — | — |
| `quantity` | `Int` | — | — |
| `type` | `String` | @db.VarChar(20) | — |
| `reason` | `String?` | @db.VarChar(300) | — |
| `notes` | `String?` | @db.Text | — |
| `adjustedBy` | `String?` | @db.VarChar(100) | — |
| `companyId` | `String?` | — | — |
| `warehouseId` | `String?` | @db.VarChar(36) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `item` | [`Item`](#item) | one | `itemId` → `id` | Cascade |

**Referenced by:** [`Item`](#item).`inventoryAdjustment`

**Indexes**

- index `[itemId]`
- index `[companyId]`

### Investment

_Table `investment` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `title` | `String` | @db.VarChar(200) | — |
| `investorName` | `String` | @db.VarChar(200) | — |
| `investorType` | `String` | @default("PRIVATE") | — |
| `type` | `InvestmentType` | @default(OTHER) | — |
| `status` | `InvestmentStatus` | @default(PROSPECTING) | — |
| `amount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `equityPct` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `expectedReturn` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `commitmentDate` | `DateTime?` | — | — |
| `startDate` | `DateTime?` | — | — |
| `exitDate` | `DateTime?` | — | — |
| `partnershipId` | `String?` | — | — |
| `customerId` | `String?` | — | — |
| `companyId` | `String?` | — | — |
| `investmentPurpose` | `String?` | @db.Text | — |
| `dueDiligenceNotes` | `String?` | @db.Text | — |
| `regulatoryApproval` | `Boolean` | @default(false) | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `customer` | [`Customer`](#customer) | optional one | `customerId` → `id` | — |
| `partnership` | [`Partnership`](#partnership) | optional one | `partnershipId` → `id` | — |

**Referenced by:** [`Customer`](#customer).`investment` · [`Partnership`](#partnership).`investment`

**Indexes**

- index `[companyId]`
- index `[partnershipId]`
- index `[status]`
- index `[customerId]`

### Invoice

_Table `invoice` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `invoiceNumber` | `String` | @default(uuid()) | — |
| `customerName` | `String` | — | — |
| `customerId` | `String?` | — | — |
| `companyId` | `String?` | — | — |
| `status` | `InvoiceStatus` | @default(DRAFT) | — |
| `date` | `DateTime` | @default(now()) | — |
| `currencyCode` | `String` | @default("ETB") @db.VarChar(3) | — |
| `currencyRate` | `Decimal` | @default(1.0) | — |
| `totalAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `vatAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `qrData` | `String?` | @db.Text | — |
| `journalEntryId` | `String?` | @db.VarChar(36) | — |
| `glReference` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |
| `dueDate` | `DateTime?` | — | — |
| `paymentSource` | `String?` | — | — |
| `telecomReceiptRef` | `String?` | @db.VarChar(100) | — |
| `telecomAmount` | `Decimal?` | — | — |
| `telecomPaidAt` | `DateTime?` | — | — |
| `telecomRawData` | `String?` | @db.Text | — |
| `bankName` | `String?` | @db.VarChar(100) | — |
| `bankAccountNo` | `String?` | @db.VarChar(100) | — |
| `bankQrRawData` | `String?` | @db.Text | — |
| `notes` | `String?` | @db.Text | — |
| `receiptImageData` | `String?` | @db.LongText | — |
| `bankSlipImageData` | `String?` | @db.LongText | — |
| `customerEmail` | `String?` | @db.VarChar(200) | — |
| `subtotal` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `discountAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `vatRate` | `Decimal` | @default(15.000000000000000000000000000000) | — |
| `isVatRegistered` | `Boolean` | @default(false) | — |
| `totAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `totRate` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `exciseAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `exciseRate` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `exciseCategory` | `String?` | @db.VarChar(50) | — |
| `importSurtaxAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `importBase` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `customsDutyAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `exciseDutyAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `whtAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `whtRate` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `whtType` | `String?` | @db.VarChar(20) | — |
| `drrfAmount` | `Decimal` | @default(0.000000000000000000000000000000) | DRRF levy amount (1% of subtotal — Regulation No. 570/2025) |
| `drrfRate` | `Decimal` | @default(0.0100) @db.Decimal(5, 4) | DRRF rate (default 0.01 = 1%) |
| `stampDutyAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `stampDutyRequired` | `Boolean` | @default(false) | — |
| `items` | `String?` | @db.LongText | Invoice line items as JSON array |
| `matAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `matApplied` | `Boolean` | @default(false) | — |
| `sentAt` | `DateTime?` | — | — |
| `isRecurring` | `Boolean` | @default(false) | — |
| `recurringInterval` | `String?` | @db.VarChar(20) | — |
| `recurringNextDate` | `DateTime?` | — | — |
| `recurringParentId` | `String?` | — | — |
| `customerPhone` | `String?` | @db.VarChar(50) | — |
| `customerAddress` | `String?` | @db.VarChar(500) | — |
| `customerTin` | `String?` | @db.VarChar(50) | — |
| `fsNo` | `String?` | @db.VarChar(50) | Fiscal Sales Register Machine Number (FS No.) — ERCA TASS mandate Required on all B2B tax invoices. Format: SRM serial assigned by ERCA. |
| `scheduledSendAt` | `DateTime?` | — | — |
| `paymentTerms` | `String?` | @db.VarChar(20) | — |
| `invoiceDiscount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `lateInterestRate` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `customerNotes` | `String?` | @db.Text | — |
| `shareToken` | `String?` | @unique(map: "Invoice_shareToken_key") | — |
| `docType` | `String` | @default("INVOICE") | — |
| `ifrs15DisclosureNotes` | `String?` | @db.Text | — |
| `ifrs15Step1Complete` | `Boolean` | @default(false) | — |
| `ifrs15Step2Complete` | `Boolean` | @default(false) | — |
| `ifrs15Step3Complete` | `Boolean` | @default(false) | — |
| `ifrs15Step4Complete` | `Boolean` | @default(false) | — |
| `ifrs15Step5Complete` | `Boolean` | @default(false) | — |
| `ifrsContingency` | `String?` | @db.VarChar(50) | — |
| `ifrsContractRef` | `String?` | @db.VarChar(100) | — |
| `ifrsCreditRisk` | `String?` | @db.VarChar(20) | — |
| `ifrsEclProvision` | `Decimal?` | — | — |
| `ifrsFunctionalCurrency` | `String` | @default("ETB") | — |
| `ifrsHasWarranty` | `Boolean` | @default(false) | — |
| `ifrsMeasurementCategory` | `String?` | @db.VarChar(50) | — |
| `ifrsPerformanceObligation` | `String?` | @db.VarChar(500) | — |
| `ifrsReceivableClass` | `String?` | @db.VarChar(50) | — |
| `ifrsRecognitionTiming` | `String?` | @db.VarChar(100) | — |
| `ifrsVariableConsideration` | `String?` | @db.VarChar(50) | — |
| `ifrsWarrantyProvision` | `Decimal?` | — | — |
| `category` | `String?` | @db.VarChar(100) | — |
| `categoryId` | `String?` | — | — |
| `discountLocation` | `String` | @default("TOTAL") | — |
| `discountType` | `String` | @default("FIXED") | — |
| `discountValue` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `footer` | `String?` | @db.Text | — |
| `ingestionSource` | `String?` | @db.VarChar(50) | — |
| `ocrMetadata` | `String?` | @db.LongText | — |
| `dispatchDocketId` | `String?` | @db.VarChar(36) | — |
| `eimsIrn` | `String?` | @db.VarChar(64) | MoR EIMS Invoice Reference Number (64-char hash from registration) |
| `eimsStatus` | `String?` | @default("NOT_REGISTERED") @db.VarChar(20) | NOT_REGISTERED \| PENDING \| REGISTERED \| FAILED \| CANCELLED |
| `eimsSignedQr` | `String?` | @db.LongText | Base64 signed QR from EIMS registration response |
| `eimsRegisteredAt` | `DateTime?` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `collectionCase` | [`CollectionCase`](#collectioncase) | many | _back-reference_ | — |
| `deduction` | [`Deduction`](#deduction) | many | _back-reference_ | — |
| `categoryRef` | [`Category`](#category) | optional one | `categoryId` → `id` | — |
| `customer` | [`Customer`](#customer) | optional one | `customerId` → `id` | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `journalEntry` | [`JournalEntry`](#journalentry) | optional one | `journalEntryId` → `id` | — |
| `invoiceActivity` | [`InvoiceActivity`](#invoiceactivity) | many | _back-reference_ | — |
| `invoiceItem` | [`InvoiceItem`](#invoiceitem) | many | _back-reference_ | — |
| `invoicePayment` | [`InvoicePayment`](#invoicepayment) | many | _back-reference_ | — |
| `paymentBatchItem` | [`PaymentBatchItem`](#paymentbatchitem) | many | _back-reference_ | — |
| `dispatchDocket` | [`DispatchDocket`](#dispatchdocket) | optional one | `dispatchDocketId` → `id` | — |

**Referenced by:** [`Category`](#category).`invoices` · [`CollectionCase`](#collectioncase).`invoice` · [`Company`](#company).`invoice` · [`Customer`](#customer).`invoices` · [`Deduction`](#deduction).`invoice` · [`DispatchDocket`](#dispatchdocket).`invoices` · [`InvoiceActivity`](#invoiceactivity).`invoice` · [`InvoiceItem`](#invoiceitem).`invoice` · [`InvoicePayment`](#invoicepayment).`invoice` · [`JournalEntry`](#journalentry).`invoice` · [`PaymentBatchItem`](#paymentbatchitem).`invoice`

**Indexes**

- unique `[invoiceNumber, companyId]`
- index `[companyId]`
- index `[customerName]`
- index `[date]`
- index `[dueDate]`
- index `[recurringNextDate]`
- index `[recurringParentId]`
- index `[scheduledSendAt]`
- index `[shareToken]`
- index `[status]`
- index `[eimsIrn]`
- index `[eimsStatus]`
- index `[journalEntryId]`
- index `[companyId, status, dueDate]`
- index `[companyId, date(sort: Desc)]`

### InvoiceActivity

_Table `invoiceactivity` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `invoiceId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `action` | `String` | @db.VarChar(100) | — |
| `detail` | `String?` | @db.VarChar(500) | — |
| `performedBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `invoice` | [`Invoice`](#invoice) | one | `invoiceId` → `id` | Cascade |

**Referenced by:** [`Invoice`](#invoice).`invoiceActivity`

**Indexes**

- index `[companyId]`
- index `[invoiceId]`

### InvoiceItem

_Table `invoiceitem` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `invoiceId` | `String` | — | — |
| `itemId` | `String?` | — | — |
| `companyId` | `String?` | — | — |
| `quantity` | `Int` | @default(1) | — |
| `salePrice` | `Decimal` | — | — |
| `discount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `description` | `String?` | @db.VarChar(500) | — |
| `discountType` | `String` | @default("FIXED") | — |
| `discountValue` | `Decimal` | @default(0.000000000000000000000000000000) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `invoice` | [`Invoice`](#invoice) | one | `invoiceId` → `id` | Cascade |
| `item` | [`Item`](#item) | optional one | `itemId` → `id` | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`invoiceItem` · [`Invoice`](#invoice).`invoiceItem` · [`Item`](#item).`invoiceItem`

**Indexes**

- index `[invoiceId]`
- index `[itemId]`
- index `[companyId]`

### InvoicePayment

_Table `invoicepayment` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `invoiceId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `amount` | `Decimal` | — | — |
| `currencyCode` | `String` | @default("ETB") @db.VarChar(3) | — |
| `currencyRate` | `Decimal` | @default(1.0) | — |
| `method` | `String` | @default("CASH") | — |
| `reference` | `String?` | @db.VarChar(200) | — |
| `notes` | `String?` | @db.VarChar(500) | — |
| `paidAt` | `DateTime` | @default(now()) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `paymentSource` | `String?` | @db.VarChar(30) | — |
| `orderNo` | `String?` | @db.VarChar(50) | — |
| `orderType` | `String?` | @db.VarChar(30) | — |
| `mcc` | `String?` | @db.VarChar(10) | — |
| `mccDescription` | `String?` | @db.VarChar(100) | — |
| `qrType` | `String?` | @db.VarChar(10) | — |
| `tinValidated` | `Boolean` | @default(false) | — |
| `isDuplicate` | `Boolean` | @default(false) | — |
| `telecomRef` | `String?` | @db.VarChar(100) | — |
| `bankName` | `String?` | @db.VarChar(100) | — |
| `archType` | `String?` | @db.VarChar(30) | — |
| `bankAccountName` | `String?` | @db.VarChar(100) | — |
| `interactionType` | `String?` | @db.VarChar(30) | — |
| `processType` | `String?` | @db.VarChar(30) | — |
| `journalEntryId` | `String?` | @db.VarChar(36) | — |
| `bankAccountId` | `String?` | — | — |
| `bankTransactionId` | `String?` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `invoice` | [`Invoice`](#invoice) | one | `invoiceId` → `id` | Cascade |
| `journalEntry` | [`JournalEntry`](#journalentry) | optional one | `journalEntryId` → `id` | — |
| `bankAccount` | [`BankAccount`](#bankaccount) | optional one | `bankAccountId` → `id` | — |
| `bankTransaction` | [`BankTransaction`](#banktransaction) | optional one | `bankTransactionId` → `id` | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`BankAccount`](#bankaccount).`invoicePayments` · [`BankTransaction`](#banktransaction).`invoicePayments` · [`Company`](#company).`invoicePayment` · [`Invoice`](#invoice).`invoicePayment` · [`JournalEntry`](#journalentry).`invoicePayment`

**Indexes**

- index `[invoiceId]`
- index `[reference]`
- index `[telecomRef]`
- index `[journalEntryId]`
- index `[companyId]`

### IotAlert

IoT Alerts — triggered when a telemetry value crosses a threshold

_Table `iot_alert` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `deviceId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `alertType` | `String` | @db.VarChar(30) | THRESHOLD \| OFFLINE \| BATTERY_LOW \| FIRMWARE_OUTDATED \| BILLING_TRIGGER \| ANOMALY \| CUSTOM |
| `severity` | `String` | @default("WARNING") @db.VarChar(10) | — |
| `title` | `String` | @db.VarChar(300) | — |
| `message` | `String` | @db.Text | — |
| `metricKey` | `String?` | @db.VarChar(50) | — |
| `thresholdValue` | `Decimal?` | @db.Decimal(18, 6) | — |
| `actualValue` | `Decimal?` | @db.Decimal(18, 6) | — |
| `status` | `String` | @default("OPEN") @db.VarChar(20) | OPEN \| ACKNOWLEDGED \| RESOLVED \| SUPPRESSED |
| `acknowledgedBy` | `String?` | @db.VarChar(100) | — |
| `acknowledgedAt` | `DateTime?` | — | — |
| `resolvedAt` | `DateTime?` | — | — |
| `linkedInvoiceId` | `String?` | @db.VarChar(36) | If this alert triggered a billing event, link the invoice |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `device` | [`IotDevice`](#iotdevice) | one | `deviceId` → `id` | Cascade |

**Referenced by:** [`IotDevice`](#iotdevice).`alerts`

**Indexes**

- index `[deviceId]`
- index `[status]`
- index `[alertType]`
- index `[companyId]`

### IotBillingTrigger

Smart Billable Triggers — IoT events that auto-generate invoice line items e.g. "Energy usage > 100 kWh threshold crossed → create billable line item"

_Table `iot_billing_trigger` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `deviceId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `customerId` | `String?` | @db.VarChar(36) | — |
| `triggerType` | `String` | @db.VarChar(30) | THRESHOLD_EXCEEDED \| USAGE_MILESTONE \| ALERT_FIRED \| SCHEDULED_READ \| MANUAL |
| `metricKey` | `String?` | @db.VarChar(50) | Which metric caused the trigger |
| `thresholdValue` | `Decimal?` | @db.Decimal(18, 6) | The threshold value that was crossed |
| `actualValue` | `Decimal?` | @db.Decimal(18, 6) | The actual value that triggered the billing event |
| `lineItemDescription` | `String` | @db.VarChar(500) | Billing line item description to appear on invoice |
| `billableAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | Billable amount (ETB or configured currency) |
| `currencyCode` | `String` | @default("ETB") @db.VarChar(3) | — |
| `invoiced` | `Boolean` | @default(false) | Whether a line item has been added to an invoice |
| `linkedInvoiceId` | `String?` | @db.VarChar(36) | — |
| `linkedInvoiceNo` | `String?` | @db.VarChar(100) | — |
| `invoicedAt` | `DateTime?` | — | — |
| `snapshotJson` | `String?` | @db.LongText | Telemetry snapshot at trigger time (JSON) |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `device` | [`IotDevice`](#iotdevice) | one | `deviceId` → `id` | Cascade |

**Referenced by:** [`IotDevice`](#iotdevice).`billingTriggers`

**Indexes**

- index `[deviceId]`
- index `[companyId]`
- index `[customerId]`
- index `[invoiced]`

### IotDashboardWidget

IoT Dashboard Widget Config — persists per user/company widget layouts

_Table `iot_dashboard_widget` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `userId` | `String?` | @db.VarChar(36) | — |
| `widgetType` | `String` | @db.VarChar(50) | — |
| `title` | `String` | @db.VarChar(200) | — |
| `configJson` | `String` | @db.LongText | Device IDs or metric keys the widget monitors (JSON array) |
| `posX` | `Int` | @default(0) | Grid position: row, col, width, height |
| `posY` | `Int` | @default(0) | — |
| `width` | `Int` | @default(2) | — |
| `height` | `Int` | @default(2) | — |
| `isVisible` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[userId]`

### IotDevice

IoT Device Registry — the authoritative record for every managed device

_Table `iot_device` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `name` | `String` | @db.VarChar(200) | Human-readable name: "Smart Meter #14", "Router: Branch A" |
| `serialNumber` | `String` | @db.VarChar(100) | Internal device serial / hardware identifier |
| `externalRef` | `String?` | @db.VarChar(100) | External IMEI / MAC / vendor ref |
| `deviceType` | `String` | @default("SENSOR") @db.VarChar(30) | SMART_METER \| ROUTER \| SENSOR \| CONTROLLER \| CAMERA \| POS_TERMINAL \| OTHER |
| `location` | `String?` | @db.VarChar(300) | Physical or logical location (e.g. "Warehouse B – Shelf 3") |
| `firmwareVersion` | `String?` | @db.VarChar(50) | — |
| `hardwareVersion` | `String?` | @db.VarChar(50) | — |
| `manufacturer` | `String?` | @db.VarChar(100) | — |
| `model` | `String?` | @db.VarChar(100) | — |
| `status` | `String` | @default("ACTIVE") @db.VarChar(20) | ACTIVE \| INACTIVE \| MAINTENANCE \| DECOMMISSIONED \| OFFLINE |
| `lastSeenAt` | `DateTime?` | — | ISO 8601 last seen heartbeat |
| `batteryLevel` | `Int?` | — | Battery percentage 0–100; null for wired devices |
| `uptimeHours` | `Decimal?` | @db.Decimal(12, 2) | Uptime hours since last reboot |
| `connectionString` | `String?` | @db.VarChar(500) | MQTT topic, API endpoint, or webhook URL |
| `protocol` | `String?` | @db.VarChar(20) | MQTT \| HTTP \| COAP \| MODBUS \| ZIGBEE \| ZWAVE \| BLE \| OTHER |
| `configJson` | `String?` | @db.LongText | Arbitrary config JSON (thresholds, calibration, tags) |
| `customerId` | `String?` | @db.VarChar(36) | Customer ID this device is installed at (for billable events) |
| `fixedAssetId` | `String?` | @db.VarChar(36) | Linked fixed asset (for depreciation) |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `telemetry` | [`IotTelemetry`](#iottelemetry) | many | _back-reference_ | — |
| `alerts` | [`IotAlert`](#iotalert) | many | _back-reference_ | — |
| `otaJobs` | [`OtaUpdateJob`](#otaupdatejob) | many | _back-reference_ | — |
| `billingTriggers` | [`IotBillingTrigger`](#iotbillingtrigger) | many | _back-reference_ | — |

**Referenced by:** [`IotAlert`](#iotalert).`device` · [`IotBillingTrigger`](#iotbillingtrigger).`device` · [`IotTelemetry`](#iottelemetry).`device` · [`OtaUpdateJob`](#otaupdatejob).`device`

**Indexes**

- index `[companyId]`
- index `[status]`
- index `[deviceType]`
- index `[customerId]`

### IotFiscalEvent

_Table `iot_fiscal_event` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `deviceId` | `String` | — | — |
| `triggerId` | `String` | — | — |
| `amount` | `Decimal` | @db.Decimal(18, 2) | — |
| `fiscalSignature` | `String` | @db.VarChar(255) | — |
| `period` | `String` | @db.VarChar(7) // YYYY-MM | — |
| `recordedAt` | `DateTime` | @default(now()) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`iotFiscalEvents`

**Indexes**

- index `[companyId, period]`
- index `[deviceId, period]`

### IotTelemetry

Telemetry time-series — one row per reading per device Keep rows short; archive older than 90 days to a cold store (future)

_Table `iot_telemetry` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `deviceId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `metricKey` | `String` | @db.VarChar(50) | Sensor reading type: ENERGY_KWH \| TEMPERATURE \| HUMIDITY \| PRESSURE \| FLOW_RATE \| CURRENT_A \| VOLTAGE_V \| BANDWIDTH_MBPS \| PACKET_LOSS_PCT \| CUSTOM |
| `value` | `Decimal` | @db.Decimal(18, 6) | Numeric sensor value |
| `unit` | `String?` | @db.VarChar(20) | — |
| `recordedAt` | `DateTime` | — | UTC timestamp of the reading (device clock) |
| `quality` | `String` | @default("NORMAL") @db.VarChar(10) | NORMAL \| WARNING \| CRITICAL \| FAULT |
| `rawPayload` | `String?` | @db.LongText | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `device` | [`IotDevice`](#iotdevice) | one | `deviceId` → `id` | Cascade |

**Referenced by:** [`IotDevice`](#iotdevice).`telemetry`

**Indexes**

- index `[deviceId]`
- index `[metricKey]`
- index `[recordedAt]`
- index `[companyId]`

### Item

_Table `item` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `code` | `String` | @unique(map: "Item_code_key") | — |
| `category` | `String` | — | — |
| `categoryId` | `String?` | — | — |
| `companyId` | `String?` | — | — |
| `salePrice` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `vatRate` | `Decimal` | @default(15.000000000000000000000000000000) | — |
| `stock` | `Int` | @default(0) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |
| `reorderLevel` | `Int` | @default(5) | — |
| `costPrice` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `description` | `String?` | @db.Text | — |
| `itemType` | `String` | @default("PRODUCT") @db.VarChar(20) | — |
| `groupId` | `String?` | — | — |
| `warehouseId` | `String?` | — | — |
| `imageUrl` | `String?` | @db.VarChar(500) | — |
| `barcode` | `String?` | @db.VarChar(100) | — |
| `unit` | `String?` | @default("UNIT") @db.VarChar(30) | — |
| `minOrderQty` | `Int` | @default(1) | — |
| `maxOrderQty` | `Int?` | — | — |
| `isActive` | `Boolean` | @default(true) | — |
| `status` | `ItemStatus` | @default(ACTIVE) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `billItem` | [`BillItem`](#billitem) | many | _back-reference_ | — |
| `invoiceItem` | [`InvoiceItem`](#invoiceitem) | many | _back-reference_ | — |
| `categoryRef` | [`Category`](#category) | optional one | `categoryId` → `id` | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `group` | [`ItemGroup`](#itemgroup) | optional one | `groupId` → `id` | — |
| `warehouse` | [`Warehouse`](#warehouse) | optional one | `warehouseId` → `id` | — |
| `stockTransaction` | [`StockTransaction`](#stocktransaction) | many | _back-reference_ | — |
| `variants` | [`ItemVariant`](#itemvariant) | many | _back-reference_ | — |
| `transferOrderItems` | [`TransferOrderItem`](#transferorderitem) | many | _back-reference_ | — |
| `inventoryAdjustment` | [`InventoryAdjustment`](#inventoryadjustment) | many | _back-reference_ | — |
| `warehouseStocks` | [`WarehouseStock`](#warehousestock) | many | _back-reference_ | — |

**Referenced by:** [`BillItem`](#billitem).`item` · [`Category`](#category).`items` · [`Company`](#company).`item` · [`InventoryAdjustment`](#inventoryadjustment).`item` · [`InvoiceItem`](#invoiceitem).`item` · [`ItemGroup`](#itemgroup).`items` · [`ItemVariant`](#itemvariant).`item` · [`StockTransaction`](#stocktransaction).`item` · [`TransferOrderItem`](#transferorderitem).`item` · [`Warehouse`](#warehouse).`items` · [`WarehouseStock`](#warehousestock).`item`

**Indexes**

- index `[companyId]`
- index `[groupId]`
- index `[warehouseId]`

### ItemGroup

_Table `itemgroup` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `description` | `String?` | @db.Text | — |
| `companyId` | `String?` | — | — |
| `isActive` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `items` | [`Item`](#item) | many | _back-reference_ | — |

**Referenced by:** [`Item`](#item).`group`

**Indexes**

- unique `[name, companyId]`
- index `[companyId]`

### ItemVariant

_Table `itemvariant` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `itemId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `name` | `String` | @db.VarChar(200) | — |
| `sku` | `String` | @unique @db.VarChar(100) | — |
| `price` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `costPrice` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `stock` | `Int` | @default(0) | — |
| `attributes` | `String?` | @db.Text | — |
| `imageUrl` | `String?` | @db.VarChar(500) | — |
| `isActive` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `item` | [`Item`](#item) | one | `itemId` → `id` | Cascade |

**Referenced by:** [`Item`](#item).`variants`

**Indexes**

- index `[companyId]`
- index `[itemId]`

### JournalEntry

_Table `journalentry` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `date` | `DateTime` | @default(now()) | — |
| `period` | `String?` | @db.VarChar(7) | — |
| `reference` | `String?` | — | — |
| `description` | `String` | — | — |
| `status` | `String` | @default("POSTED") | — |
| `companyId` | `String?` | — | — |
| `postedBy` | `String?` | — | — |
| `bookType` | `String?` | @db.VarChar(20) | Dual-book designation: LOCAL (Ethiopian tax/management book) \| IFRS (statutory IFRS book) \| CONSOLIDATED (group elimination book). NULL means the entry applies to both books (the common case for non-adjusting transactions). Parallel IFRS adjustment entries are linked to their LOCAL counterpart via mirrorEntryId. |
| `mirrorEntryId` | `String?` | @db.VarChar(36) | Links an IFRS adjustment entry back to the original LOCAL/management entry it adjusts. Enables auditors to reconcile the two-book difference on any given transaction. |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `bankTransaction` | [`BankTransaction`](#banktransaction) | many | _back-reference_ | — |
| `interCompanyTransaction` | [`InterCompanyTransaction`](#intercompanytransaction) | many | _back-reference_ | — |
| `journalLine` | [`JournalLine`](#journalline) | many | _back-reference_ | — |
| `ledgerEntries` | [`LedgerEntry`](#ledgerentry) | many | _back-reference_ | — |
| `invoice` | [`Invoice`](#invoice) | many | _back-reference_ | — |
| `bill` | [`Bill`](#bill) | many | _back-reference_ | — |
| `invoicePayment` | [`InvoicePayment`](#invoicepayment) | many | _back-reference_ | — |
| `billPayment` | [`BillPayment`](#billpayment) | many | _back-reference_ | — |
| `payrollRecord` | [`PayrollRecord`](#payrollrecord) | many | _back-reference_ | — |
| `revenues` | [`Revenue`](#revenue) | many | _back-reference_ | — |
| `payments` | [`Payment`](#payment) | many | _back-reference_ | — |
| `vendorPayments` | [`VendorPayment`](#vendorpayment) | many | _back-reference_ | — |
| `fundTransfers` | [`FundTransfer`](#fundtransfer) | many | _back-reference_ | — |
| `fiscalYearClosings` | [`FiscalYear`](#fiscalyear) | many | _back-reference_ | — |
| `fiscalYearOpenings` | [`FiscalYear`](#fiscalyear) | many | _back-reference_ | — |

**Referenced by:** [`BankTransaction`](#banktransaction).`journalEntry` · [`Bill`](#bill).`journalEntry` · [`BillPayment`](#billpayment).`journalEntry` · [`Company`](#company).`journalEntry` · [`FiscalYear`](#fiscalyear).`closingEntry` · [`FiscalYear`](#fiscalyear).`openingEntry` · [`FundTransfer`](#fundtransfer).`journalEntry` · [`InterCompanyTransaction`](#intercompanytransaction).`journalEntry` · [`Invoice`](#invoice).`journalEntry` · [`InvoicePayment`](#invoicepayment).`journalEntry` · [`JournalLine`](#journalline).`journalEntry` · [`LedgerEntry`](#ledgerentry).`journalEntry` · [`Payment`](#payment).`journalEntry` · [`PayrollRecord`](#payrollrecord).`journalEntry` · [`Revenue`](#revenue).`journalEntry` · [`VendorPayment`](#vendorpayment).`journalEntry`

**Indexes**

- index `[companyId]`
- index `[companyId, date]`
- index `[companyId, status]`
- index `[companyId, period]`
- index `[companyId, bookType]`

### JournalLine

_Table `journalline` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `journalEntryId` | `String` | — | — |
| `accountId` | `String` | — | — |
| `description` | `String?` | — | — |
| `debit` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `credit` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `taxType` | `JournalLineTaxType?` | — | — |
| `companyId` | `String?` | — | — |
| `costCenterId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `account` | [`Account`](#account) | one | `accountId` → `id` | — |
| `journalEntry` | [`JournalEntry`](#journalentry) | one | `journalEntryId` → `id` | Cascade |
| `costCenter` | [`CostCenter`](#costcenter) | optional one | `costCenterId` → `id` | — |

**Referenced by:** [`Account`](#account).`journalLine` · [`Company`](#company).`journalLine` · [`CostCenter`](#costcenter).`journalLines` · [`JournalEntry`](#journalentry).`journalLine`

**Indexes**

- index `[companyId]`
- index `[costCenterId]`
- index `[accountId]`
- index `[journalEntryId]`

### LandedCostAllocation

_Table `landed_cost_allocation` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `purchaseOrderId` | `String?` | — | — |
| `purchaseOrderNumber` | `String?` | @db.VarChar(100) | — |
| `billId` | `String?` | — | — |
| `customsDeclarationId` | `String?` | — | — |
| `totalLandedCost` | `Decimal` | @default(0) @db.Decimal(18, 2) | Total landed cost for this allocation |
| `cifValue` | `Decimal` | @default(0) @db.Decimal(18, 2) | Component breakdown |
| `freightCost` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `insuranceCost` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `customsDuty` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `exciseDuty` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `importSurtax` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `vatOnImport` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `advanceBit` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `otherCosts` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `allocationMethod` | `String` | @default("QUANTITY") @db.VarChar(20) | Allocation method: WEIGHT \| VOLUME \| VALUE \| QUANTITY |
| `allocatedAcross` | `Int` | @default(0) | Number of items/line items this was allocated across |
| `costPerUnit` | `Decimal` | @default(0) @db.Decimal(18, 4) | Cost per unit after allocation |
| `exchangeRate` | `Decimal` | @default(1.0) @db.Decimal(10, 4) | Exchange rate used for CIF conversion |
| `currencyCode` | `String` | @default("USD") @db.VarChar(3) | — |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[purchaseOrderId]`
- index `[billId]`
- index `[customsDeclarationId]`

### Lease

_Table `lease` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `leaseNumber` | `String` | @unique @db.VarChar(100) | Lease reference number (e.g. LEASE-2025-001) |
| `leaseType` | `String` | @default("ovds") @db.VarChar(20) | ovds \| OPERATING |
| `status` | `String` | @default("ACTIVE") @db.VarChar(20) | ACTIVE \| TERMINATED \| EXPIRED \| MODIFIED |
| `assetDescription` | `String` | @db.VarChar(300) | Asset description (e.g. "Office Building — Bole, Addis Ababa") |
| `assetCategory` | `String` | @default("PROPERTY") @db.VarChar(50) | Asset category (PROPERTY, VEHICLE, EQUIPMENT, OTHER) |
| `lessorName` | `String` | @db.VarChar(200) | Lessor name |
| `lessorTin` | `String?` | @db.VarChar(20) | — |
| `commencementDate` | `DateTime` | — | Lease commencement date |
| `endDate` | `DateTime` | — | Lease end date |
| `termMonths` | `Int` | — | Lease term in months |
| `monthlyPayment` | `Decimal` | @default(0) @db.Decimal(18, 2) | Monthly lease payment (ETB) |
| `discountRate` | `Decimal` | @default(0.12) @db.Decimal(8, 6) | Annual interest rate (e.g. 0.12 for 12%) |
| `rouAssetInitial` | `Decimal` | @default(0) @db.Decimal(18, 2) | Right-of-use asset initial value (PV of lease payments) |
| `rouAssetCarrying` | `Decimal` | @default(0) @db.Decimal(18, 2) | Current ROU asset carrying amount (after depreciation) |
| `leaseLiabilityInitial` | `Decimal` | @default(0) @db.Decimal(18, 2) | Initial lease liability (= rouAssetInitial) |
| `leaseLiabilityCurrent` | `Decimal` | @default(0) @db.Decimal(18, 2) | Current lease liability outstanding |
| `totalInterestExpense` | `Decimal` | @default(0) @db.Decimal(18, 2) | Total interest expense recognised to date |
| `totalDepreciation` | `Decimal` | @default(0) @db.Decimal(18, 2) | Total depreciation recognised to date |
| `totalPaymentsMade` | `Decimal` | @default(0) @db.Decimal(18, 2) | Total payments made to date |
| `residualValueGuarantee` | `Decimal?` | @db.Decimal(18, 2) | Optional: residual value guarantee |
| `purchaseOptionPrice` | `Decimal?` | @db.Decimal(18, 2) | Optional: purchase option price |
| `purchaseOptionCertain` | `Boolean` | @default(false) | Whether purchase option is reasonably certain to be exercised |
| `renewalOptions` | `String?` | @db.Text | Renewal option details (JSON) |
| `notes` | `String?` | @db.Text | — |
| `companyId` | `String?` | — | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `leasePayment` | [`LeasePayment`](#leasepayment) | many | _back-reference_ | — |
| `leaseJournalEntry` | [`LeaseJournalEntry`](#leasejournalentry) | many | _back-reference_ | — |

**Referenced by:** [`Company`](#company).`lease` · [`LeaseJournalEntry`](#leasejournalentry).`lease` · [`LeasePayment`](#leasepayment).`lease`

**Indexes**

- index `[companyId]`
- index `[status]`
- index `[commencementDate]`

### LeaseJournalEntry

_Table `lease_journal_entry` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `leaseId` | `String` | — | — |
| `entryType` | `String` | @db.VarChar(50) | INITIAL_RECOGNITION \| MONTHLY_PAYMENT \| DEPRECIATION \| TERMINATION \| MODIFICATION |
| `period` | `String` | @db.VarChar(7) | — |
| `amount` | `Decimal` | @db.Decimal(18, 2) | — |
| `journalEntryId` | `String?` | @db.VarChar(36) | — |
| `description` | `String?` | @db.VarChar(500) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `lease` | [`Lease`](#lease) | one | `leaseId` → `id` | Cascade |

**Referenced by:** [`Lease`](#lease).`leaseJournalEntry`

**Indexes**

- index `[leaseId]`
- index `[period]`

### LeaseModification

_Table `lease_modification` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `leaseId` | `String` | — | — |
| `effectiveDate` | `DateTime` | — | — |
| `modificationType` | `LeaseModificationType` | — | — |
| `classificationRationale` | `String` | — | — |
| `oldLiability` | `Decimal` | @db.Decimal(15, 2) | — |
| `newLiability` | `Decimal` | @db.Decimal(15, 2) | — |
| `oldRouAsset` | `Decimal` | @db.Decimal(15, 2) | — |
| `newRouAsset` | `Decimal` | @db.Decimal(15, 2) | — |
| `approverId` | `String?` | — | — |
| `status` | `ModificationStatus` | @default(PENDING) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `remeasurementJournals` | [`RemeasurementJournal`](#remeasurementjournal) | many | _back-reference_ | — |

**Referenced by:** [`RemeasurementJournal`](#remeasurementjournal).`modification`

**Indexes**

- index `[leaseId]`

### LeasePayment

_Table `lease_payment` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `leaseId` | `String` | — | — |
| `period` | `String` | @db.VarChar(7) | Payment period (YYYY-MM) |
| `paymentDate` | `DateTime` | — | — |
| `totalPayment` | `Decimal` | @db.Decimal(18, 2) | — |
| `principalPortion` | `Decimal` | @db.Decimal(18, 2) | — |
| `interestPortion` | `Decimal` | @db.Decimal(18, 2) | — |
| `openingLiability` | `Decimal` | @db.Decimal(18, 2) | — |
| `closingLiability` | `Decimal` | @db.Decimal(18, 2) | — |
| `rouDepreciation` | `Decimal` | @db.Decimal(18, 2) | — |
| `status` | `String` | @default("SCHEDULED") @db.VarChar(20) | SCHEDULED \| PAID \| OVERDUE |
| `paidAt` | `DateTime?` | — | — |
| `journalEntryId` | `String?` | @db.VarChar(36) | — |
| `notes` | `String?` | @db.VarChar(500) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `lease` | [`Lease`](#lease) | one | `leaseId` → `id` | Cascade |

**Referenced by:** [`Lease`](#lease).`leasePayment`

**Indexes**

- index `[leaseId]`
- index `[period]`
- index `[status]`

### Leave

_Table `leave` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `employeeId` | `String` | — | — |
| `type` | `LeaveType` | — | — |
| `startDate` | `DateTime` | — | — |
| `endDate` | `DateTime` | — | — |
| `reason` | `String?` | — | — |
| `status` | `LeaveStatus` | @default(PENDING) | — |
| `approvedBy` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `employee` | [`Employee`](#employee) | one | `employeeId` → `id` | Cascade |

**Referenced by:** [`Employee`](#employee).`leave`

**Indexes**

- index `[employeeId]`
- index `[status, startDate, endDate]`

### LedgerEntry

_Table `ledgerentry` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `journalEntryId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `accountId` | `String` | — | — |
| `debit` | `Decimal` | @default(0.0) | — |
| `credit` | `Decimal` | @default(0.0) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `journalEntry` | [`JournalEntry`](#journalentry) | one | `journalEntryId` → `id` | Cascade |
| `account` | [`Account`](#account) | one | `accountId` → `id` | — |

**Referenced by:** [`Account`](#account).`ledgerEntries` · [`Company`](#company).`ledgerEntries` · [`JournalEntry`](#journalentry).`ledgerEntries`

**Indexes**

- index `[companyId]`
- index `[journalEntryId]`
- index `[accountId]`

### LedgerMappingRule

_Table `ledgermappingrule` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `name` | `String` | @db.VarChar(200) | — |
| `priority` | `Int` | @default(100) | — |
| `isActive` | `Boolean` | @default(true) | — |
| `matchType` | `String` | @db.VarChar(20) | — |
| `matchValue` | `String` | @db.VarChar(500) | — |
| `debitAccountId` | `String` | — | — |
| `creditAccountId` | `String` | — | — |
| `taxType` | `String?` | @db.VarChar(50) | — |
| `costCenterId` | `String?` | — | — |
| `description` | `String?` | @db.Text | — |
| `minAmount` | `Decimal?` | @db.Decimal(18, 2) | — |
| `maxAmount` | `Decimal?` | @db.Decimal(18, 2) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`ledgerMappingRules`

**Indexes**

- index `[companyId]`
- index `[companyId, isActive]`
- index `[matchType]`

### LetterOfCredit

_Table `letter_of_credit` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `lcNumber` | `String` | @unique @db.VarChar(100) | Unique L/C reference number assigned by issuing bank |
| `status` | `String` | @default("DRAFT") @db.VarChar(20) | DRAFT \| ISSUED \| AMENDED \| UTILISED \| EXPIRED \| CANCELLED |
| `vendorId` | `String?` | — | — |
| `vendorName` | `String?` | @db.VarChar(200) | — |
| `purchaseOrderId` | `String?` | — | — |
| `purchaseOrderNumber` | `String?` | @db.VarChar(100) | — |
| `issuingBank` | `String` | @db.VarChar(200) | Issuing bank (importer's bank) |
| `issuingBankBranch` | `String?` | @db.VarChar(200) | — |
| `issuingBankCountry` | `String?` | @db.VarChar(3) | — |
| `advisingBank` | `String?` | @db.VarChar(200) | Advising bank (supplier's bank) |
| `advisingBankBranch` | `String?` | @db.VarChar(200) | — |
| `advisingBankCountry` | `String?` | @db.VarChar(3) | — |
| `amount` | `Decimal` | @default(0) @db.Decimal(18, 2) | Amount and currency |
| `currencyCode` | `String` | @default("USD") @db.VarChar(3) | — |
| `issueDate` | `DateTime?` | — | Dates |
| `expiryDate` | `DateTime?` | — | — |
| `latestShipmentDate` | `DateTime?` | — | — |
| `partialShipments` | `String?` | @db.VarChar(50) | Shipment details |
| `transshipmentAllowed` | `Boolean` | @default(false) | — |
| `portOfLoading` | `String?` | @db.VarChar(100) | — |
| `portOfDischarge` | `String?` | @db.VarChar(100) | — |
| `incoterm` | `String?` | @db.VarChar(20) | — |
| `goodsDescription` | `String?` | @db.VarChar(500) | Commodity / HS code |
| `hsCode` | `String?` | @db.VarChar(20) | — |
| `amendmentCount` | `Int` | @default(0) | Amendment tracking |
| `amendmentHistory` | `String?` | @db.LongText | — |
| `customsDeclarationIds` | `String?` | @db.LongText | Linked customs declarations |
| `shipmentIds` | `String?` | @db.LongText | Linked shipments |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[vendorId]`
- index `[status]`
- index `[expiryDate]`

### LoanRepayment

_Table `loanrepayment` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `loanId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `amount` | `Decimal` | — | — |
| `paidAt` | `DateTime` | @default(now()) | — |
| `method` | `String` | @default("BANK_TRANSFER") | — |
| `reference` | `String?` | @db.VarChar(200) | — |
| `notes` | `String?` | @db.VarChar(500) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `businessLoan` | [`BusinessLoan`](#businessloan) | one | `loanId` → `id` | Cascade |

**Referenced by:** [`BusinessLoan`](#businessloan).`loanRepayment`

**Indexes**

- index `[companyId]`
- index `[loanId]`

### LoanRequest

_Table `loanrequest` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `employeeId` | `String` | — | — |
| `category` | `String` | @default("LOAN") | LOAN \| ADVANCE \| RECRUITMENT_ADVANCE |
| `amount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `installments` | `Int` | @default(1) | — |
| `interestRate` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `startDate` | `DateTime?` | — | — |
| `monthlyDeduction` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `paidAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `remainingBalance` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `purpose` | `String?` | @db.Text | — |
| `candidateName` | `String?` | @db.VarChar(200) | Candidate name for RECRUITMENT_ADVANCE (external candidate, not yet an employee) |
| `remarks` | `String?` | @db.VarChar(500) | — |
| `status` | `String` | @default("PENDING") | — |
| `approvedBy` | `String?` | — | — |
| `approvedAt` | `DateTime?` | — | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `employee` | [`Employee`](#employee) | one | `employeeId` → `id` | — |

**Referenced by:** [`Company`](#company).`loanRequest` · [`Employee`](#employee).`loanRequest`

**Indexes**

- index `[companyId]`
- index `[employeeId]`
- index `[category]`

### LossUtilization

_Table `loss_utilization` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `lossId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `utilizationYear` | `Int` | — | The BIT filing year in which this loss was utilized as a deduction |
| `amountUtilized` | `Decimal` | @db.Decimal(18, 2) | — |
| `incomeTaxFilingId` | `String?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `loss` | [`TaxLossCarryforward`](#taxlosscarryforward) | one | `lossId` → `id` | Cascade |

**Referenced by:** [`TaxLossCarryforward`](#taxlosscarryforward).`utilizations`

**Indexes**

- index `[lossId]`
- index `[companyId]`

### LoyaltyRedemption

_Table `loyaltyredemption` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `transactionId` | `String` | @unique(map: "LoyaltyRedemption_transactionId_key") | — |
| `rewardId` | `String` | — | — |
| `quantity` | `Int` | @default(1) | — |
| `status` | `String` | @default("PENDING") | — |
| `notes` | `String?` | — | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `customerLoyaltyId` | `String?` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `customerLoyalty` | [`CustomerLoyalty`](#customerloyalty) | optional one | `customerLoyaltyId` → `id` | — |
| `reward` | [`Reward`](#reward) | one | `rewardId` → `id` | — |
| `loyaltyTransaction` | [`LoyaltyTransaction`](#loyaltytransaction) | one | `transactionId` → `id` | — |

**Referenced by:** [`CustomerLoyalty`](#customerloyalty).`loyaltyRedemption` · [`LoyaltyTransaction`](#loyaltytransaction).`loyaltyRedemption` · [`Reward`](#reward).`loyaltyRedemption`

**Indexes**

- index `[customerLoyaltyId]`
- index `[rewardId]`
- index `[transactionId]`

### LoyaltyTierConfig

_Table `loyaltytierconfig` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `tier` | `LoyaltyTierLevel` | — | — |
| `minPoints` | `BigInt` | @default(0) | — |
| `maxPoints` | `BigInt?` | — | — |
| `benefits` | `String` | @db.Text | — |
| `multiplier` | `Float` | @default(1) | — |
| `isActive` | `Boolean` | @default(true) | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `customerLoyalty` | [`CustomerLoyalty`](#customerloyalty) | many | _back-reference_ | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`loyaltyTierConfig` · [`CustomerLoyalty`](#customerloyalty).`loyaltyTierConfig`

**Indexes**

- unique `[companyId, tier]`
- index `[companyId]`

### LoyaltyTransaction

_Table `loyaltytransaction` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `customerLoyaltyId` | `String` | — | — |
| `type` | `LoyaltyTransactionType` | — | — |
| `points` | `BigInt` | — | — |
| `reason` | `String` | @db.VarChar(200) | — |
| `referenceId` | `String?` | @db.VarChar(100) | — |
| `fraudScore` | `Float` | @default(0) | — |
| `status` | `LoyaltyTransactionStatus` | @default(OK) | — |
| `metadata` | `String?` | @db.LongText | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `loyaltyRedemption` | [`LoyaltyRedemption`](#loyaltyredemption) | optional one | _back-reference_ | — |
| `customerLoyalty` | [`CustomerLoyalty`](#customerloyalty) | one | `customerLoyaltyId` → `id` | Cascade |

**Referenced by:** [`CustomerLoyalty`](#customerloyalty).`loyaltyTransaction` · [`LoyaltyRedemption`](#loyaltyredemption).`loyaltyTransaction`

**Indexes**

- index `[companyId]`
- index `[customerLoyaltyId]`
- index `[status]`

### Module

Canonical application modules (composable business capabilities). Each module represents a functional area that can be enabled per-company.

_Table `module` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `key` | `String` | @unique @db.VarChar(50) | — |
| `name` | `String` | @db.VarChar(100) | — |
| `description` | `String?` | @db.VarChar(200) | — |
| `icon` | `String?` | @db.VarChar(50) | — |
| `sortOrder` | `Int` | @default(0) | — |
| `isActive` | `Boolean` | @default(true) | — |
| `isCore` | `Boolean` | @default(false) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `companyModules` | [`CompanyModule`](#companymodule) | many | _back-reference_ | — |

**Referenced by:** [`CompanyModule`](#companymodule).`module`

**Indexes**

- index `[sortOrder]`

### ModuleManifest

_Table `module_manifest` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | @unique @db.VarChar(100) | — |
| `displayName` | `String` | @db.VarChar(200) | — |
| `version` | `String` | @db.VarChar(50) | — |
| `description` | `String?` | @db.Text | — |
| `author` | `String?` | @db.VarChar(200) | — |
| `category` | `String?` | @db.VarChar(100) | — |
| `icon` | `String?` | @db.VarChar(100) | — |
| `isCore` | `Boolean` | @default(false) | — |
| `dependsOn` | `String?` | @db.Text | — |
| `migrations` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Indexes**

- index `[name]`

### ModuleSetting

_Table `module_setting` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `moduleName` | `String` | @db.VarChar(100) | — |
| `key` | `String` | @db.VarChar(200) | — |
| `value` | `String?` | @db.LongText | — |
| `type` | `String` | @default("text") @db.VarChar(50) | — |
| `group` | `String?` | @db.VarChar(100) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`moduleSettings`

**Indexes**

- unique `[companyId, moduleName, key]`
- index `[companyId]`
- index `[moduleName]`

### ModuleVersion

_Table `module_version` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `moduleName` | `String` | @db.VarChar(100) | — |
| `version` | `String` | @db.VarChar(50) | — |
| `isCore` | `Boolean` | @default(false) | — |
| `changelog` | `String?` | @db.Text | — |
| `downloadUrl` | `String?` | @db.VarChar(500) | — |
| `releasedAt` | `DateTime` | @default(now()) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Indexes**

- unique `[moduleName, version]`
- index `[moduleName]`

### MonetizationEntitlement

Effective entitlement cache — recomputed on every subscription/purchase/trial change. The guard reads this table for O(1) access checks.

_Table `monetization_entitlement` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `featureKey` | `String` | @db.VarChar(200) | The feature key being granted (e.g. "feature:gl", "plan:business") |
| `source` | `String` | @db.VarChar(20) | SUBSCRIPTION \| LIFETIME \| TRIAL |
| `expiresAt` | `DateTime?` | — | NULL for LIFETIME grants; set for time-bounded grants |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`monetizationEntitlement`

**Indexes**

- unique `[companyId, featureKey]`
- index `[companyId]`
- index `[featureKey]`
- index `[expiresAt]`

### MonetizationProduct

A product/plan that can be sold (e.g. "Business Plan", "Enterprise Add-on")

_Table `monetization_product` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | @db.VarChar(200) | Human-readable name shown in the UI |
| `slug` | `String` | @unique @db.VarChar(100) | Slug used as the featureKey prefix (e.g. "plan:business") |
| `type` | `String` | @default("SUBSCRIPTION") @db.VarChar(20) | SUBSCRIPTION \| LIFETIME \| ADDON |
| `featureKeys` | `String` | @db.LongText | JSON array of feature keys this product grants e.g. ["feature:gl","feature:payroll","feature:ocr"] |
| `priceMonthly` | `Decimal` | @default(0) @db.Decimal(18, 2) | Price in ETB (monthly for subscriptions) |
| `priceAnnual` | `Decimal` | @default(0) @db.Decimal(18, 2) | Price in ETB (annual for subscriptions) |
| `priceLifetime` | `Decimal` | @default(0) @db.Decimal(18, 2) | One-time price for LIFETIME type |
| `trialDays` | `Int` | @default(14) | Trial duration in days (0 = no trial) |
| `isActive` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `subscriptions` | [`MonetizationSubscription`](#monetizationsubscription) | many | _back-reference_ | — |
| `purchases` | [`MonetizationPurchase`](#monetizationpurchase) | many | _back-reference_ | — |
| `trials` | [`MonetizationTrial`](#monetizationtrial) | many | _back-reference_ | — |

**Referenced by:** [`MonetizationPurchase`](#monetizationpurchase).`product` · [`MonetizationSubscription`](#monetizationsubscription).`product` · [`MonetizationTrial`](#monetizationtrial).`product`

### MonetizationPurchase

One-time lifetime purchase (non-expiring)

_Table `monetization_purchase` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `productId` | `String` | — | — |
| `status` | `String` | @default("COMPLETED") @db.VarChar(20) | COMPLETED \| REFUNDED \| DISPUTED |
| `amountPaid` | `Decimal` | @db.Decimal(18, 2) | — |
| `providerRef` | `String?` | @db.VarChar(200) | — |
| `receiptUrl` | `String?` | @db.VarChar(500) | — |
| `refundedAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | — |
| `product` | [`MonetizationProduct`](#monetizationproduct) | one | `productId` → `id` | — |

**Referenced by:** [`Company`](#company).`monetizationPurchase` · [`MonetizationProduct`](#monetizationproduct).`purchases`

**Indexes**

- index `[companyId]`
- index `[status]`

### MonetizationSubscription

Active or historical subscription for a company

_Table `monetization_subscription` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `productId` | `String` | — | — |
| `billingCycle` | `String` | @default("MONTHLY") @db.VarChar(10) | MONTHLY \| ANNUAL |
| `status` | `String` | @default("ACTIVE") @db.VarChar(20) | ACTIVE \| PAST_DUE \| CANCELLED \| EXPIRED \| PAUSED |
| `currentPeriodStart` | `DateTime` | — | When the current billing period started |
| `currentPeriodEnd` | `DateTime` | — | When the current billing period ends (access revoked after this) |
| `providerRef` | `String?` | @db.VarChar(200) | External payment provider reference (Stripe, Chapa, etc.) |
| `providerSubId` | `String?` | @db.VarChar(200) | Provider-specific subscription ID |
| `cancelledAt` | `DateTime?` | — | — |
| `cancelReason` | `String?` | @db.VarChar(500) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | — |
| `product` | [`MonetizationProduct`](#monetizationproduct) | one | `productId` → `id` | — |

**Referenced by:** [`Company`](#company).`monetizationSubscription` · [`MonetizationProduct`](#monetizationproduct).`subscriptions`

**Indexes**

- index `[companyId]`
- index `[status]`
- index `[currentPeriodEnd]`

### MonetizationTrial

Free trial grant for a company

_Table `monetization_trial` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `productId` | `String` | — | — |
| `startsAt` | `DateTime` | @default(now()) | — |
| `endsAt` | `DateTime` | — | — |
| `status` | `String` | @default("ACTIVE") @db.VarChar(20) | ACTIVE \| EXPIRED \| CONVERTED (converted = upgraded to paid) |
| `convertedAt` | `DateTime?` | — | — |
| `restrictionConfig` | `String?` | @db.Text | §4.2 Trial restriction config JSON: { mode, maxDocuments, maxSkus, maxUsers, maxBranches, lockedFeatures[] } |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | — |
| `product` | [`MonetizationProduct`](#monetizationproduct) | one | `productId` → `id` | — |

**Referenced by:** [`Company`](#company).`monetizationTrial` · [`MonetizationProduct`](#monetizationproduct).`trials`

**Indexes**

- unique `[companyId, productId]`
- index `[companyId]`
- index `[status]`
- index `[endsAt]`

### MorAcknowledgementReceipt

MoR Acknowledgement Receipt Vault — stores official ERCA acknowledgement receipts Provides immutable audit trail and legal proof of tax submission

_Table `mor_acknowledgement_receipt` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `submissionRecordId` | `String?` | @db.VarChar(36) | — |
| `submissionType` | `String` | @default("VAT_RETURN") @db.VarChar(30) | VAT_RETURN \| TOT_RETURN \| PAYE \| WHT \| BIT_PROVISIONAL \| CUSTOMS_DECLARATION |
| `receiptNumber` | `String?` | @db.VarChar(100) | Official ERCA receipt number |
| `receiptDate` | `DateTime?` | — | — |
| `period` | `String?` | @db.VarChar(7) | Tax period in YYYY-MM format |
| `ackXml` | `String?` | @db.LongText | Raw ERCA acknowledgement XML |
| `ackPdf` | `String?` | @db.LongText | Base64 encoded PDF receipt |
| `ackPayload` | `String?` | @db.LongText | Canonical JSON payload used as the SHA-256 `documentHash` input (tamper-evident) |
| `verificationStatus` | `String` | @default("PENDING") @db.VarChar(20) | PENDING \| VERIFIED \| FAILED |
| `verificationMethod` | `String?` | @db.VarChar(30) | XML_SIGNATURE \| QR_CODE \| MANUAL |
| `documentHash` | `String?` | @db.VarChar(64) | SHA-256 hash of receipt for integrity verification |
| `downloadUrl` | `String?` | @db.VarChar(500) | Download URL for the receipt PDF |
| `submittedBy` | `String?` | @db.VarChar(100) | — |
| `verifiedAt` | `DateTime?` | — | — |
| `verifiedBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[submissionRecordId]`
- index `[receiptNumber]`
- index `[period]`
- index `[verificationStatus]`

### MultiCurrencyException

_Table `multi_currency_exception` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `bankAccountId` | `String` | — | — |
| `transactionId` | `String` | — | — |
| `transactionCurrency` | `String` | @db.VarChar(3) | — |
| `accountCurrency` | `String` | @db.VarChar(3) | — |
| `transactionAmount` | `Decimal` | — | — |
| `thresholdImbalance` | `Boolean` | @default(false) | — |
| `status` | `String` | @default("FLAGGED") @db.VarChar(50) | — |
| `resolvedAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`multiCurrencyExceptions`

**Indexes**

- index `[companyId]`
- index `[transactionId]`

### NetTaxPayableReport

_Table `net_tax_payable_report` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `period` | `String` | @db.VarChar(7) | YYYY-MM for monthly reports; YYYY for annual |
| `reportType` | `String` | @default("MONTHLY") @db.VarChar(10) // MONTHLY \| ANNUAL | — |
| `vatOutputCollected` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `vatInputClaimable` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `vatNetPayable` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `totGoodsPayable` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `totServicesPayable` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `totNetPayable` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `whtOnGoods` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `whtOnServices` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `whtOnDividends` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `whtOnInterest` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `whtOnNonResident` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `whtTotalToRemit` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `payePitWithheld` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `payeDrrf` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `payeNetPayableErca` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `pensionEmployee` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `pensionEmployer` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `pensionTotalPfsa` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `graduateTaxDeducted` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `graduateTaxToRemit` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `exciseTaxDue` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `stampDutyDue` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `scheduleDDividend` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `scheduleDInterest` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `scheduleDCapitalGains` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `scheduleDRoyalties` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `scheduleDOther` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `scheduleDTotal` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `drrfLevyDue` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `bitProvisionalDue` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `bitProvisionalPaid` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `grandTotalPayable` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `grandTotalPaid` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `grandTotalOutstanding` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `status` | `String` | @default("DRAFT") @db.VarChar(20) | DRAFT \| FINALISED \| SUBMITTED_TO_MOR |
| `generatedAt` | `DateTime` | @default(now()) | — |
| `finalisedAt` | `DateTime?` | — | — |
| `submittedAt` | `DateTime?` | — | — |
| `ercaReferenceNo` | `String?` | @db.VarChar(100) | — |
| `notes` | `String?` | @db.Text | — |
| `generatedBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- unique `[companyId, period, reportType]`
- index `[companyId]`
- index `[period]`
- index `[status]`

### Notification

_Table `notification` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `employeeId` | `String?` | — | — |
| `companyId` | `String?` | — | — |
| `userId` | `String?` | — | — |
| `type` | `NotificationType` | @default(INFO) | — |
| `title` | `String` | @db.VarChar(200) | — |
| `message` | `String` | @db.Text | — |
| `isRead` | `Boolean` | @default(false) | — |
| `link` | `String?` | @db.VarChar(500) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `employee` | [`Employee`](#employee) | optional one | `employeeId` → `id` | — |

**Referenced by:** [`Company`](#company).`notifications` · [`Employee`](#employee).`notification`

**Indexes**

- index `[companyId]`
- index `[employeeId]`
- index `[userId]`

### NotificationCampaign

_Table `notificationcampaign` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `name` | `String` | @db.VarChar(200) | — |
| `templateId` | `String?` | — | — |
| `type` | `String` | @default("EMAIL") | — |
| `title` | `String` | @db.VarChar(300) | — |
| `targets` | `String?` | @db.LongText | — |
| `scheduledAt` | `DateTime?` | — | — |
| `status` | `String` | @default("DRAFT") | — |
| `sentAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`notificationCampaigns`

**Indexes**

- index `[companyId]`

### NotificationTemplate

_Table `notificationtemplate` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `subject` | `String` | @db.VarChar(300) | — |
| `body` | `String` | @db.LongText | — |
| `variables` | `String?` | @db.LongText | — |
| `type` | `String` | @default("EMAIL") | — |
| `isActive` | `Boolean` | @default(true) | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`notificationTemplate`

**Indexes**

- unique `[name, companyId]`

### OcrExtraction

_Table `ocr_extraction` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `receiptUrl` | `String` | @db.VarChar(500) | — |
| `sourceType` | `String` | @db.VarChar(50) | — |
| `sourceId` | `String` | @db.VarChar(36) | — |
| `companyId` | `String?` | — | — |
| `extractedText` | `String?` | @db.LongText | — |
| `vendorName` | `String?` | @db.VarChar(200) | — |
| `amount` | `Decimal?` | — | — |
| `taxAmount` | `Decimal?` | — | — |
| `date` | `String?` | @db.VarChar(50) | — |
| `status` | `String` | @default("PENDING") @db.VarChar(50) | — |
| `extractedAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`ocrExtractions`

**Indexes**

- index `[sourceType, sourceId]`
- index `[receiptUrl]`

### OfflineDeviceRegistry

Registered offline devices for regulated sectors. Tracks which devices are enrolled for offline resilience per company.

_Table `offline_device_registry` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `deviceId` | `String` | @unique @db.VarChar(100) | — |
| `deviceName` | `String` | @db.VarChar(200) | — |
| `deviceType` | `String` | @default("DESKTOP") @db.VarChar(30) | — |
| `companyId` | `String?` | — | — |
| `lastSyncAt` | `DateTime?` | — | — |
| `pendingCount` | `Int` | @default(0) | — |
| `isOnline` | `Boolean` | @default(true) | — |
| `registeredAt` | `DateTime` | @default(now()) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`offlineDeviceRegistry`

**Indexes**

- index `[companyId]`
- index `[deviceId]`

### OfflineInvoiceQueue

_Table `offline_invoice_queue` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `invoiceData` | `String` | @db.LongText | — |
| `status` | `String` | @default("PENDING") @db.VarChar(20) | — |
| `deviceId` | `String?` | @db.VarChar(100) | — |
| `fiscalYear` | `String?` | @db.VarChar(10) | — |
| `sequenceNumber` | `Int?` | — | — |
| `syncAttempts` | `Int` | @default(0) | — |
| `lastSyncAttempt` | `DateTime?` | — | — |
| `syncError` | `String?` | @db.VarChar(1000) | — |
| `syncedAt` | `DateTime?` | — | — |
| `invoiceId` | `String?` | @db.VarChar(36) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |
| `operationType` | `String?` | @db.VarChar(50) | SyncOperationType enum value (e.g. INVOICE_CREATE, TAX_FILING_SYNC) |
| `documentReference` | `String?` | @db.VarChar(255) | Canonical document reference used for idempotency (e.g. invoice ID or IRN) |
| `checksum` | `String?` | @db.VarChar(100) | SHA-256 checksum of the operation payload for tamper-detection |
| `idempotencyKey` | `String?` | @unique @db.VarChar(255) | Idempotency key — prevents double-processing on replay |
| `engineSource` | `String?` | @db.VarChar(20) | Source reconciliation engine (LEGACY \| OVDS \| UNIFIED) |
| `expiresAt` | `DateTime?` | — | ISO-8601 expiry timestamp — entries past this are pruned |
| `retryCount` | `Int` | @default(0) | Retry attempt counter for the SyncEngine retry loop |
| `lastError` | `String?` | @db.VarChar(1000) | Last error message from the push transport |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`offlineInvoiceQueue`

**Indexes**

- index `[companyId]`
- index `[status]`
- index `[deviceId]`
- index `[fiscalYear]`
- index `[syncedAt]`
- index `[operationType]`
- index `[checksum]`

### OnboardingResponse

_Table `onboardingresponse` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `userId` | `String?` | — | — |
| `step` | `String` | @db.VarChar(100) | — |
| `data` | `String` | @db.LongText | — |
| `status` | `String` | @default("PENDING") | — |
| `contactName` | `String?` | @db.VarChar(200) | — |
| `contactEmail` | `String?` | — | — |
| `contactPhone` | `String?` | @db.VarChar(50) | — |
| `businessName` | `String?` | @db.VarChar(200) | — |
| `industry` | `String?` | @db.VarChar(100) | — |
| `mainGoals` | `String?` | @db.Text | — |
| `topChallenges` | `String?` | @db.Text | — |
| `valueProposition` | `String?` | @db.Text | — |
| `desiredTimeline` | `String?` | @db.VarChar(100) | — |
| `preferredContact` | `String?` | @db.VarChar(50) | — |
| `internalNotes` | `String?` | @db.Text | — |
| `assignedTo` | `String?` | @db.VarChar(100) | — |
| `address` | `String?` | @db.Text | — |
| `website` | `String?` | @db.VarChar(500) | — |
| `budget` | `Decimal?` | — | — |
| `timezone` | `String?` | @db.VarChar(50) | — |
| `socialMedia` | `String?` | @db.LongText | — |
| `successDefinition` | `String?` | @db.Text | — |
| `idealCustomerProfile` | `String?` | @db.Text | — |
| `mainCompetitors` | `String?` | @db.Text | — |
| `currentBlockers` | `String?` | @db.Text | — |
| `usp` | `String?` | @db.Text | — |
| `kpis` | `String?` | @db.Text | — |
| `hasLogo` | `Boolean` | @default(false) | — |
| `existingMaterials` | `String?` | @db.Text | — |
| `updateFrequency` | `String?` | @db.VarChar(100) | — |
| `brandLove` | `String?` | @db.Text | — |
| `submittedBy` | `String?` | @db.VarChar(100) | — |
| `completedAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[status]`
- index `[userId]`

### OtaUpdateJob

OTA (Over-The-Air) firmware update jobs

_Table `ota_update_job` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `deviceId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `targetVersion` | `String` | @db.VarChar(50) | — |
| `fromVersion` | `String?` | @db.VarChar(50) | — |
| `packageUrl` | `String?` | @db.VarChar(500) | Package download URL or MQTT topic payload |
| `status` | `String` | @default("PENDING") @db.VarChar(20) | PENDING \| IN_PROGRESS \| SUCCESS \| FAILED \| ROLLED_BACK \| CANCELLED |
| `progress` | `Int` | @default(0) | Progress percentage 0–100 |
| `scheduledAt` | `DateTime?` | — | — |
| `startedAt` | `DateTime?` | — | — |
| `completedAt` | `DateTime?` | — | — |
| `errorMessage` | `String?` | @db.VarChar(1000) | — |
| `rollbackReason` | `String?` | @db.VarChar(500) | — |
| `initiatedBy` | `String?` | @db.VarChar(100) | — |
| `releaseNotes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `device` | [`IotDevice`](#iotdevice) | one | `deviceId` → `id` | Cascade |

**Referenced by:** [`IotDevice`](#iotdevice).`otaJobs`

**Indexes**

- index `[deviceId]`
- index `[status]`
- index `[companyId]`

### OtherPayment

_Table `otherpayment` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `employeeId` | `String` | — | — |
| `headId` | `String?` | — | — |
| `head` | `String?` | @db.VarChar(100) | — |
| `diaryNo` | `String?` | @db.VarChar(50) | — |
| `taxable` | `Boolean` | @default(false) | — |
| `approvedBy` | `String?` | @db.VarChar(100) | — |
| `amount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `status` | `String` | @default("PENDING") | — |
| `year` | `Int` | — | — |
| `month` | `Int` | — | — |
| `notes` | `String?` | @db.VarChar(500) | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `employee` | [`Employee`](#employee) | one | `employeeId` → `id` | — |

**Referenced by:** [`Company`](#company).`otherPayment` · [`Employee`](#employee).`otherPayment`

**Indexes**

- index `[companyId]`
- index `[employeeId]`

### OtherPaymentHead

_Table `otherpaymenthead` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | @unique(map: "OtherPaymentHead_name_key") | — |
| `shortCode` | `String` | @default("") @db.VarChar(20) | — |
| `isTaxable` | `Boolean` | @default(false) | — |
| `taxable` | `Boolean` | @default(false) | — |
| `isActive` | `Boolean` | @default(true) | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`otherPaymentHead`

**Indexes**

- index `[companyId]`

### OtpCode

_Table `otp_code` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `userId` | `String?` | @db.VarChar(36) | — |
| `email` | `String?` | @db.VarChar(255) | — |
| `code` | `String` | @db.VarChar(6) | — |
| `purpose` | `String` | @db.VarChar(30) | — |
| `status` | `String` | @default("PENDING") @db.VarChar(20) | PENDING \| VERIFIED \| EXPIRED |
| `expiresAt` | `DateTime` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Indexes**

- index `[email]`
- index `[userId]`
- index `[purpose]`
- index `[status]`

### OutboxEvent

_Table `outbox_event` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `type` | `String` | — | — |
| `aggregateType` | `String?` | @db.VarChar(50) | — |
| `aggregateId` | `String?` | @db.VarChar(36) | — |
| `companyId` | `String?` | @db.VarChar(36) | — |
| `idempotencyKey` | `String?` | @db.VarChar(150) | Used for deduping retries and preventing double submissions |
| `payload` | `String` | @db.LongText | Arbitrary worker inputs (e.g. { filingId, companyId }) |
| `status` | `String` | @default("PENDING") @db.VarChar(30) | — |
| `attempts` | `Int` | @default(0) | — |
| `maxAttempts` | `Int` | @default(10) | — |
| `availableAt` | `DateTime` | @default(now()) | — |
| `lastError` | `String?` | @db.VarChar(1000) | — |
| `processedAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- unique `[type, idempotencyKey]`
- index `[status, availableAt]`
- index `[companyId]`

### Partnership

_Table `partnership` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `type` | `String` | @default("STRATEGIC_ALLIANCE") | — |
| `status` | `String` | @default("ACTIVE") | — |
| `startDate` | `DateTime?` | — | — |
| `endDate` | `DateTime?` | — | — |
| `description` | `String?` | @db.Text | — |
| `tin` | `String?` | @db.VarChar(50) | — |
| `tinNumber` | `String?` | @db.VarChar(50) | — |
| `licenseNumber` | `String?` | @db.VarChar(100) | — |
| `contactName` | `String?` | @db.VarChar(200) | — |
| `contactEmail` | `String?` | — | — |
| `contactPhone` | `String?` | @db.VarChar(50) | — |
| `address` | `String?` | @db.Text | — |
| `agreementRef` | `String?` | @db.VarChar(200) | — |
| `credibilityScore` | `Int` | @default(50) | — |
| `notes` | `String?` | @db.Text | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |
| `amlRiskLevel` | `String?` | @db.VarChar(20) | — |
| `kycStatus` | `String?` | @db.VarChar(20) | — |
| `kycVerifiedAt` | `DateTime?` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `businessLoan` | [`BusinessLoan`](#businessloan) | many | _back-reference_ | — |
| `investment` | [`Investment`](#investment) | many | _back-reference_ | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `partnershipCustomer` | [`PartnershipCustomer`](#partnershipcustomer) | many | _back-reference_ | — |
| `partnershipMember` | [`PartnershipMember`](#partnershipmember) | many | _back-reference_ | — |

**Referenced by:** [`BusinessLoan`](#businessloan).`partnership` · [`Company`](#company).`partnership` · [`Investment`](#investment).`partnership` · [`PartnershipCustomer`](#partnershipcustomer).`partnership` · [`PartnershipMember`](#partnershipmember).`partnership`

**Indexes**

- index `[companyId]`

### PartnershipCustomer

_Table `partnershipcustomer` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `partnershipId` | `String` | — | — |
| `customerId` | `String` | — | — |
| `relationshipType` | `String` | @default("SERVED") | — |
| `since` | `DateTime?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `customer` | [`Customer`](#customer) | one | `customerId` → `id` | — |
| `partnership` | [`Partnership`](#partnership) | one | `partnershipId` → `id` | Cascade |

**Referenced by:** [`Customer`](#customer).`partnershipCustomer` · [`Partnership`](#partnership).`partnershipCustomer`

**Indexes**

- unique `[partnershipId, customerId]`
- index `[customerId]`
- index `[partnershipId]`

### PartnershipMember

_Table `partnershipmember` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `partnershipId` | `String` | — | — |
| `name` | `String` | — | — |
| `role` | `String?` | @db.VarChar(100) | — |
| `ownershipPct` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `contribution` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `joinDate` | `DateTime?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `partnership` | [`Partnership`](#partnership) | one | `partnershipId` → `id` | Cascade |

**Referenced by:** [`Partnership`](#partnership).`partnershipMember`

**Indexes**

- index `[partnershipId]`

### PayeDeclaration

_Table `paye_declaration` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `period` | `String` | @db.VarChar(7) | YYYY-MM — the payroll period being declared |
| `employeeCount` | `Int` | @default(0) | Total number of employees in the period |
| `totalGrossSalary` | `Decimal` | @default(0) @db.Decimal(18, 2) | Total gross salaries for the period |
| `totalPit` | `Decimal` | @default(0) @db.Decimal(18, 2) | Total PIT deducted from employees |
| `totalEmpPension` | `Decimal` | @default(0) @db.Decimal(18, 2) | Total employee pension (7%) |
| `totalEmpRPension` | `Decimal` | @default(0) @db.Decimal(18, 2) | Total employer pension (11%) |
| `totalDrrf` | `Decimal` | @default(0) @db.Decimal(18, 2) | Total DRRF levy (1%) |
| `netPayableErca` | `Decimal` | @default(0) @db.Decimal(18, 2) | Net payable to ERCA (PIT + DRRF only — pension goes to PFSA) |
| `netPayablePfsa` | `Decimal` | @default(0) @db.Decimal(18, 2) | Pension payable to PFSA (employee + employer) |
| `status` | `String` | @default("DRAFT") @db.VarChar(20) | DRAFT \| SUBMITTED \| PAID \| OVERDUE |
| `dueDate` | `DateTime?` | — | — |
| `submittedAt` | `DateTime?` | — | — |
| `ercaReference` | `String?` | @db.VarChar(100) | — |
| `paidAt` | `DateTime?` | — | — |
| `paymentReference` | `String?` | @db.VarChar(200) | — |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- unique `[companyId, period]`
- index `[companyId]`
- index `[period]`
- index `[status]`

### Payment

_Table `payment` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `date` | `DateTime` | — | — |
| `amount` | `Decimal` | — | — |
| `currencyCode` | `String` | @default("ETB") @db.VarChar(3) | — |
| `accountId` | `String?` | // Reference to BankAccount | — |
| `vendorId` | `String?` | — | — |
| `categoryId` | `String?` | — | — |
| `description` | `String?` | @db.Text | — |
| `reference` | `String?` | @db.VarChar(100) | — |
| `companyId` | `String?` | — | — |
| `journalEntryId` | `String?` | @db.VarChar(36) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `vendor` | [`Vendor`](#vendor) | optional one | `vendorId` → `id` | — |
| `category` | [`Category`](#category) | optional one | `categoryId` → `id` | — |
| `bankAccount` | [`BankAccount`](#bankaccount) | optional one | `accountId` → `id` | — |
| `journalEntry` | [`JournalEntry`](#journalentry) | optional one | `journalEntryId` → `id` | — |

**Referenced by:** [`BankAccount`](#bankaccount).`payments` · [`Category`](#category).`payments` · [`Company`](#company).`payment` · [`JournalEntry`](#journalentry).`payments` · [`Vendor`](#vendor).`payments`

**Indexes**

- index `[companyId]`
- index `[vendorId]`
- index `[categoryId]`
- index `[date]`

### PaymentBatch

_Table `paymentbatch` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | @db.VarChar(200) | — |
| `type` | `PaymentType` | @default(VENDOR) | — |
| `status` | `BatchStatus` | @default(DRAFT) | — |
| `totalAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `notes` | `String?` | @db.Text | — |
| `exportedAt` | `DateTime?` | — | — |
| `exportFormat` | `String?` | @db.VarChar(20) | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |
| `paymentRunDate` | `DateTime?` | — | Supplier payment run fields |
| `paymentMethod` | `String?` | @db.VarChar(50) | — |
| `bankAccountId` | `String?` | — | — |
| `approvedBy` | `String?` | @db.VarChar(100) | — |
| `approvedAt` | `DateTime?` | — | — |
| `submittedBy` | `String?` | @db.VarChar(100) | — |
| `submittedAt` | `DateTime?` | — | — |
| `chequeNumber` | `String?` | @db.VarChar(100) | — |
| `paymentReference` | `String?` | @db.VarChar(200) | — |
| `dueDateFrom` | `DateTime?` | — | — |
| `dueDateTo` | `DateTime?` | — | — |
| `includeWht` | `Boolean` | @default(true) | — |
| `minAmount` | `Decimal?` | @db.Decimal(18, 2) | — |
| `maxAmount` | `Decimal?` | @db.Decimal(18, 2) | — |
| `vendorIds` | `String?` | @db.LongText | — |
| `priority` | `String?` | @default("DUE_DATE") @db.VarChar(20) | — |
| `cashDiscount` | `Boolean` | @default(false) | — |
| `cashDiscountPct` | `Decimal?` | @db.Decimal(5, 2) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `paymentBatchItem` | [`PaymentBatchItem`](#paymentbatchitem) | many | _back-reference_ | — |

**Referenced by:** [`Company`](#company).`paymentBatch` · [`PaymentBatchItem`](#paymentbatchitem).`paymentBatch`

**Indexes**

- index `[companyId]`

### PaymentBatchItem

_Table `paymentbatchitem` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `batchId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `billId` | `String?` | — | — |
| `invoiceId` | `String?` | — | — |
| `vendorId` | `String?` | — | — |
| `amount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `notes` | `String?` | @db.VarChar(500) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `paymentMethod` | `String?` | @db.VarChar(50) | Supplier payment run fields |
| `reference` | `String?` | @db.VarChar(200) | — |
| `bankAccountId` | `String?` | — | — |
| `chequeNumber` | `String?` | @db.VarChar(100) | — |
| `dueDate` | `DateTime?` | — | — |
| `isPriority` | `Boolean` | @default(false) | — |
| `cashDiscount` | `Decimal?` | @db.Decimal(18, 2) | — |
| `whtAmount` | `Decimal?` | @default(0) @db.Decimal(18, 2) | — |
| `netPayable` | `Decimal?` | @default(0) @db.Decimal(18, 2) | — |
| `status` | `String?` | @default("PENDING") @db.VarChar(20) | — |
| `paidAt` | `DateTime?` | — | — |
| `vendorName` | `String?` | @db.VarChar(200) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `paymentBatch` | [`PaymentBatch`](#paymentbatch) | one | `batchId` → `id` | Cascade |
| `bill` | [`Bill`](#bill) | optional one | `billId` → `id` | — |
| `invoice` | [`Invoice`](#invoice) | optional one | `invoiceId` → `id` | — |

**Referenced by:** [`Bill`](#bill).`paymentBatchItem` · [`Company`](#company).`paymentBatchItems` · [`Invoice`](#invoice).`paymentBatchItem` · [`PaymentBatch`](#paymentbatch).`paymentBatchItem`

**Indexes**

- index `[companyId]`
- index `[batchId]`
- index `[billId]`
- index `[invoiceId]`

### PayrollDeductionCalculation

_Table `payroll_deduction_calculation` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `year` | `Int` | — | — |
| `month` | `Int` | — | — |
| `totalGross` | `Decimal` | — | — |
| `totalNet` | `Decimal` | — | — |
| `employeeCount` | `Int` | — | — |
| `pitCalculated` | `Boolean` | @default(false) | — |
| `pensionCalculated` | `Boolean` | @default(false) | — |
| `drrfCalculated` | `Boolean` | @default(false) | — |
| `loanDeductionsCalculated` | `Boolean` | @default(false) | — |
| `otherDeductionsCalculated` | `Boolean` | @default(false) | — |
| `calculatedAt` | `DateTime` | @default(now()) | — |
| `calculatedBy` | `String` | @db.VarChar(100) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`payrollDeductionCalculations`

**Indexes**

- unique `[companyId, year, month]`
- index `[companyId]`

### PayrollLine

_Table `payroll_line` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `payrollRecordId` | `String` | — | — |
| `employeeId` | `String` | — | — |
| `head` | `String` | @db.VarChar(100) | — |
| `amount` | `Decimal` | @db.Decimal(18, 2) | — |
| `isDeduction` | `Boolean` | @default(false) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`payrollLines`

**Indexes**

- index `[companyId, payrollRecordId]`
- index `[employeeId]`

### PayrollRecord

_Table `payrollrecord` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `employeeId` | `String` | — | — |
| `year` | `Int` | — | — |
| `month` | `Int` | — | — |
| `type` | `String` | @default("SALARY") | — |
| `basicSalary` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `grossTotal` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `grossPay` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `netPay` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `incomeTax` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `employeePension` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `employerPension` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `loanDeduction` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `totalDeductions` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `otherDeductions` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `otPay` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `approvedBy` | `String?` | @db.VarChar(100) | — |
| `notes` | `String?` | @db.Text | — |
| `workedDays` | `Int` | @default(0) | — |
| `presentDays` | `Int` | @default(0) | — |
| `absentDays` | `Int` | @default(0) | — |
| `workingDays` | `Int` | @default(0) | — |
| `otHours` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `status` | `String` | @default("GENERATED") | — |
| `approvedAt` | `DateTime?` | — | — |
| `companyId` | `String?` | — | — |
| `journalEntryId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `employee` | [`Employee`](#employee) | one | `employeeId` → `id` | — |
| `journalEntry` | [`JournalEntry`](#journalentry) | optional one | `journalEntryId` → `id` | — |

**Referenced by:** [`Company`](#company).`payrollRecord` · [`Employee`](#employee).`payrollRecord` · [`JournalEntry`](#journalentry).`payrollRecord`

**Indexes**

- unique `[employeeId, year, month, type]`
- index `[companyId]`
- index `[year, month]`

### PeachtreeProjectionJournal

_Table `peachtree_projection_journal` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `canonicalJournalEntryId` | `String` | — | — |
| `companyId` | `String` | — | — |
| `projectionEngine` | `ProjectionEngine` | @default(PEACHTREE) | — |
| `adjustedDebit` | `Decimal` | @db.Decimal(15, 2) | — |
| `adjustedCredit` | `Decimal` | @db.Decimal(15, 2) | — |
| `reconciliationAdjustmentCode` | `ReconciliationAdjustmentCode` | @default(DEFAULT) | — |
| `reconciledAt` | `DateTime` | @default(now()) | — |

**Indexes**

- index `[canonicalJournalEntryId]`
- index `[companyId]`
- index `[reconciledAt]`

### PensionRemittance

_Table `pension_remittance` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `period` | `String` | @db.VarChar(7) | YYYY-MM — payroll period |
| `employeeCount` | `Int` | @default(0) | — |
| `totalInsurableEarnings` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `employeeContrib` | `Decimal` | @default(0) @db.Decimal(18, 2) // 7% | — |
| `employerContrib` | `Decimal` | @default(0) @db.Decimal(18, 2) // 11% | — |
| `totalContrib` | `Decimal` | @default(0) @db.Decimal(18, 2) // 18% | — |
| `status` | `String` | @default("DRAFT") @db.VarChar(20) | DRAFT \| SUBMITTED \| PAID \| OVERDUE |
| `dueDate` | `DateTime?` | — | — |
| `submittedAt` | `DateTime?` | — | — |
| `pfsaReference` | `String?` | @db.VarChar(100) | — |
| `paidAt` | `DateTime?` | — | — |
| `paymentReference` | `String?` | @db.VarChar(200) | — |
| `bankName` | `String?` | @db.VarChar(100) | — |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- unique `[companyId, period]`
- index `[companyId]`
- index `[period]`
- index `[status]`

### PerformanceObligation

_Table `performance_obligation` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `snapshotId` | `String` | — | — |
| `description` | `String` | — | — |
| `sspAmount` | `Decimal` | @db.Decimal(15, 2) | — |
| `allocatedAmount` | `Decimal` | @db.Decimal(15, 2) | — |
| `satisfactionBasis` | `ObligationBasis` | — | — |
| `isDistinct` | `Boolean` | @default(true) | — |
| `status` | `ObligationStatus` | @default(UNSATISFIED) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `snapshot` | [`ContractSnapshot`](#contractsnapshot) | one | `snapshotId` → `id` | Cascade |
| `allocations` | [`RevenueAllocation`](#revenueallocation) | many | _back-reference_ | — |
| `scheduleRows` | [`RecognitionScheduleRow`](#recognitionschedulerow) | many | _back-reference_ | — |

**Referenced by:** [`ContractSnapshot`](#contractsnapshot).`obligations` · [`RecognitionScheduleRow`](#recognitionschedulerow).`obligation` · [`RevenueAllocation`](#revenueallocation).`obligation`

**Indexes**

- index `[snapshotId]`

### PeriodClose

_Table `period_close` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `period` | `String` | @db.VarChar(7) // YYYY-MM | — |
| `status` | `String` | @default("OPEN") // OPEN \| REVIEW \| LOCKED | — |
| `lockedBy` | `String?` | — | — |
| `lockedAt` | `DateTime?` | — | — |
| `auditFirmId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`periodCloses`

**Indexes**

- unique `[companyId, period]`
- index `[companyId, status]`

### periodlock

_Table `periodlock` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id | — |
| `companyId` | `String` | — | — |
| `year` | `Int` | — | — |
| `month` | `Int` | — | — |
| `status` | `periodlock_status` | @default(OPEN) | — |
| `lockedBy` | `String?` | — | — |
| `lockedAt` | `DateTime?` | — | — |
| `unlockedBy` | `String?` | — | — |
| `unlockedAt` | `DateTime?` | — | — |
| `notes` | `String?` | — | — |

**Indexes**

- unique `[companyId, year, month]`

### Permission

_Table `permission` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | @unique(map: "Permission_name_key") @db.VarChar(150) | — |
| `description` | `String?` | @db.Text | — |
| `category` | `String?` | @db.VarChar(100) | — |
| `isActive` | `Boolean` | @default(true) | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | Cascade |
| `rolePermissions` | [`RolePermission`](#rolepermission) | many | _back-reference_ | — |

**Referenced by:** [`Company`](#company).`customPermissions` · [`RolePermission`](#rolepermission).`permission`

**Indexes**

- index `[companyId]`
- index `[isActive]`
- index `[category]`

### PettyCashFund

_Table `pettycashfund` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | @db.VarChar(200) | — |
| `companyId` | `String?` | @db.VarChar(36) | — |
| `custodian` | `String?` | @db.VarChar(200) | — |
| `floatAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `currentBalance` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `status` | `String` | @default("ACTIVE") @db.VarChar(20) | ACTIVE \| SUSPENDED \| CLOSED |
| `accountId` | `String?` | @db.VarChar(36) | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `transactions` | [`PettyCashTransaction`](#pettycashtransaction) | many | _back-reference_ | — |

**Referenced by:** [`PettyCashTransaction`](#pettycashtransaction).`fund`

**Indexes**

- index `[companyId]`
- index `[status]`

### PettyCashTransaction

_Table `pettycashtransaction` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `fundId` | `String` | @db.VarChar(36) | — |
| `companyId` | `String?` | — | — |
| `type` | `String` | @default("EXPENSE") @db.VarChar(20) | EXPENSE \| REPLENISHMENT \| ADJUSTMENT |
| `amount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `description` | `String` | @db.VarChar(500) | — |
| `category` | `String?` | @db.VarChar(100) | — |
| `receiptRef` | `String?` | @db.VarChar(100) | — |
| `performedBy` | `String?` | @db.VarChar(200) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `fund` | [`PettyCashFund`](#pettycashfund) | one | `fundId` → `id` | Cascade |

**Referenced by:** [`PettyCashFund`](#pettycashfund).`transactions`

**Indexes**

- index `[companyId]`
- index `[fundId]`

### Pipeline

_Table `pipeline` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `value` | `Decimal` | @default(0) | — |
| `probability` | `Int` | @default(0) | — |
| `stageId` | `String` | — | — |
| `customerId` | `String?` | — | — |
| `companyId` | `String?` | — | — |
| `expectedClosingDate` | `DateTime?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `customer` | [`Customer`](#customer) | optional one | `customerId` → `id` | — |
| `stage` | [`PipelineStage`](#pipelinestage) | one | `stageId` → `id` | — |

**Referenced by:** [`Company`](#company).`pipelines` · [`Customer`](#customer).`pipelines` · [`PipelineStage`](#pipelinestage).`pipelines`

**Indexes**

- index `[companyId]`
- index `[stageId]`

### PipelineStage

_Table `pipeline_stage` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `order` | `Int` | @default(0) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `pipelines` | [`Pipeline`](#pipeline) | many | _back-reference_ | — |

**Referenced by:** [`Pipeline`](#pipeline).`stage`

### PortalSubmissionLog

_Table `portal_submission_log` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `portalCode` | `String` | @db.VarChar(20) | ETAX \| TASS \| CUSTOMS \| ESLSE \| NBE |
| `submissionType` | `String` | @db.VarChar(50) | e.g. VAT_RETURN, PAYE, WHT, BIT, SRM_REGISTER, CUSTOMS_DECLARATION |
| `period` | `String?` | @db.VarChar(10) | — |
| `payload` | `String?` | @db.LongText | JSON payload sent (stored for audit & retry) |
| `response` | `String?` | @db.LongText | Raw response from portal |
| `portalReference` | `String?` | @db.VarChar(200) | Portal-assigned reference number (ERCA ref, SAD number, TASS ID, etc.) |
| `status` | `String` | @default("PENDING") @db.VarChar(20) | PENDING \| SUCCESS \| FAILED \| RETRYING \| ABANDONED |
| `submissionMode` | `String` | @default("stub") @db.VarChar(10) | live \| sandbox \| stub |
| `attemptCount` | `Int` | @default(0) | — |
| `lastAttemptAt` | `DateTime?` | — | — |
| `nextRetryAt` | `DateTime?` | — | — |
| `errorMessage` | `String?` | @db.VarChar(1000) | — |
| `submittedBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[portalCode]`
- index `[status]`
- index `[submissionType]`

### ProfileMetadata

_Table `profile_metadata` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `contactId` | `String` | @db.VarChar(36) | — |
| `companyId` | `String` | — | — |
| `scopeId` | `String` | — | — |
| `scopeKey` | `String` | @db.VarChar(200) | — |
| `localizedAttributes` | `String` | @db.LongText | — |
| `syncedAt` | `DateTime` | @default(now()) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |
| `scope` | [`ProfileMetadataScope`](#profilemetadatascope) | one | `scopeId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`profileMetadatas` · [`ProfileMetadataScope`](#profilemetadatascope).`metadata`

**Indexes**

- index `[contactId, scopeKey]`
- index `[companyId]`

### ProfileMetadataScope

_Table `profile_metadata_scope` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `scopeKey` | `String` | @db.VarChar(200) | — |
| `scopeName` | `String` | @db.VarChar(200) | — |
| `isActive` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |
| `metadata` | [`ProfileMetadata`](#profilemetadata) | many | _back-reference_ | — |

**Referenced by:** [`Company`](#company).`profileMetadataScopes` · [`ProfileMetadata`](#profilemetadata).`scope`

**Indexes**

- unique `[companyId, scopeKey]`
- index `[companyId]`

### ProformaInvoice

Proforma invoice for import/export

_Table `proforma_invoice` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `proformaNumber` | `String` | @unique @db.VarChar(100) | — |
| `shipmentId` | `String?` | — | — |
| `supplierName` | `String` | @db.VarChar(300) | — |
| `supplierCountry` | `String?` | @db.VarChar(100) | — |
| `buyerName` | `String` | @db.VarChar(300) | — |
| `issueDate` | `DateTime` | — | — |
| `validUntil` | `DateTime?` | — | — |
| `totalValue` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `currencyCode` | `String` | @default("USD") @db.VarChar(3) | — |
| `incoterms` | `String?` | @db.VarChar(10) | — |
| `paymentTerms` | `String?` | @db.VarChar(100) | — |
| `status` | `String` | @default("DRAFT") @db.VarChar(20) | DRAFT \| SUBMITTED \| APPROVED \| REJECTED \| EXPIRED |
| `lineItemsJson` | `String?` | @db.LongText | — |
| `companyId` | `String?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[status]`

### Project

_Table `Project` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | @db.VarChar(200) | — |
| `description` | `String?` | @db.Text | — |
| `status` | `ProjectStatus` | @default(ACTIVE) | — |
| `budget` | `Decimal?` | @db.Decimal(18, 2) | — |
| `spent` | `Decimal?` | @db.Decimal(18, 2) | — |
| `progress` | `Int?` | — | — |
| `startDate` | `DateTime?` | — | — |
| `endDate` | `DateTime?` | — | — |
| `manager` | `String?` | @db.VarChar(200) | — |
| `teamSize` | `Int?` | — | — |
| `companyId` | `String?` | — | — |
| `createdBy` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `tasks` | [`ProjectTask`](#projecttask) | many | _back-reference_ | — |
| `milestones` | [`ProjectMilestone`](#projectmilestone) | many | _back-reference_ | — |
| `timesheets` | [`ProjectTimesheet`](#projecttimesheet) | many | _back-reference_ | — |
| `activities` | [`ProjectActivity`](#projectactivity) | many | _back-reference_ | — |
| `timers` | [`ProjectTimer`](#projecttimer) | many | _back-reference_ | — |
| `financialLinks` | [`ProjectFinancialLink`](#projectfinanciallink) | many | _back-reference_ | — |

**Referenced by:** [`ProjectActivity`](#projectactivity).`project` · [`ProjectFinancialLink`](#projectfinanciallink).`project` · [`ProjectMilestone`](#projectmilestone).`project` · [`ProjectTask`](#projecttask).`project` · [`ProjectTimer`](#projecttimer).`project` · [`ProjectTimesheet`](#projecttimesheet).`project`

**Indexes**

- index `[companyId]`
- index `[status]`

### ProjectActivity

_Table `project_activity` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `projectId` | `String` | — | — |
| `taskId` | `String?` | — | — |
| `milestoneId` | `String?` | — | — |
| `activityType` | `String` | @db.VarChar(50) | — |
| `title` | `String?` | @db.VarChar(300) | — |
| `description` | `String?` | @db.Text | — |
| `delta` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `companyId` | `String?` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `project` | [`Project`](#project) | one | `projectId` → `id` | Cascade |
| `task` | [`ProjectTask`](#projecttask) | optional one | `taskId` → `id` | SetNull |
| `milestone` | [`ProjectMilestone`](#projectmilestone) | optional one | `milestoneId` → `id` | SetNull |

**Referenced by:** [`Project`](#project).`activities` · [`ProjectMilestone`](#projectmilestone).`activities` · [`ProjectTask`](#projecttask).`activities`

**Indexes**

- index `[projectId]`
- index `[taskId]`
- index `[milestoneId]`
- index `[companyId]`

### ProjectAttachment

_Table `project_attachment` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `taskId` | `String` | — | — |
| `filename` | `String` | @db.VarChar(300) | — |
| `url` | `String` | @db.VarChar(500) | — |
| `mimeType` | `String?` | @db.VarChar(100) | — |
| `size` | `BigInt?` | — | — |
| `uploadedBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `companyId` | `String?` | — | — |
| `milestoneId` | `String?` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `task` | [`ProjectTask`](#projecttask) | one | `taskId` → `id` | Cascade |
| `milestone` | [`ProjectMilestone`](#projectmilestone) | optional one | `milestoneId` → `id` | SetNull |

**Referenced by:** [`ProjectMilestone`](#projectmilestone).`attachments` · [`ProjectTask`](#projecttask).`attachments`

**Indexes**

- index `[taskId]`
- index `[companyId]`

### ProjectComment

_Table `project_comment` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `taskId` | `String` | — | — |
| `parentId` | `String?` | — | — |
| `body` | `String` | @db.Text | — |
| `authorName` | `String?` | @db.VarChar(200) | — |
| `authorId` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |
| `companyId` | `String?` | — | — |
| `milestoneId` | `String?` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `task` | [`ProjectTask`](#projecttask) | one | `taskId` → `id` | Cascade |
| `milestone` | [`ProjectMilestone`](#projectmilestone) | optional one | `milestoneId` → `id` | SetNull |
| `parent` | [`ProjectComment`](#projectcomment) | optional one | `parentId` → `id` | — |
| `replies` | [`ProjectComment`](#projectcomment) | many | _back-reference_ | — |

**Referenced by:** [`ProjectComment`](#projectcomment).`parent` · [`ProjectComment`](#projectcomment).`replies` · [`ProjectMilestone`](#projectmilestone).`comments` · [`ProjectTask`](#projecttask).`comments`

**Indexes**

- index `[taskId]`
- index `[parentId]`
- index `[companyId]`

### ProjectFinancialLink

_Table `project_financial_link` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `projectId` | `String` | — | — |
| `taskId` | `String?` | — | — |
| `linkType` | `String` | @db.VarChar(50) | — |
| `linkId` | `String` | @db.VarChar(100) | — |
| `linkNumber` | `String?` | @db.VarChar(200) | — |
| `amount` | `Decimal` | @db.Decimal(18, 2) | — |
| `currencyCode` | `String` | @default("ETB") @db.VarChar(3) | — |
| `direction` | `String` | @default("IN") @db.VarChar(10) | — |
| `linkDate` | `DateTime?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `project` | [`Project`](#project) | one | `projectId` → `id` | Cascade |
| `task` | [`ProjectTask`](#projecttask) | optional one | `taskId` → `id` | SetNull |

**Referenced by:** [`Project`](#project).`financialLinks` · [`ProjectTask`](#projecttask).`financialLinks`

**Indexes**

- index `[projectId]`
- index `[taskId]`
- index `[linkType]`
- index `[companyId]`

### ProjectMilestone

_Table `project_milestone` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `projectId` | `String` | — | — |
| `name` | `String` | @db.VarChar(300) | — |
| `description` | `String?` | @db.Text | — |
| `dueDate` | `DateTime?` | — | — |
| `completedAt` | `DateTime?` | — | — |
| `status` | `String` | @default("PENDING") @db.VarChar(20) | PENDING \| COMPLETED \| MISSED |
| `progress` | `Int?` | @default(0) | — |
| `budget` | `Decimal?` | @db.Decimal(18, 2) | — |
| `spent` | `Decimal?` | @db.Decimal(18, 2) | — |
| `companyId` | `String?` | — | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `project` | [`Project`](#project) | one | `projectId` → `id` | Cascade |
| `tasks` | [`ProjectTask`](#projecttask) | many | _back-reference_ | — |
| `comments` | [`ProjectComment`](#projectcomment) | many | _back-reference_ | — |
| `attachments` | [`ProjectAttachment`](#projectattachment) | many | _back-reference_ | — |
| `activities` | [`ProjectActivity`](#projectactivity) | many | _back-reference_ | — |

**Referenced by:** [`Project`](#project).`milestones` · [`ProjectActivity`](#projectactivity).`milestone` · [`ProjectAttachment`](#projectattachment).`milestone` · [`ProjectComment`](#projectcomment).`milestone` · [`ProjectTask`](#projecttask).`milestone`

**Indexes**

- index `[projectId]`
- index `[status]`

### ProjectTask

_Table `project_task` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `projectId` | `String` | — | — |
| `milestoneId` | `String?` | — | — |
| `title` | `String` | @db.VarChar(300) | — |
| `description` | `String?` | @db.Text | — |
| `status` | `TaskStatus` | @default(TODO) | — |
| `priority` | `TaskPriority` | @default(MEDIUM) | — |
| `assignedTo` | `String?` | @db.VarChar(200) | — |
| `dueDate` | `DateTime?` | — | — |
| `completedAt` | `DateTime?` | — | — |
| `estimatedHours` | `Decimal?` | @db.Decimal(8, 2) | — |
| `actualHours` | `Decimal?` | @db.Decimal(8, 2) | — |
| `billingStyle` | `BillingStyle` | @default(HOURLY) | INVOICE_PER_HOUR \| FIXED_PRICE \| FIXED_PER_TASK |
| `fixedRate` | `Decimal?` | @db.Decimal(12, 2) | — |
| `profitMargin` | `Int?` | — | — |
| `companyId` | `String?` | — | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `project` | [`Project`](#project) | one | `projectId` → `id` | Cascade |
| `milestone` | [`ProjectMilestone`](#projectmilestone) | optional one | `milestoneId` → `id` | SetNull |
| `timesheets` | [`ProjectTimesheet`](#projecttimesheet) | many | _back-reference_ | — |
| `comments` | [`ProjectComment`](#projectcomment) | many | _back-reference_ | — |
| `attachments` | [`ProjectAttachment`](#projectattachment) | many | _back-reference_ | — |
| `timers` | [`ProjectTimer`](#projecttimer) | many | _back-reference_ | — |
| `financialLinks` | [`ProjectFinancialLink`](#projectfinanciallink) | many | _back-reference_ | — |
| `activities` | [`ProjectActivity`](#projectactivity) | many | _back-reference_ | — |

**Referenced by:** [`Project`](#project).`tasks` · [`ProjectActivity`](#projectactivity).`task` · [`ProjectAttachment`](#projectattachment).`task` · [`ProjectComment`](#projectcomment).`task` · [`ProjectFinancialLink`](#projectfinanciallink).`task` · [`ProjectMilestone`](#projectmilestone).`tasks` · [`ProjectTimer`](#projecttimer).`task` · [`ProjectTimesheet`](#projecttimesheet).`task`

**Indexes**

- index `[projectId]`
- index `[milestoneId]`
- index `[status]`
- index `[assignedTo]`
- index `[billingStyle]`

### ProjectTimer

_Table `project_timer` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `projectId` | `String` | — | — |
| `taskId` | `String` | — | — |
| `employeeName` | `String?` | @db.VarChar(200) | — |
| `userId` | `String?` | @db.VarChar(100) | — |
| `startedAt` | `DateTime` | @default(now()) | — |
| `stoppedAt` | `DateTime?` | — | — |
| `hours` | `Decimal?` | @db.Decimal(6, 2) | — |
| `notes` | `String?` | @db.Text | — |
| `companyId` | `String?` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `project` | [`Project`](#project) | one | `projectId` → `id` | Cascade |
| `task` | [`ProjectTask`](#projecttask) | one | `taskId` → `id` | Cascade |

**Referenced by:** [`Project`](#project).`timers` · [`ProjectTask`](#projecttask).`timers`

**Indexes**

- index `[projectId]`
- index `[taskId]`
- index `[userId]`
- index `[companyId]`

### ProjectTimesheet

_Table `project_timesheet` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `projectId` | `String` | — | — |
| `taskId` | `String?` | — | — |
| `employeeName` | `String?` | @db.VarChar(200) | — |
| `userId` | `String?` | @db.VarChar(100) | — |
| `date` | `DateTime` | — | — |
| `hours` | `Decimal` | @db.Decimal(6, 2) | — |
| `description` | `String?` | @db.Text | — |
| `billable` | `Boolean` | @default(true) | — |
| `hourlyRate` | `Decimal?` | @db.Decimal(12, 2) | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `project` | [`Project`](#project) | one | `projectId` → `id` | Cascade |
| `task` | [`ProjectTask`](#projecttask) | optional one | `taskId` → `id` | — |

**Referenced by:** [`Project`](#project).`timesheets` · [`ProjectTask`](#projecttask).`timesheets`

**Indexes**

- index `[projectId]`
- index `[taskId]`
- index `[date]`

### PropertyAssessment

_Table `property_assessment` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `propertyId` | `String` | — | — |
| `period` | `String` | @db.VarChar(4) // YYYY | — |
| `assessedValue` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `taxRate` | `Decimal` | @default(0.01) @db.Decimal(8, 6) | — |
| `annualTaxDue` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `penaltyAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `totalPayable` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `status` | `PropertyTaxStatus` | @default(ASSESSED) | — |
| `assessedBy` | `String?` | — | — |
| `assessedAt` | `DateTime?` | — | — |
| `dueDate` | `DateTime` | — | — |
| `paidAt` | `DateTime?` | — | — |
| `paymentReference` | `String?` | @db.VarChar(200) | — |
| `municipality` | `String` | @db.VarChar(100) | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `property` | [`PropertyRecord`](#propertyrecord) | one | `propertyId` → `id` | Cascade |

**Referenced by:** [`PropertyRecord`](#propertyrecord).`assessments`

**Indexes**

- index `[propertyId]`
- index `[period]`
- index `[status]`

### PropertyRecord

Property Tax — Proclamation No. 1161/2019

_Table `property_record` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `propertyCode` | `String` | @db.VarChar(50) | — |
| `description` | `String` | @db.VarChar(500) | — |
| `address` | `String` | @db.VarChar(500) | — |
| `city` | `String` | @db.VarChar(100) | — |
| `subcity` | `String?` | @db.VarChar(100) | — |
| `woreda` | `String?` | @db.VarChar(100) | — |
| `kebele` | `String?` | @db.VarChar(100) | — |
| `propertyType` | `PropertyTaxType` | — | — |
| `useType` | `PropertyUseType` | — | — |
| `landAreaSqm` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `buildingAreaSqm` | `Decimal?` | @db.Decimal(18, 2) | — |
| `yearBuilt` | `Int?` | — | — |
| `registrationNumber` | `String?` | @db.VarChar(100) | — |
| `titleDeedNumber` | `String?` | @db.VarChar(100) | — |
| `assessedValue` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `marketValue` | `Decimal?` | @db.Decimal(18, 2) | — |
| `annualTaxPayable` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `valuationMethod` | `ValuationMethod` | @default(MARKET_VALUE) | — |
| `lastValuationDate` | `DateTime?` | — | — |
| `nextValuationDate` | `DateTime?` | — | — |
| `isExempt` | `Boolean` | @default(false) | — |
| `exemptReason` | `String?` | @db.VarChar(500) | — |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `assessments` | [`PropertyAssessment`](#propertyassessment) | many | _back-reference_ | — |

**Referenced by:** [`PropertyAssessment`](#propertyassessment).`property`

**Indexes**

- index `[companyId]`
- index `[propertyType]`

### Provision

_Table `provision` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | @db.VarChar(36) | — |
| `type` | `String` | @default("OTHER") @db.VarChar(30) | LEGAL \| WARRANTY \| RESTRUCTURING \| ONEROUS_CONTRACT \| ENVIRONMENTAL \| GRATUITY \| OTHER |
| `description` | `String` | @db.VarChar(500) | — |
| `probability` | `String` | @default("PROBABLE") @db.VarChar(20) | PROBABLE \| POSSIBLE \| REMOTE |
| `amount` | `Decimal` | @default(0) @db.Decimal(18, 2) | Best estimate (point amount or range midpoint) |
| `amountLow` | `Decimal` | @default(0) @db.Decimal(18, 2) | Range low estimate |
| `amountHigh` | `Decimal` | @default(0) @db.Decimal(18, 2) | Range high estimate |
| `expectedSettle` | `DateTime?` | — | — |
| `discountRate` | `Decimal` | @default(0) @db.Decimal(5, 2) | — |
| `status` | `String` | @default("OPEN") @db.VarChar(20) | OPEN \| UTILISED \| REVERSED \| SETTLED |
| `journalEntryId` | `String?` | @db.VarChar(36) | — |
| `utilisedAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `reversedAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[status]`
- index `[type]`

### ProvisionalTaxPayment

_Table `provisional_tax_payment` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `fiscalYear` | `Int` | — | Ethiopian fiscal year (e.g. 2024 = EFY 2016/17) |
| `installmentType` | `String` | @default("HALF_YEAR") @db.VarChar(20) | HALF_YEAR (50% by end of month following month 6) \| Q1 \| Q2 \| Q3 \| Q4 |
| `expectedAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | Based on 50% of prior year final BIT |
| `paidAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | Actual amount paid |
| `paymentDate` | `DateTime?` | — | — |
| `paymentReference` | `String?` | @db.VarChar(200) | — |
| `dueDate` | `DateTime?` | — | — |
| `ercaReference` | `String?` | @db.VarChar(100) | — |
| `creditApplied` | `Boolean` | @default(false) | — |
| `status` | `String` | @default("PENDING") @db.VarChar(20) | PENDING \| PAID \| CREDITED \| OVERDUE |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- unique `[companyId, fiscalYear, installmentType]`
- index `[companyId]`
- index `[status]`

### PurchaseOrder

_Table `purchase_order` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `poNumber` | `String` | @unique @db.VarChar(100) | — |
| `vendorId` | `String?` | — | — |
| `vendorName` | `String?` | @db.VarChar(200) | — |
| `status` | `String` | @default("DRAFT") | — |
| `totalAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `currencyCode` | `String` | @default("ETB") | — |
| `expectedDelivery` | `DateTime?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `items` | `String?` | @db.LongText | JSON array of line items |
| `companyId` | `String?` | — | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `approvedBy` | `String?` | @db.VarChar(100) | — |
| `approvedAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Indexes**

- index `[status]`
- index `[companyId]`
- index `[vendorId]`

### PurchaseReceipt

_Table `purchase_receipt` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `purchaseOrderId` | `String?` | — | — |
| `vendorId` | `String` | — | — |
| `receiptNumber` | `String` | @db.VarChar(100) | — |
| `items` | `String?` | @db.LongText | — |
| `receivedAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`purchaseReceipts`

**Indexes**

- unique `[companyId, receiptNumber]`
- index `[companyId]`

### ReceiptStorage

_Table `receipt_storage` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `receiptUrl` | `String` | @unique @db.VarChar(500) | — |
| `sourceType` | `String` | @db.VarChar(50) | — |
| `sourceId` | `String` | @db.VarChar(36) | — |
| `companyId` | `String?` | — | — |
| `compressed` | `Boolean` | @default(false) | — |
| `compressedAt` | `DateTime?` | — | — |
| `fileState` | `String` | @default("STORED") @db.VarChar(50) | — |
| `sizeBytes` | `Int?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`receiptStorages`

**Indexes**

- index `[sourceType, sourceId]`

### RecognitionScheduleRow

_Table `recognition_schedule_row` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `snapshotId` | `String` | — | — |
| `obligationId` | `String` | — | — |
| `allocationId` | `String` | — | — |
| `period` | `String` | // YYYY-MM | — |
| `scheduledAmount` | `Decimal` | @db.Decimal(15, 2) | — |
| `recognisedAmount` | `Decimal` | @db.Decimal(15, 2) @default(0) | — |
| `deferredAmount` | `Decimal` | @db.Decimal(15, 2) | — |
| `status` | `ScheduleRowStatus` | @default(PENDING) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `snapshot` | [`ContractSnapshot`](#contractsnapshot) | one | `snapshotId` → `id` | Cascade |
| `obligation` | [`PerformanceObligation`](#performanceobligation) | one | `obligationId` → `id` | Cascade |
| `allocation` | [`RevenueAllocation`](#revenueallocation) | one | `allocationId` → `id` | Cascade |
| `ifrsGlJournals` | [`IfrsGlJournal`](#ifrsgljournal) | many | _back-reference_ | — |

**Referenced by:** [`ContractSnapshot`](#contractsnapshot).`scheduleRows` · [`IfrsGlJournal`](#ifrsgljournal).`scheduleRow` · [`PerformanceObligation`](#performanceobligation).`scheduleRows` · [`RevenueAllocation`](#revenueallocation).`scheduleRows`

**Indexes**

- unique `[snapshotId, obligationId, period]`
- index `[period, status]`

### ReconciliationPeriod

_Table `reconciliation_period` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `bankAccountId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `statementDate` | `DateTime` | — | — |
| `openingBalance` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `closingBalance` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `reconciledBalance` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `discrepancy` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `status` | `ReconciliationPeriodStatus` | @default(OPEN) | — |
| `notes` | `String?` | @db.Text | — |
| `reconciledBy` | `String?` | @db.VarChar(100) | — |
| `reconciledAt` | `DateTime?` | — | — |
| `approvedBy` | `String?` | @db.VarChar(100) | — |
| `approvedAt` | `DateTime?` | — | — |
| `bankAccountName` | `String?` | @db.VarChar(200) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `bankAccount` | [`BankAccount`](#bankaccount) | one | `bankAccountId` → `id` | Cascade |
| `reports` | [`ReconciliationReport`](#reconciliationreport) | many | _back-reference_ | — |

**Referenced by:** [`BankAccount`](#bankaccount).`reconciliationPeriods` · [`Company`](#company).`reconciliationPeriod` · [`ReconciliationReport`](#reconciliationreport).`period`

**Indexes**

- index `[companyId]`
- index `[bankAccountId]`
- index `[status]`

### ReconciliationReport

_Table `reconciliation_report` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `periodId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `reportType` | `String` | @default("STATEMENT") @db.VarChar(50) | — |
| `status` | `ReconciliationReportStatus` | @default(DRAFT) | — |
| `generatedAt` | `DateTime` | @default(now()) | — |
| `generatedBy` | `String?` | @db.VarChar(100) | — |
| `approvedBy` | `String?` | @db.VarChar(100) | — |
| `approvedAt` | `DateTime?` | — | — |
| `fileUrl` | `String?` | @db.VarChar(500) | — |
| `fileFormat` | `String?` | @db.VarChar(20) | — |
| `notes` | `String?` | @db.Text | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `period` | [`ReconciliationPeriod`](#reconciliationperiod) | one | `periodId` → `id` | Cascade |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`reconciliationReport` · [`ReconciliationPeriod`](#reconciliationperiod).`reports`

**Indexes**

- index `[periodId]`
- index `[companyId]`

### ReimbursementClaim

_Table `reimbursementclaim` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `employeeId` | `String` | — | — |
| `type` | `String` | @default("TRAVEL") | — |
| `workflowType` | `String?` | @default("EMPLOYEE_EXPENSE") @db.VarChar(50) | EMPLOYEE_EXPENSE \| CANDIDATE_REIMBURSEMENT \| AGENCY_INVOICE |
| `candidateName` | `String?` | @db.VarChar(200) | — |
| `recoveryClause` | `Boolean` | @default(false) | — |
| `advanceLinkId` | `String?` | @db.VarChar(36) | — |
| `amount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `totalAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `locationTier` | `String?` | @db.VarChar(50) | — |
| `purpose` | `String?` | @db.VarChar(200) | — |
| `destination` | `String?` | @db.VarChar(200) | — |
| `startDate` | `DateTime?` | — | — |
| `endDate` | `DateTime?` | — | — |
| `transportCost` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `perDiemAmount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `description` | `String?` | @db.Text | — |
| `notes` | `String?` | @db.Text | — |
| `status` | `String` | @default("PENDING") | — |
| `approvedBy` | `String?` | — | — |
| `approvedAt` | `DateTime?` | — | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `employee` | [`Employee`](#employee) | one | `employeeId` → `id` | — |

**Referenced by:** [`Company`](#company).`reimbursementClaim` · [`Employee`](#employee).`reimbursementClaim`

**Indexes**

- index `[companyId]`
- index `[employeeId]`
- index `[workflowType]`

### Release

_Table `release` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `version` | `String` | @unique | — |
| `changelog` | `String?` | @db.Text | — |
| `isMandatory` | `Boolean` | @default(false) | — |
| `releasedAt` | `DateTime` | @default(now()) | — |
| `status` | `ReleaseStatus` | @default(RELEASED) | — |
| `type` | `ReleaseType` | @default(PRODUCTION) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `companies` | [`CompanyRelease`](#companyrelease) | many | _back-reference_ | — |

**Referenced by:** [`CompanyRelease`](#companyrelease).`release`

### RemeasurementJournal

_Table `remeasurement_journal` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `modificationId` | `String` | — | — |
| `journalEntryId` | `String` | — | — |
| `liabilityDelta` | `Decimal` | @db.Decimal(15, 2) | — |
| `rouAssetDelta` | `Decimal` | @db.Decimal(15, 2) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `modification` | [`LeaseModification`](#leasemodification) | one | `modificationId` → `id` | Cascade |

**Referenced by:** [`LeaseModification`](#leasemodification).`remeasurementJournals`

**Indexes**

- index `[modificationId]`
- index `[journalEntryId]`

### ReportDefinition

_Table `report_definition` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `name` | `String` | @db.VarChar(200) | — |
| `type` | `String` | // BALANCE_SHEET \| INCOME_STATEMENT \| CASH_FLOW \| TRIAL_BALANCE | — |
| `period` | `String` | @db.VarChar(7) // YYYY-MM | — |
| `definition` | `String` | @db.LongText | — |
| `isActive` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`reportDefinitions`

**Indexes**

- unique `[companyId, type, period]`
- index `[companyId]`

### ReportLine

_Table `report_line` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `reportDefinitionId` | `String` | — | — |
| `lineOrder` | `Int` | — | — |
| `accountCode` | `String` | @db.VarChar(20) | — |
| `description` | `String` | @db.VarChar(200) | — |
| `amount` | `Decimal` | @db.Decimal(18, 2) | — |
| `isHeader` | `Boolean` | @default(false) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`reportLines`

**Indexes**

- index `[companyId, reportDefinitionId]`
- index `[reportDefinitionId]`

### Revenue

_Table `revenue` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `date` | `DateTime` | — | — |
| `amount` | `Decimal` | — | — |
| `currencyCode` | `String` | @default("ETB") @db.VarChar(3) | — |
| `accountId` | `String?` | // Reference to BankAccount | — |
| `customerId` | `String?` | — | — |
| `categoryId` | `String?` | — | — |
| `description` | `String?` | @db.Text | — |
| `reference` | `String?` | @db.VarChar(100) | — |
| `companyId` | `String?` | — | — |
| `journalEntryId` | `String?` | @db.VarChar(36) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `customer` | [`Customer`](#customer) | optional one | `customerId` → `id` | — |
| `category` | [`Category`](#category) | optional one | `categoryId` → `id` | — |
| `bankAccount` | [`BankAccount`](#bankaccount) | optional one | `accountId` → `id` | — |
| `journalEntry` | [`JournalEntry`](#journalentry) | optional one | `journalEntryId` → `id` | — |

**Referenced by:** [`BankAccount`](#bankaccount).`revenues` · [`Category`](#category).`revenues` · [`Company`](#company).`revenue` · [`Customer`](#customer).`revenues` · [`JournalEntry`](#journalentry).`revenues`

**Indexes**

- index `[companyId]`
- index `[customerId]`
- index `[categoryId]`
- index `[date]`

### RevenueAllocation

_Table `revenue_allocation` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `snapshotId` | `String` | — | — |
| `obligationId` | `String` | — | — |
| `sspBasis` | `String` | — | — |
| `totalSsp` | `Decimal` | @db.Decimal(15, 2) | — |
| `allocatedAmount` | `Decimal` | @db.Decimal(15, 2) | — |
| `allocationMethod` | `String` | @default("PROPORTIONAL_SSP") | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `snapshot` | [`ContractSnapshot`](#contractsnapshot) | one | `snapshotId` → `id` | Cascade |
| `obligation` | [`PerformanceObligation`](#performanceobligation) | one | `obligationId` → `id` | Cascade |
| `scheduleRows` | [`RecognitionScheduleRow`](#recognitionschedulerow) | many | _back-reference_ | — |
| `ifrsGlJournals` | [`IfrsGlJournal`](#ifrsgljournal) | many | _back-reference_ | — |

**Referenced by:** [`ContractSnapshot`](#contractsnapshot).`allocations` · [`IfrsGlJournal`](#ifrsgljournal).`allocation` · [`PerformanceObligation`](#performanceobligation).`allocations` · [`RecognitionScheduleRow`](#recognitionschedulerow).`allocation`

**Indexes**

- index `[snapshotId]`
- index `[obligationId]`

### Review

_Table `review` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `entityType` | `String` | @db.VarChar(50) | — |
| `entityId` | `String` | — | — |
| `appId` | `String?` | — | — |
| `userId` | `String?` | — | — |
| `rating` | `Int` | @default(5) | — |
| `comment` | `String?` | @db.Text | — |
| `reviewedBy` | `String?` | @db.VarChar(100) | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `app` | [`App`](#app) | optional one | `appId` → `id` | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`App`](#app).`review` · [`Company`](#company).`review`

**Indexes**

- index `[appId]`
- index `[companyId]`
- index `[entityType, entityId]`

### Reward

_Table `reward` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `description` | `String?` | @db.Text | — |
| `category` | `String` | @db.VarChar(100) | — |
| `costPoints` | `BigInt` | — | — |
| `stock` | `Int` | @default(999) | — |
| `imageUrl` | `String?` | — | — |
| `companyId` | `String?` | — | — |
| `isActive` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `loyaltyRedemption` | [`LoyaltyRedemption`](#loyaltyredemption) | many | _back-reference_ | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`reward` · [`LoyaltyRedemption`](#loyaltyredemption).`reward`

**Indexes**

- index `[companyId]`

### RoleAppAccess

_Table `role_app_access` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `role` | `String` | @db.VarChar(50) | — |
| `appId` | `String` | — | — |
| `accessLevel` | `AppAccessLevel` | @default(READ) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `app` | [`App`](#app) | one | `appId` → `id` | Cascade |

**Referenced by:** [`App`](#app).`roleAppAccess`

**Indexes**

- unique `[role, appId]`
- index `[role]`
- index `[appId]`

### RoleDefinition

_Table `role_definition` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | @db.VarChar(100) | — |
| `description` | `String?` | @db.Text | — |
| `isActive` | `Boolean` | @default(true) | — |
| `isSystem` | `Boolean` | @default(false) | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | Cascade |
| `rolePermissions` | [`RolePermission`](#rolepermission) | many | _back-reference_ | — |
| `customUsers` | [`UserRole`](#userrole) | many | _back-reference_ | — |

**Referenced by:** [`Company`](#company).`customRoles` · [`RolePermission`](#rolepermission).`role` · [`UserRole`](#userrole).`role`

**Indexes**

- unique `[name, companyId]`
- index `[companyId]`
- index `[isActive]`
- index `[isSystem]`

### RolePermission

_Table `role_permission` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `roleId` | `String` | — | — |
| `permissionId` | `String` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `role` | [`RoleDefinition`](#roledefinition) | one | `roleId` → `id` | Cascade |
| `permission` | [`Permission`](#permission) | one | `permissionId` → `id` | Cascade |

**Referenced by:** [`Permission`](#permission).`rolePermissions` · [`RoleDefinition`](#roledefinition).`rolePermissions`

**Indexes**

- unique `[roleId, permissionId]`
- index `[roleId]`
- index `[permissionId]`

### SalesOrder

Sales Order header — created when a customer places an order

_Table `sales_order` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `OrderNumber` | `String` | @db.VarChar(50) | — |
| `CustomerId` | `String?` | @db.VarChar(36) | — |
| `CustomerName` | `String?` | @db.VarChar(200) | — |
| `SalesType` | `String?` | @db.VarChar(30) | STANDARD \| DIRECT \| CONSIGNMENT \| TRANSFER |
| `OrderDate` | `DateTime` | @default(now()) | — |
| `RequestedDeliveryDate` | `DateTime?` | — | — |
| `CurrencyCode` | `String?` | @db.VarChar(3) | — |
| `CurrencyRate` | `Decimal?` | @db.Decimal(18, 6) | — |
| `ShipToAddressText` | `String?` | @db.VarChar(500) | — |
| `ShipToWarehouseId` | `String?` | @db.VarChar(36) | — |
| `notes` | `String?` | @db.Text | — |
| `CreatedBy` | `String?` | @db.VarChar(36) | — |
| `status` | `String` | @default("DRAFT") @db.VarChar(30) | DRAFT \| CONFIRMED \| PARTIALLY_SHIPPED \| SHIPPED \| DELIVERED \| CANCELLED |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `OrderLines` | [`SalesOrderLine`](#salesorderline) | many | _back-reference_ | — |
| `ShipToAddresses` | [`SalesOrderShipToAddress`](#salesordershiptoaddress) | many | _back-reference_ | — |
| `dispatches` | [`DispatchDocket`](#dispatchdocket) | many | _back-reference_ | — |
| `DeliveryPerformance` | [`DeliveryPerformance`](#deliveryperformance) | many | _back-reference_ | — |
| `StockDemand` | [`StockDemandByOrder`](#stockdemandbyorder) | many | _back-reference_ | — |
| `CreditNotes` | [`SalesOrderCreditNote`](#salesordercreditnote) | many | _back-reference_ | — |

**Referenced by:** [`DeliveryPerformance`](#deliveryperformance).`SalesOrder` · [`DispatchDocket`](#dispatchdocket).`SalesOrder` · [`SalesOrderCreditNote`](#salesordercreditnote).`SalesOrder` · [`SalesOrderLine`](#salesorderline).`SalesOrder` · [`SalesOrderShipToAddress`](#salesordershiptoaddress).`SalesOrder` · [`StockDemandByOrder`](#stockdemandbyorder).`SalesOrder`

**Indexes**

- index `[companyId]`
- index `[OrderNumber]`
- index `[status]`
- index `[CustomerId]`

### SalesOrderCreditNote

Credit notes raised against a sales order (not against an invoice)

_Table `sales_order_credit_note` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `SalesOrderId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `CreditNoteNo` | `String` | @db.VarChar(50) | — |
| `reason` | `String?` | @db.VarChar(500) | — |
| `totalAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `currencyCode` | `String` | @default("ETB") @db.VarChar(3) | — |
| `status` | `String` | @default("DRAFT") @db.VarChar(20) | DRAFT \| APPROVED \| APPLIED \| CANCELLED |
| `issuedAt` | `DateTime` | @default(now()) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `SalesOrder` | [`SalesOrder`](#salesorder) | one | `SalesOrderId` → `id` | Cascade |
| `items` | [`SalesOrderCreditNoteItem`](#salesordercreditnoteitem) | many | _back-reference_ | — |

**Referenced by:** [`SalesOrder`](#salesorder).`CreditNotes` · [`SalesOrderCreditNoteItem`](#salesordercreditnoteitem).`CreditNote`

**Indexes**

- index `[SalesOrderId]`
- index `[companyId]`

### SalesOrderCreditNoteItem

Line items for a sales order credit note

_Table `sales_order_credit_note_item` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `CreditNoteId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `SalesOrderLineId` | `String?` | — | — |
| `description` | `String?` | @db.VarChar(500) | — |
| `qty` | `Decimal` | @default(0) @db.Decimal(18, 4) | — |
| `unitPrice` | `Decimal` | @default(0) @db.Decimal(18, 4) | — |
| `amount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `CreditNote` | [`SalesOrderCreditNote`](#salesordercreditnote) | one | `CreditNoteId` → `id` | Cascade |
| `SalesOrderLine` | [`SalesOrderLine`](#salesorderline) | optional one | `SalesOrderLineId` → `id` | — |

**Referenced by:** [`Company`](#company).`salesOrderCreditNoteItems` · [`SalesOrderCreditNote`](#salesordercreditnote).`items` · [`SalesOrderLine`](#salesorderline).`creditNoteItems`

**Indexes**

- index `[companyId]`
- index `[CreditNoteId]`

### SalesOrderLine

Sales Order line items

_Table `sales_order_line` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `SalesOrderId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `LineNo` | `Int` | — | — |
| `ItemId` | `String?` | @db.VarChar(36) | — |
| `ItemType` | `String?` | @db.VarChar(20) | GOODS \| SERVICES \| DIGITAL |
| `description` | `String?` | @db.VarChar(500) | — |
| `OrderedQty` | `Decimal` | @default(0) @db.Decimal(18, 4) | — |
| `InvoicedQty` | `Decimal` | @default(0) @db.Decimal(18, 4) | — |
| `UnitOfMeasure` | `String?` | @db.VarChar(20) | — |
| `SalePriceSnapshot` | `Decimal?` | @db.Decimal(18, 4) | — |
| `DiscountType` | `String?` | @db.VarChar(15) | PERCENTAGE \| FIXED |
| `DiscountValue` | `Decimal?` | @db.Decimal(18, 4) | — |
| `OrderedWeight` | `Decimal?` | @db.Decimal(18, 4) | — |
| `taxRate` | `Decimal?` | @db.Decimal(5, 2) | — |
| `taxAmount` | `Decimal?` | @db.Decimal(18, 4) | — |
| `lineTotal` | `Decimal?` | @db.Decimal(18, 4) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `SalesOrder` | [`SalesOrder`](#salesorder) | one | `SalesOrderId` → `id` | Cascade |
| `dispatchLines` | [`DispatchDocketLine`](#dispatchdocketline) | many | _back-reference_ | — |
| `creditNoteItems` | [`SalesOrderCreditNoteItem`](#salesordercreditnoteitem) | many | _back-reference_ | — |

**Referenced by:** [`DispatchDocketLine`](#dispatchdocketline).`SalesOrderLine` · [`SalesOrder`](#salesorder).`OrderLines` · [`SalesOrderCreditNoteItem`](#salesordercreditnoteitem).`SalesOrderLine`

**Indexes**

- index `[companyId]`
- index `[SalesOrderId]`

### SalesOrderShipToAddress

Ship-to addresses associated with a sales order

_Table `sales_order_ship_to_address` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `SalesOrderId` | `String` | — | — |
| `label` | `String?` | @db.VarChar(100) | — |
| `addressLine1` | `String?` | @db.VarChar(200) | — |
| `addressLine2` | `String?` | @db.VarChar(200) | — |
| `city` | `String?` | @db.VarChar(100) | — |
| `region` | `String?` | @db.VarChar(100) | — |
| `country` | `String?` | @db.VarChar(50) | — |
| `postalCode` | `String?` | @db.VarChar(20) | — |
| `contactName` | `String?` | @db.VarChar(100) | — |
| `contactPhone` | `String?` | @db.VarChar(30) | — |
| `isDefault` | `Boolean` | @default(false) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `SalesOrder` | [`SalesOrder`](#salesorder) | one | `SalesOrderId` → `id` | Cascade |

**Referenced by:** [`SalesOrder`](#salesorder).`ShipToAddresses`

**Indexes**

- index `[SalesOrderId]`

### ScannedBill

_Table `scanned_bill` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `billType` | `String` | @default("BANK") @db.VarChar(20) | — |
| `source` | `String?` | @db.VarChar(200) | — |
| `referenceNo` | `String?` | @db.VarChar(200) | — |
| `amount` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `currencyCode` | `String` | @default("ETB") @db.VarChar(10) | — |
| `paidAt` | `DateTime?` | — | — |
| `payer` | `String?` | @db.VarChar(200) | — |
| `receiver` | `String?` | @db.VarChar(200) | — |
| `bankName` | `String?` | @db.VarChar(100) | — |
| `bankAccountNo` | `String?` | @db.VarChar(100) | — |
| `bankAccountName` | `String?` | @db.VarChar(200) | — |
| `telecomRef` | `String?` | @db.VarChar(100) | — |
| `bankRef` | `String?` | @db.VarChar(100) | — |
| `description` | `String?` | @db.Text | — |
| `rawData` | `String?` | @db.LongText | — |
| `creditPart` | `String?` | @db.Text | — |
| `debitPart` | `String?` | @db.Text | — |
| `paidRef` | `String?` | @db.Text | — |
| `paidName` | `String?` | @db.Text | — |
| `imageData` | `String?` | @db.LongText | — |
| `ocrConfidence` | `Decimal?` | — | — |
| `status` | `String` | @default("PENDING") @db.VarChar(20) | — |
| `linkedExpenseId` | `String?` | — | — |
| `linkedInvoiceId` | `String?` | — | — |
| `linkedBillId` | `String?` | — | — |
| `exportedAt` | `DateTime?` | — | — |
| `exportFormat` | `String?` | @db.VarChar(20) | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`scannedBill`

**Indexes**

- index `[companyId]`
- index `[billType]`
- index `[status]`
- index `[referenceNo]`

### ScheduleDFiling

_Table `schedule_d_filing` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `taxType` | `String` | @db.VarChar(50) | DIVIDEND \| INTEREST_STANDARD \| INTEREST_SAVINGS \| CAPITAL_GAINS_CLASS_A \| CAPITAL_GAINS_CLASS_B \| ROYALTY_ARTISTIC \| ROYALTY_TECHNICAL \| DIGITAL_CONTENT \| GAMES_OF_CHANCE \| CASUAL_RENTAL \| REPATRIATED_PROFIT \| UNDISTRIBUTED_PROFIT \| MANAGEMENT_FEES \| TECHNICAL_FEES \| WINDFALL_PROFIT |
| `period` | `String` | @db.VarChar(7) | YYYY-MM for monthly; YYYY for annual |
| `recipientName` | `String?` | @db.VarChar(255) | — |
| `recipientTin` | `String?` | @db.VarChar(20) | — |
| `grossAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `taxRate` | `Decimal` | @default(0) @db.Decimal(8, 6) | — |
| `taxAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `netAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `acquisitionCost` | `Decimal?` | @db.Decimal(18, 2) | For capital gains: original acquisition cost |
| `disposalProceeds` | `Decimal?` | @db.Decimal(18, 2) | — |
| `capitalGain` | `Decimal?` | @db.Decimal(18, 2) | — |
| `assetClass` | `String?` | @db.VarChar(20) | CLASS_A (immovable) \| CLASS_B (shares/bonds) — for capital gains |
| `withheldAtSource` | `Boolean` | @default(false) | Whether WHT agent has already withheld this tax at source |
| `ercaReference` | `String?` | @db.VarChar(100) | — |
| `dueDate` | `DateTime?` | — | — |
| `filedAt` | `DateTime?` | — | — |
| `paidAt` | `DateTime?` | — | — |
| `paymentReference` | `String?` | @db.VarChar(200) | — |
| `status` | `String` | @default("DRAFT") @db.VarChar(20) | DRAFT \| FILED \| PAID \| EXEMPT \| OVERDUE |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[taxType]`
- index `[period]`
- index `[status]`

### SectorTaxOverride

Sector-level tax exemptions or rate overrides. Applied on top of TaxRule when building CompanyTaxProfile for a sector.

_Table `sector_tax_override` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `sector` | `String` | @db.VarChar(50) | — |
| `taxCode` | `String` | @db.VarChar(30) | — |
| `rateOverride` | `Decimal?` | — | NULL = use universal rate; set when MoR grants sector-specific rate |
| `exempt` | `Boolean` | @default(false) | — |
| `conditionText` | `String` | @db.VarChar(500) | — |
| `authority` | `String` | @db.VarChar(300) | — |
| `isActive` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Indexes**

- index `[sector, taxCode]`

### SecurityAssessment

_Table `security_assessment` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `name` | `String` | @db.VarChar(200) | — |
| `description` | `String?` | @db.Text | — |
| `status` | `String` | @default("SCHEDULED") @db.VarChar(20) | SCHEDULED \| IN_PROGRESS \| COMPLETED \| FAILED |
| `currentPhase` | `String?` | @db.VarChar(30) | PHASE_1_ATTACK_SURFACE \| PHASE_2_CONFIG \| PHASE_3_DAST \| PHASE_4_REMEDIATION \| ALL |
| `startedAt` | `DateTime?` | — | — |
| `completedAt` | `DateTime?` | — | — |
| `conductedBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |
| `scans` | [`SecurityScan`](#securityscan) | many | _back-reference_ | — |
| `findings` | [`SecurityFinding`](#securityfinding) | many | _back-reference_ | — |

**Referenced by:** [`Company`](#company).`securityAssessment` · [`SecurityFinding`](#securityfinding).`assessment` · [`SecurityScan`](#securityscan).`assessment`

**Indexes**

- index `[companyId]`
- index `[status]`

### SecurityFinding

_Table `security_finding` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `assessmentId` | `String` | — | — |
| `scanId` | `String?` | — | — |
| `severity` | `String` | @db.VarChar(20) | CRITICAL \| HIGH \| MEDIUM \| LOW \| INFO |
| `category` | `String` | @db.VarChar(50) | BOLA \| MASS_ASSIGNMENT \| SQL_INJECTION \| XSS \| EXPOSED_ENV \| WEAK_APP_KEY \| DEBUG_MODE \| INACTIVE_FIREWALL \| INSECURE_HEADERS \| BRUTE_FORCE \| DATA_IN_TRANSIT \| MISSING_CSP \| MISSING_HSTS |
| `title` | `String` | @db.VarChar(200) | — |
| `description` | `String` | @db.Text | — |
| `affectedResource` | `String?` | @db.VarChar(500) | — |
| `remediation` | `String?` | @db.Text | — |
| `status` | `String` | @default("OPEN") @db.VarChar(20) | OPEN \| IN_PROGRESS \| RESOLVED \| ACCEPTED_RISK \| FALSE_POSITIVE |
| `assignedTo` | `String?` | @db.VarChar(100) | — |
| `resolvedAt` | `DateTime?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `assessment` | [`SecurityAssessment`](#securityassessment) | one | `assessmentId` → `id` | Cascade |
| `scan` | [`SecurityScan`](#securityscan) | optional one | `scanId` → `id` | SetNull |

**Referenced by:** [`SecurityAssessment`](#securityassessment).`findings` · [`SecurityScan`](#securityscan).`findings`

**Indexes**

- index `[assessmentId]`
- index `[scanId]`
- index `[severity]`
- index `[status]`
- index `[category]`

### SecurityScan

_Table `security_scan` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `assessmentId` | `String` | — | — |
| `phase` | `String` | @db.VarChar(30) | PHASE_1_ATTACK_SURFACE \| PHASE_2_CONFIG \| PHASE_3_DAST \| PHASE_4_REMEDIATION |
| `scanType` | `String` | @db.VarChar(50) | ENDPOINT_MAPPING \| ENV_AUDIT \| BOLA_TEST \| MASS_ASSIGNMENT_TEST \| INPUT_SANITIZATION_TEST \| FIREWALL_CHECK \| APP_KEY_CHECK \| DEBUG_MODE_CHECK |
| `target` | `String?` | @db.VarChar(500) | — |
| `status` | `String` | @default("PENDING") @db.VarChar(20) | PENDING \| RUNNING \| PASSED \| FAILED \| WARNING \| SKIPPED |
| `result` | `String?` | @db.Text | — |
| `evidence` | `String?` | @db.Text | — |
| `severity` | `String?` | @db.VarChar(20) | — |
| `startedAt` | `DateTime?` | — | — |
| `completedAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `assessment` | [`SecurityAssessment`](#securityassessment) | one | `assessmentId` → `id` | Cascade |
| `findings` | [`SecurityFinding`](#securityfinding) | many | _back-reference_ | — |

**Referenced by:** [`SecurityAssessment`](#securityassessment).`scans` · [`SecurityFinding`](#securityfinding).`scan`

**Indexes**

- index `[assessmentId]`
- index `[phase]`
- index `[scanType]`

### Session

_Table `session` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `userId` | `String` | @db.VarChar(36) | — |
| `refreshToken` | `String` | @unique @db.VarChar(255) | — |
| `ipAddress` | `String?` | @db.VarChar(45) | — |
| `userAgent` | `String?` | @db.VarChar(255) | — |
| `isActive` | `Boolean` | @default(true) | — |
| `expiresAt` | `DateTime` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `lastUsedAt` | `DateTime` | @default(now()) | — |
| `revokedAt` | `DateTime?` | — | — |

**Indexes**

- index `[userId]`
- index `[isActive]`
- index `[expiresAt]`

### Setting

_Table `setting` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `key` | `String` | @unique @db.VarChar(100) | — |
| `value` | `String` | @db.LongText | — |
| `type` | `String` | @default("text") @db.VarChar(20) | — |
| `categoryId` | `String` | — | — |
| `groupId` | `String?` | — | — |
| `companyId` | `String?` | — | — |
| `defaultValue` | `String?` | @db.LongText | — |
| `options` | `String?` | @db.LongText | — |
| `isRequired` | `Boolean` | @default(false) | — |
| `isGlobal` | `Boolean` | @default(false) | — |
| `isEncrypted` | `Boolean` | @default(false) | — |
| `sortOrder` | `Int` | @default(0) | — |
| `placeholder` | `String?` | @db.VarChar(200) | — |
| `hint` | `String?` | @db.VarChar(500) | — |
| `module` | `String?` | @db.VarChar(50) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `category` | [`SettingCategory`](#settingcategory) | one | `categoryId` → `id` | Cascade |
| `group` | [`SettingGroup`](#settinggroup) | optional one | `groupId` → `id` | SetNull |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`modularSettings` · [`SettingCategory`](#settingcategory).`settings` · [`SettingGroup`](#settinggroup).`settings`

**Indexes**

- index `[categoryId]`
- index `[groupId]`
- index `[companyId]`
- index `[module]`

### SettingCategory

_Table `setting_category` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `key` | `String` | @unique @db.VarChar(50) | — |
| `name` | `String` | @db.VarChar(100) | — |
| `description` | `String?` | @db.VarChar(200) | — |
| `icon` | `String?` | @db.VarChar(50) | — |
| `sortOrder` | `Int` | @default(0) | — |
| `isActive` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `groups` | [`SettingGroup`](#settinggroup) | many | _back-reference_ | — |
| `settings` | [`Setting`](#setting) | many | _back-reference_ | — |

**Referenced by:** [`Setting`](#setting).`category` · [`SettingGroup`](#settinggroup).`category`

**Indexes**

- index `[sortOrder]`

### SettingGroup

_Table `setting_group` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `categoryId` | `String` | — | — |
| `key` | `String` | @db.VarChar(50) | — |
| `name` | `String` | @db.VarChar(100) | — |
| `description` | `String?` | @db.VarChar(200) | — |
| `sortOrder` | `Int` | @default(0) | — |
| `isActive` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `category` | [`SettingCategory`](#settingcategory) | one | `categoryId` → `id` | Cascade |
| `settings` | [`Setting`](#setting) | many | _back-reference_ | — |

**Referenced by:** [`Setting`](#setting).`group` · [`SettingCategory`](#settingcategory).`groups`

**Indexes**

- unique `[categoryId, key]`
- index `[categoryId]`

### SettingInput

Centralized UI input definitions for settings. Decouples input metadata (options, validation, layout) from Setting rows.

_Table `setting_input` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `settingKey` | `String` | @unique @db.VarChar(100) | — |
| `component` | `String?` | @db.VarChar(50) | — |
| `options` | `String?` | @db.LongText | — |
| `validation` | `String?` | @db.LongText | — |
| `placeholder` | `String?` | @db.VarChar(200) | — |
| `hint` | `String?` | @db.VarChar(500) | — |
| `helpUrl` | `String?` | @db.VarChar(500) | — |
| `dependsOn` | `String?` | @db.VarChar(100) | — |
| `dependsValue` | `String?` | @db.VarChar(100) | — |
| `sortOrder` | `Int` | @default(0) | — |
| `isVisible` | `Boolean` | @default(true) | — |
| `isReadonly` | `Boolean` | @default(false) | — |
| `isRequired` | `Boolean` | @default(false) | — |
| `layout` | `String?` | @db.VarChar(20) | — |
| `cssClass` | `String?` | @db.VarChar(200) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

### SettingValue

Database-backed key-value mapping for setting values. Decouples setting values from setting definitions. Supports global (companyId IS NULL) and company-scoped values.

_Table `setting_value` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `key` | `String` | @db.VarChar(100) | — |
| `value` | `String` | @db.LongText | — |
| `companyId` | `String?` | — | — |
| `scope` | `String` | @default("global") @db.VarChar(20) | — |
| `type` | `String?` | @db.VarChar(20) | — |
| `isEncrypted` | `Boolean` | @default(false) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`companySettingValues`

**Indexes**

- unique `[key, companyId]`
- index `[key]`
- index `[companyId]`
- index `[scope]`

### Shift

_Table `shift` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `startTime` | `String` | @db.VarChar(10) | — |
| `endTime` | `String` | @db.VarChar(10) | — |
| `departmentId` | `String?` | — | — |
| `companyId` | `String?` | — | — |
| `isActive` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `employee` | [`Employee`](#employee) | many | _back-reference_ | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `department` | [`Department`](#department) | optional one | `departmentId` → `id` | — |

**Referenced by:** [`Company`](#company).`shift` · [`Department`](#department).`shift` · [`Employee`](#employee).`shift`

**Indexes**

- index `[companyId]`
- index `[departmentId]`

### SigtaxProjectionJournal

_Table `sigtax_projection_journal` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `canonicalJournalEntryId` | `String` | — | — |
| `companyId` | `String` | — | — |
| `projectionEngine` | `ProjectionEngine` | @default(SIGTAX) | — |
| `adjustedDebit` | `Decimal` | @db.Decimal(15, 2) | — |
| `adjustedCredit` | `Decimal` | @db.Decimal(15, 2) | — |
| `reconciliationAdjustmentCode` | `ReconciliationAdjustmentCode` | @default(DEFAULT) | — |
| `reconciledAt` | `DateTime` | @default(now()) | — |

**Indexes**

- index `[canonicalJournalEntryId]`
- index `[companyId]`
- index `[reconciledAt]`

### SoftwareAmortizationRow

_Table `software_amortization_row` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `softwareAssetId` | `String` | — | — |
| `period` | `String` | // YYYY-MM | — |
| `openingCarrying` | `Decimal` | @db.Decimal(15, 2) | — |
| `amortizationCharge` | `Decimal` | @db.Decimal(15, 2) | — |
| `closingCarrying` | `Decimal` | @db.Decimal(15, 2) | — |
| `journalEntryId` | `String?` | — | — |
| `status` | `AmortRowStatus` | @default(SCHEDULED) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `softwareAsset` | [`SoftwareAsset`](#softwareasset) | one | `softwareAssetId` → `id` | Cascade |

**Referenced by:** [`SoftwareAsset`](#softwareasset).`amortizationRows`

**Indexes**

- unique `[softwareAssetId, period]`
- index `[period, status]`

### SoftwareAsset

_Table `software_asset` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `code` | `String` | — | — |
| `name` | `String` | — | — |
| `phase` | `SoftwarePhase` | — | — |
| `cost` | `Decimal` | @db.Decimal(15, 2) | — |
| `usefulLifeMonths` | `Int` | — | — |
| `amortizationStartDate` | `DateTime` | — | — |
| `carryingAmount` | `Decimal` | @db.Decimal(15, 2) | — |
| `status` | `SoftwareAssetStatus` | @default(ACTIVE) | — |
| `companyId` | `String` | — | — |
| `createdBy` | `String` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `workItems` | [`SoftwareWorkItem`](#softwareworkitem) | many | _back-reference_ | — |
| `amortizationRows` | [`SoftwareAmortizationRow`](#softwareamortizationrow) | many | _back-reference_ | — |

**Referenced by:** [`SoftwareAmortizationRow`](#softwareamortizationrow).`softwareAsset` · [`SoftwareWorkItem`](#softwareworkitem).`asset`

**Indexes**

- unique `[code, companyId]`
- index `[companyId, status]`

### SoftwareWorkItem

_Table `software_work_item` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `assetId` | `String?` | — | — |
| `description` | `String` | — | — |
| `phase` | `SoftwareWorkPhase` | — | — |
| `cost` | `Decimal` | @db.Decimal(15, 2) | — |
| `classificationStatus` | `ClassificationStatus` | @default(PENDING) | — |
| `evidenceRefs` | `Json` | — | — |
| `companyId` | `String` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `asset` | [`SoftwareAsset`](#softwareasset) | optional one | `assetId` → `id` | — |
| `capitalizationDecision` | [`CapitalizationDecision`](#capitalizationdecision) | optional one | _back-reference_ | — |

**Referenced by:** [`CapitalizationDecision`](#capitalizationdecision).`workItem` · [`SoftwareAsset`](#softwareasset).`workItems`

**Indexes**

- index `[companyId, classificationStatus]`

### SrmDevice

_Table `srm_device` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `deviceSerialNo` | `String` | @unique @db.VarChar(100) | Manufacturer serial number embossed on device |
| `deviceModel` | `String` | @db.VarChar(100) | ERCA-accredited model (e.g. "Sunmi T2", "EPSON TM-T88VI") |
| `tassDeviceId` | `String?` | @db.VarChar(100) | TASS-assigned device ID — affixed as visible sticker on device |
| `registrationCode` | `String?` | @db.VarChar(100) | Machine registration code from TASS accreditation sticker |
| `tin` | `String` | @db.VarChar(20) | TIN of the registered business |
| `businessAddress` | `String` | @db.VarChar(500) | — |
| `status` | `String` | @default("ACTIVE") @db.VarChar(20) | ACTIVE \| SUSPENDED \| DECOMMISSIONED |
| `lastZReportDate` | `DateTime?` | — | Last Z-report date (daily fiscal closure) |
| `lastXReportDate` | `DateTime?` | — | Last X-report date (intraday totals) |
| `fiscalMemoryUsedPct` | `Decimal?` | @db.Decimal(5, 2) | — |
| `serviceContractRef` | `String?` | @db.VarChar(200) | — |
| `serviceContractExpiry` | `DateTime?` | — | — |
| `notes` | `String?` | @db.Text | — |
| `registeredAt` | `DateTime` | @default(now()) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[status]`

### StampDutyRecord

Stamp Duty — Proclamation No. 110/1998

_Table `stamp_duty_record` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `documentType` | `String` | @db.VarChar(50) | — |
| `documentDescription` | `String` | @db.VarChar(500) | — |
| `documentDate` | `DateTime` | — | — |
| `transactionValue` | `Decimal?` | @db.Decimal(18, 2) | — |
| `stampDutyAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `status` | `StampDutyStatus` | @default(DRAFT) | — |
| `paymentDate` | `DateTime?` | — | — |
| `paymentReference` | `String?` | @db.VarChar(200) | — |
| `municipality` | `String?` | @db.VarChar(100) | — |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Indexes**

- index `[companyId]`
- index `[status]`

### StockDemandByOrder

Stock demand by order — tracks reserved/demanded stock per order and dispatch

_Table `stock_demand_by_order` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `warehouseId` | `String?` | @db.VarChar(36) | — |
| `itemId` | `String?` | @db.VarChar(36) | — |
| `sourceType` | `String` | @default("ORDER") @db.VarChar(20) | ORDER \| TRANSFER \| PURCHASE_RETURN |
| `sourceOrderId` | `String?` | @db.VarChar(36) | — |
| `sourceDispatchId` | `String?` | @db.VarChar(36) | — |
| `salesOrderId` | `String?` | — | — |
| `dispatchDocketId` | `String?` | — | — |
| `demandedQty` | `Decimal` | @default(0) @db.Decimal(18, 4) | — |
| `remainingQtyToInvoice` | `Decimal` | @default(0) @db.Decimal(18, 4) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `SalesOrder` | [`SalesOrder`](#salesorder) | optional one | `salesOrderId` → `id` | — |
| `DispatchDocket` | [`DispatchDocket`](#dispatchdocket) | optional one | `dispatchDocketId` → `id` | — |

**Referenced by:** [`DispatchDocket`](#dispatchdocket).`StockDemand` · [`SalesOrder`](#salesorder).`StockDemand`

**Indexes**

- index `[companyId]`
- index `[salesOrderId]`
- index `[dispatchDocketId]`
- index `[itemId]`

### StockMovement

_Table `stock_movement` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `itemId` | `String` | — | — |
| `type` | `StockMovementType` | — | — |
| `quantity` | `Decimal` | @db.Decimal(19, 4) | — |
| `unitCost` | `Decimal` | @db.Decimal(19, 4) | — |
| `reference` | `String?` | @db.VarChar(200) | — |
| `warehouseFrom` | `String?` | @db.VarChar(100) | — |
| `warehouseTo` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`stockMovements`

**Indexes**

- index `[companyId]`
- index `[itemId]`

### StockTransaction

_Table `stocktransaction` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `itemId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `type` | `String` | @db.VarChar(20) | — |
| `quantity` | `Int` | — | — |
| `unitCost` | `Decimal` | — | — |
| `reference` | `String?` | @db.VarChar(100) | — |
| `date` | `DateTime` | @default(now()) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `item` | [`Item`](#item) | one | `itemId` → `id` | Cascade |

**Referenced by:** [`Item`](#item).`stockTransaction`

**Indexes**

- index `[companyId]`
- index `[date]`
- index `[itemId]`

### StockValuationLayer

_Table `stock_valuation_layer` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `itemId` | `String` | @db.VarChar(36) | — |
| `companyId` | `String?` | — | — |
| `warehouseId` | `String?` | @db.VarChar(36) | — |
| `transactionType` | `String` | @default("RECEIPT") @db.VarChar(20) | RECEIPT \| ISSUE \| ADJUSTMENT \| OPENING |
| `valuationMethod` | `String` | @default("AVCO") @db.VarChar(10) | FIFO \| AVCO |
| `date` | `DateTime` | @default(now()) | — |
| `quantity` | `Decimal` | @db.Decimal(18, 4) | — |
| `unitCost` | `Decimal` | @db.Decimal(18, 4) | — |
| `totalCost` | `Decimal` | @db.Decimal(18, 4) | — |
| `remainingQty` | `Decimal` | @default(0) @db.Decimal(18, 4) | For FIFO: remaining quantity in this layer not yet consumed |
| `runningAvco` | `Decimal?` | @db.Decimal(18, 4) | Running AVCO after this transaction |
| `runningQty` | `Decimal?` | @db.Decimal(18, 4) | Running total quantity after this transaction |
| `runningValue` | `Decimal?` | @db.Decimal(18, 4) | Running total value after this transaction |
| `reference` | `String?` | @db.VarChar(100) | — |
| `journalEntryId` | `String?` | @db.VarChar(36) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Indexes**

- index `[itemId]`
- index `[companyId]`
- index `[date]`

### SubscriptionUpdate

_Table `subscription_update` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `currentVersion` | `String` | @db.VarChar(50) | — |
| `latestVersion` | `String` | @db.VarChar(50) | — |
| `deploymentType` | `String` | @default("CLOUD") @db.VarChar(20) | — |
| `status` | `String` | @default("PENDING") @db.VarChar(50) | — |
| `changelog` | `String?` | @db.Text | — |
| `downloadUrl` | `String?` | @db.VarChar(500) | — |
| `releaseNotesUrl` | `String?` | @db.VarChar(500) | — |
| `notifiedAt` | `DateTime?` | — | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`subscriptionUpdate`

**Indexes**

- index `[companyId]`
- index `[status]`

### SyncQueue

_Table `sync_queue` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `entityType` | `String` | @db.VarChar(100) | — |
| `entityId` | `String` | @db.VarChar(36) | — |
| `action` | `String` | @db.VarChar(20) | — |
| `payload` | `String` | @db.LongText | — |
| `status` | `SyncStatus` | @default(PENDING) | — |
| `attempts` | `Int` | @default(0) | — |
| `lastError` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`syncQueues`

**Indexes**

- index `[companyId, status]`
- index `[entityType, entityId]`

### systemsetting

_Table `systemsetting` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id | — |
| `key` | `String` | @unique(map: "SystemSetting_key_key") | — |
| `value` | `String` | @db.LongText | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

### TaxAuditLog

_Table `taxauditlog` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `declarationId` | `String` | — | — |
| `userId` | `String` | @db.VarChar(36) | — |
| `action` | `String` | @db.VarChar(100) | — |
| `previousPayload` | `String?` | @db.LongText | — |
| `currentPayload` | `String?` | @db.LongText | — |
| `digitalSignature` | `String?` | @db.VarChar(64) | — |
| `timestamp` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `declaration` | [`VatDeclaration`](#vatdeclaration) | one | `declarationId` → `id` | Cascade |

**Referenced by:** [`VatDeclaration`](#vatdeclaration).`auditLogs`

**Indexes**

- index `[declarationId]`

### TaxClearanceRequest

_Table `tax_clearance_request` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `purpose` | `String` | @db.VarChar(50) | LICENCE_RENEWAL \| PUBLIC_TENDER \| BANK_LOAN \| VEHICLE_REGISTRATION \| ASSET_TRANSFER \| BUSINESS_CLOSURE \| SHARE_TRANSFER \| OTHER |
| `purposeDescription` | `String?` | @db.VarChar(500) | — |
| `requestDate` | `DateTime` | @default(now()) | — |
| `submittedToERCA` | `Boolean` | @default(false) | — |
| `submittedDate` | `DateTime?` | — | — |
| `clearanceRef` | `String?` | @db.VarChar(100) | Reference number from ERCA when clearance is issued |
| `issueDate` | `DateTime?` | — | — |
| `validUntil` | `DateTime?` | — | For public tender or bank loan: 6 months validity For asset/business transfers: 3 months validity |
| `status` | `String` | @default("REQUESTED") @db.VarChar(30) | REQUESTED \| UNDER_REVIEW \| AUDIT_IN_PROGRESS \| ISSUED \| REJECTED \| EXPIRED |
| `rejectionReason` | `String?` | @db.VarChar(500) | — |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[status]`
- index `[purpose]`

### TaxDisputeCase

_Table `tax_dispute_case` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `assessmentRef` | `String?` | @db.VarChar(200) | Reference to the original tax assessment (VatFiling, IncomeTaxFiling, etc.) |
| `assessmentType` | `String` | @db.VarChar(50) // VAT \| BIT \| WHT \| PAYE \| etc. | — |
| `assessmentAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `disputedAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `undisputedPaid` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `currentStage` | `String` | @default("REVIEW") @db.VarChar(30) | REVIEW \| TAC \| HIGH_COURT \| SUPREME_COURT \| CLOSED |
| `objectionFiledDate` | `DateTime?` | — | — |
| `objectionDeadline` | `DateTime?` | — | Deadline: 21 days after notice of assessment |
| `reviewDecisionDate` | `DateTime?` | — | — |
| `reviewDecisionOutcome` | `String?` | @db.VarChar(200) | — |
| `tacFiledDate` | `DateTime?` | — | — |
| `tacDepositPaid` | `Decimal` | @default(0) @db.Decimal(18, 2) | 50% of disputed tax must be paid before TAC appeal |
| `tacDecisionDate` | `DateTime?` | — | — |
| `tacDecisionOutcome` | `String?` | @db.VarChar(200) | — |
| `highCourtFiledDate` | `DateTime?` | — | — |
| `highCourtDepositPaid` | `Decimal` | @default(0) @db.Decimal(18, 2) | 75% of disputed tax must be paid before High Court |
| `highCourtDecisionDate` | `DateTime?` | — | — |
| `highCourtDecisionOutcome` | `String?` | @db.VarChar(200) | — |
| `supremeCourtFiledDate` | `DateTime?` | — | — |
| `supremeCourtDecision` | `String?` | @db.VarChar(200) | — |
| `finalOutcome` | `String?` | @db.VarChar(200) | — |
| `status` | `String` | @default("OPEN") @db.VarChar(20) | OPEN \| WON \| PARTIALLY_WON \| LOST \| WITHDRAWN |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[status]`
- index `[currentStage]`

### TaxGlAccount

Canonical GL account codes used exclusively for tax journal entries. Seeded by universal_tax_config.sql. Must be cross-referenced with Account.code on first-use provisioning.

_Table `tax_gl_account` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `code` | `String` | @unique @db.VarChar(10) | — |
| `name` | `String` | @db.VarChar(120) | — |
| `type` | `String` | @db.VarChar(10) | ASSET \| LIABILITY \| EQUITY \| REVENUE \| EXPENSE |
| `normalBalance` | `String` | @db.VarChar(6) | DEBIT \| CREDIT |
| `ifrs18Category` | `String?` | @db.VarChar(15) | OPERATING \| INVESTING \| FINANCING \| INCOME_TAX \| DISCONTINUED |
| `ias12Treatment` | `String?` | @db.VarChar(20) | CURRENT_TAX \| DEFERRED_TAX \| NOT_INCOME_TAX |
| `description` | `String?` | @db.Text | — |
| `isActive` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

### TaxLossCarryforward

_Table `tax_loss_carryforward` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `lossYear` | `Int` | — | The tax year in which the loss was incurred (EFY fiscal year number) |
| `lossAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | Original loss amount |
| `utilizedAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | Amount utilized so far across subsequent years |
| `remainingAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | Remaining loss available to carry forward |
| `expiryYear` | `Int` | — | Year in which this loss expires (lossYear + 5) |
| `booksAudited` | `Boolean` | @default(false) | Whether the books were audited and accepted (required for carry forward) |
| `externalAuditor` | `String?` | @db.VarChar(200) | — |
| `status` | `String` | @default("AVAILABLE") @db.VarChar(20) | AVAILABLE \| PARTIALLY_USED \| FULLY_USED \| EXPIRED \| DISALLOWED |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `utilizations` | [`LossUtilization`](#lossutilization) | many | _back-reference_ | — |

**Referenced by:** [`LossUtilization`](#lossutilization).`loss`

**Indexes**

- unique `[companyId, lossYear]`
- index `[companyId]`
- index `[status]`

### taxrate

_Table `tax_rate` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id | — |
| `name` | `String` | @unique(map: "TaxRate_name_key") | — |
| `rate` | `Decimal` | — | — |
| `type` | `taxrate_type` | @default(VAT) | — |
| `calculationType` | `tax_calc_type` | @default(NORMAL) | — |
| `appliesTo` | `String?` | @db.LongText | — |
| `description` | `String?` | — | — |
| `isActive` | `Boolean` | @default(true) | — |
| `isInclusive` | `Boolean` | @default(false) | — |
| `isCompound` | `Boolean` | @default(false) | — |
| `compoundParentId` | `String?` | — | — |
| `specificAmount` | `Decimal?` | @db.Decimal(18, 2) | — |
| `roundingRule` | `String?` | @db.VarChar(20) @default("HALF_UP") | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `compoundParent` | [`taxrate`](#taxrate) | optional one | `compoundParentId` → `id` | — |
| `compounds` | [`taxrate`](#taxrate) | many | _back-reference_ | — |

**Referenced by:** [`taxrate`](#taxrate).`compoundParent` · [`taxrate`](#taxrate).`compounds`

**Indexes**

- index `[type]`
- index `[calculationType]`
- index `[isActive]`

### TaxRule

Canonical tax rule — one row per TaxTypeCode. Seeded by universal_tax_config.sql. Read-only in production. All rate/threshold changes must go through a migration + audit log.

_Table `tax_rule` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `code` | `String` | @unique @db.VarChar(30) | TaxTypeCode enum value — unique business key |
| `name` | `String` | @db.VarChar(120) | — |
| `label` | `String` | @db.VarChar(60) | — |
| `rate` | `Decimal` | @default(0) | — |
| `specificRateEtb` | `Decimal?` | @db.Decimal(12, 4) | — |
| `thresholdEtb` | `Decimal` | @default(0) | — |
| `annualTurnoverThresholdEtb` | `Decimal?` | — | — |
| `direction` | `String` | @default("BOTH") @db.VarChar(6) | OUTPUT \| INPUT \| BOTH |
| `ias12Treatment` | `String` | @db.VarChar(20) | CURRENT_TAX \| DEFERRED_TAX \| NOT_INCOME_TAX |
| `ifrs18Category` | `String` | @default("OPERATING") @db.VarChar(15) | OPERATING \| INVESTING \| FINANCING \| INCOME_TAX \| DISCONTINUED |
| `glDebitCode` | `String` | @db.VarChar(10) | — |
| `glCreditCode` | `String` | @db.VarChar(10) | — |
| `glDebitName` | `String` | @db.VarChar(120) | — |
| `glCreditName` | `String` | @db.VarChar(120) | — |
| `frequency` | `String` | @db.VarChar(20) | MONTHLY \| QUARTERLY \| ANNUAL \| AT_TRANSACTION \| AT_CLEARANCE |
| `deadline` | `String` | @db.VarChar(200) | — |
| `portal` | `String` | @default("ETAX") @db.VarChar(15) | ETAX \| TASS \| CUSTOMS \| PFSA \| MUNICIPALITY |
| `automation` | `String` | @default("MANUAL") @db.VarChar(10) | FULL \| PARTIAL \| MANUAL |
| `proclamation` | `String` | @db.VarChar(300) | — |
| `enabledDefault` | `Boolean` | @default(true) | — |
| `overridable` | `Boolean` | @default(true) | — |
| `notes` | `String?` | @db.Text | — |
| `isActive` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Indexes**

- index `[isActive]`

### TelecomReceiptCache

_Table `telecomreceiptcache` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `reference` | `String?` | @db.VarChar(200) | — |
| `ref` | `String?` | @unique(map: "TelecomReceiptCache_ref_key") @db.VarChar(100) | — |
| `payload` | `String` | @db.LongText | — |
| `rawHtml` | `String?` | @db.LongText | — |
| `parsedJson` | `String?` | @db.LongText | — |
| `fetchedAt` | `DateTime?` | — | — |
| `expiresAt` | `DateTime` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Indexes**

- index `[expiresAt]`
- index `[reference]`

### ThinCapMonitor

_Table `thin_cap_monitor` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `taxYear` | `Int` | — | — |
| `averageDebt` | `Decimal` | @default(0) @db.Decimal(18, 2) | Average total debt for the year |
| `averageEquity` | `Decimal` | @default(0) @db.Decimal(18, 2) | Average total equity for the year |
| `debtToEquityRatio` | `Decimal` | @default(0) @db.Decimal(10, 4) | — |
| `thresholdRatio` | `Decimal` | @default(2.00) @db.Decimal(10, 4) | 2:1 threshold |
| `exceedsThreshold` | `Boolean` | @default(false) | — |
| `totalInterestExpense` | `Decimal` | @default(0) @db.Decimal(18, 2) | Total interest expense for the year |
| `armsLengthDebt` | `Decimal?` | @db.Decimal(18, 2) | Arm's length debt amount (if exceeds 2:1 but within arm's length, still allowed) |
| `disallowedInterest` | `Decimal` | @default(0) @db.Decimal(18, 2) | Interest disallowed (proportionate to excess debt over threshold or arm's length) |
| `allowedInterest` | `Decimal` | @default(0) @db.Decimal(18, 2) | Interest allowed as deduction |
| `foreignControlled` | `Boolean` | @default(false) | Whether >50% of membership interest is held by non-residents |
| `assessedBy` | `String?` | @db.VarChar(100) | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- unique `[companyId, taxYear]`
- index `[companyId]`

### Ticket

_Table `ticket` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `ticketNumber` | `String` | @unique @db.VarChar(30) | — |
| `status` | `String` | @default("OPEN") @db.VarChar(20) | OPEN \| IN_PROGRESS \| WAITING \| RESOLVED \| CLOSED |
| `priority` | `String` | @default("MEDIUM") @db.VarChar(20) | LOW \| MEDIUM \| HIGH \| URGENT |
| `category` | `String` | @default("GENERAL") @db.VarChar(50) | BILLING \| TECHNICAL \| HR \| PAYROLL \| TAX \| GENERAL \| OTHER |
| `subject` | `String` | @db.VarChar(300) | — |
| `description` | `String` | @db.Text | — |
| `requesterName` | `String?` | @db.VarChar(200) | Name of the person who raised the ticket |
| `requesterEmail` | `String?` | @db.VarChar(200) | — |
| `assignedTo` | `String?` | @db.VarChar(100) | User ID of the assignee |
| `assigneeName` | `String?` | @db.VarChar(200) | — |
| `companyId` | `String?` | — | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `resolvedAt` | `DateTime?` | — | — |
| `closedAt` | `DateTime?` | — | — |
| `dueDate` | `DateTime?` | — | — |
| `tags` | `String?` | @db.VarChar(500) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `ticketReply` | [`TicketReply`](#ticketreply) | many | _back-reference_ | — |

**Referenced by:** [`Company`](#company).`ticket` · [`TicketReply`](#ticketreply).`ticket`

**Indexes**

- index `[companyId]`
- index `[status]`
- index `[priority]`
- index `[assignedTo]`

### TicketReply

_Table `ticket_reply` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `ticketId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `content` | `String` | @db.Text | — |
| `authorId` | `String?` | @db.VarChar(100) | — |
| `authorName` | `String?` | @db.VarChar(200) | — |
| `type` | `String` | @default("REPLY") @db.VarChar(20) | REPLY \| NOTE \| STATUS_CHANGE |
| `isInternal` | `Boolean` | @default(false) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `ticket` | [`Ticket`](#ticket) | one | `ticketId` → `id` | Cascade |

**Referenced by:** [`Ticket`](#ticket).`ticketReply`

**Indexes**

- index `[companyId]`
- index `[ticketId]`

### TokenBlacklist

_Table `token_blacklist` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `jti` | `String` | @unique @db.VarChar(100) | — |
| `userId` | `String?` | @db.VarChar(36) | — |
| `expiresAt` | `DateTime` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Indexes**

- index `[jti]`
- index `[userId]`
- index `[expiresAt]`

### TotFiling

Turnover Tax (TOT) filing — Category B taxpayers (annual revenue < ETB 2M) Proclamation No. 1395/2025: 2% on goods, 10% on services, due 30th of following month

_Table `totfiling` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `period` | `String` | @db.VarChar(7) | — |
| `goodsAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `servicesAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `totGoods` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `totServices` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `netPayable` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `paid` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `status` | `String` | @default("DRAFT") @db.VarChar(30) | — |
| `filedAt` | `DateTime?` | — | — |
| `dueDate` | `DateTime?` | — | — |
| `eTaxReference` | `String?` | @db.VarChar(100) | — |
| `notes` | `String?` | @db.Text | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`totFiling`

**Indexes**

- unique `[companyId, period]`
- index `[companyId]`

### TradeDocument

Documents attached to a shipment (commercial invoice, packing list, etc.)

_Table `trade_document` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `shipmentId` | `String` | — | — |
| `docType` | `String` | @db.VarChar(50) | COMMERCIAL_INVOICE \| PACKING_LIST \| BILL_OF_LADING \| AIRWAY_BILL \| CERTIFICATE_OF_ORIGIN \| IMPORT_PERMIT \| EXPORT_PERMIT \| PHYTOSANITARY \| CUSTOMS_DECLARATION \| FOREX_APPROVAL \| OTHER |
| `fileName` | `String` | @db.VarChar(255) | — |
| `mimeType` | `String?` | @db.VarChar(100) | — |
| `fileSize` | `Int?` | — | — |
| `fileData` | `String?` | @db.LongText | — |
| `status` | `String` | @default("PENDING") @db.VarChar(20) | — |
| `verifiedAt` | `DateTime?` | — | — |
| `verifiedBy` | `String?` | @db.VarChar(100) | — |
| `notes` | `String?` | @db.VarChar(500) | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `shipment` | [`TradeShipment`](#tradeshipment) | one | `shipmentId` → `id` | Cascade |

**Referenced by:** [`TradeShipment`](#tradeshipment).`documents`

**Indexes**

- index `[shipmentId]`
- index `[docType]`

### TradeLicense

Trade license / business registration record

_Table `trade_license` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `licenseType` | `String` | @db.VarChar(100) | — |
| `licenseNumber` | `String` | @unique @db.VarChar(100) | — |
| `issuingAuthority` | `String?` | @db.VarChar(200) | — |
| `issuedDate` | `DateTime?` | — | — |
| `expiryDate` | `DateTime?` | — | — |
| `status` | `String` | @default("ACTIVE") @db.VarChar(20) | ACTIVE \| EXPIRED \| SUSPENDED \| REVOKED |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[status]`

### TradeShipment

Represents a full import or export shipment lifecycle

_Table `trade_shipment` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `direction` | `String` | @db.VarChar(10) | IMPORT \| EXPORT |
| `referenceNo` | `String` | @unique @db.VarChar(100) | — |
| `status` | `String` | @default("DRAFT") @db.VarChar(30) | DRAFT \| LICENSED \| TIN_REGISTERED \| BANKING \| PROFORMA \| FOREX_APPROVED \| PERMITS_OBTAINED \| IN_TRANSIT \| DECLARED \| CUSTOMS_CLEARED \| RELEASED \| COMPLETED \| CANCELLED |
| `hsCode` | `String?` | @db.VarChar(20) | Harmonized System code (HS code) |
| `hsDescription` | `String?` | @db.VarChar(300) | — |
| `goodsDescription` | `String?` | @db.Text | Goods description |
| `originCountry` | `String?` | @db.VarChar(100) | Country of origin / destination |
| `destinationCountry` | `String?` | @db.VarChar(100) | — |
| `portOfLoading` | `String?` | @db.VarChar(100) | Port of loading / discharge |
| `portOfDischarge` | `String?` | @db.VarChar(100) | — |
| `incoterms` | `String?` | @db.VarChar(10) | Incoterms (FOB, CIF, EXW, etc.) |
| `invoiceValue` | `Decimal` | @default(0) @db.Decimal(18, 2) | Total invoice value (ETB equivalent) |
| `currencyCode` | `String` | @default("USD") @db.VarChar(3) | — |
| `customsDuty` | `Decimal` | @default(0) @db.Decimal(18, 2) | Customs duty amount |
| `importVat` | `Decimal` | @default(0) @db.Decimal(18, 2) | VAT on import |
| `exciseDuty` | `Decimal` | @default(0) @db.Decimal(18, 2) | Excise duty |
| `withholdingTax` | `Decimal` | @default(0) @db.Decimal(18, 2) | Withholding tax |
| `totalTaxes` | `Decimal` | @default(0) @db.Decimal(18, 2) | Total tax burden |
| `inspectionLane` | `String?` | @db.VarChar(10) | RED \| GREEN \| YELLOW (customs risk lane) |
| `eswDeclarationNo` | `String?` | @db.VarChar(100) | ESW Portal declaration number |
| `billOfLadingNo` | `String?` | @db.VarChar(100) | Bill of lading / airway bill number |
| `eta` | `DateTime?` | — | Estimated arrival date |
| `ata` | `DateTime?` | — | Actual arrival date |
| `clearedAt` | `DateTime?` | — | Customs clearance date |
| `releasedAt` | `DateTime?` | — | Goods release date |
| `companyId` | `String?` | — | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `documents` | [`TradeDocument`](#tradedocument) | many | _back-reference_ | — |
| `steps` | [`TradeShipmentStep`](#tradeshipmentstep) | many | _back-reference_ | — |
| `forexApprovals` | [`ForexApproval`](#forexapproval) | many | _back-reference_ | — |

**Referenced by:** [`ForexApproval`](#forexapproval).`shipment` · [`TradeDocument`](#tradedocument).`shipment` · [`TradeShipmentStep`](#tradeshipmentstep).`shipment`

**Indexes**

- index `[companyId]`
- index `[status]`
- index `[direction]`
- index `[hsCode]`

### TradeShipmentStep

Individual pipeline step for a shipment

_Table `trade_shipment_step` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `shipmentId` | `String` | — | — |
| `stepKey` | `String` | @db.VarChar(50) | Step key: LICENSING, TIN_VAT, BANKING, PROFORMA, FOREX, PERMITS, SHIPMENT, DECLARATION, CUSTOMS, RELEASE |
| `stepLabel` | `String` | @db.VarChar(200) | — |
| `status` | `String` | @default("PENDING") @db.VarChar(20) | PENDING \| IN_PROGRESS \| COMPLETED \| FAILED \| SKIPPED |
| `completedAt` | `DateTime?` | — | — |
| `completedBy` | `String?` | @db.VarChar(100) | — |
| `notes` | `String?` | @db.Text | — |
| `metadata` | `String?` | @db.LongText | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `shipment` | [`TradeShipment`](#tradeshipment) | one | `shipmentId` → `id` | Cascade |

**Referenced by:** [`TradeShipment`](#tradeshipment).`steps`

**Indexes**

- index `[shipmentId]`
- index `[stepKey]`

### TransferOrder

_Table `transferorder` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `reference` | `String` | @unique @db.VarChar(100) | — |
| `fromWarehouseId` | `String` | — | — |
| `toWarehouseId` | `String` | — | — |
| `status` | `String` | @default("DRAFT") @db.VarChar(20) | — |
| `notes` | `String?` | @db.Text | — |
| `companyId` | `String?` | — | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `approvedBy` | `String?` | @db.VarChar(100) | — |
| `approvedAt` | `DateTime?` | — | — |
| `completedAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `fromWarehouse` | [`Warehouse`](#warehouse) | one | `fromWarehouseId` → `id` | — |
| `toWarehouse` | [`Warehouse`](#warehouse) | one | `toWarehouseId` → `id` | — |
| `items` | [`TransferOrderItem`](#transferorderitem) | many | _back-reference_ | — |

**Referenced by:** [`TransferOrderItem`](#transferorderitem).`transferOrder` · [`Warehouse`](#warehouse).`transfersFrom` · [`Warehouse`](#warehouse).`transfersTo`

**Indexes**

- index `[companyId]`
- index `[status]`

### TransferOrderItem

_Table `transferorderitem` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `transferOrderId` | `String` | — | — |
| `itemId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `quantity` | `Int` | — | — |
| `unitCost` | `Decimal` | @default(0.000000000000000000000000000000) | — |
| `notes` | `String?` | @db.VarChar(300) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `transferOrder` | [`TransferOrder`](#transferorder) | one | `transferOrderId` → `id` | Cascade |
| `item` | [`Item`](#item) | one | `itemId` → `id` | — |

**Referenced by:** [`Item`](#item).`transferOrderItems` · [`TransferOrder`](#transferorder).`items`

**Indexes**

- index `[companyId]`
- index `[transferOrderId]`
- index `[itemId]`

### TransferPricingRecord

_Table `transfer_pricing_record` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `taxYear` | `Int` | — | — |
| `relatedPartyName` | `String` | @db.VarChar(255) | — |
| `relatedPartyCountry` | `String?` | @db.VarChar(100) | — |
| `relatedPartyTin` | `String?` | @db.VarChar(30) | — |
| `transactionType` | `String` | @db.VarChar(50) | SALE_OF_GOODS \| PURCHASE_OF_GOODS \| SERVICES_RENDERED \| SERVICES_RECEIVED \| ROYALTY \| MANAGEMENT_FEE \| LOAN_ADVANCE \| GUARANTEE \| OTHER |
| `transactionAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `transferPrice` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `pricingMethod` | `String?` | @db.VarChar(30) | CUP \| RESALE_PRICE \| COST_PLUS \| TNMM \| PROFIT_SPLIT \| OTHER |
| `armsLengthPrice` | `Decimal?` | @db.Decimal(18, 2) | — |
| `adjustmentRequired` | `Boolean` | @default(false) | — |
| `adjustmentAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `documentationRef` | `String?` | @db.VarChar(500) | — |
| `documentationStatus` | `String` | @default("MISSING") @db.VarChar(20) | DOCUMENTED \| PARTIAL \| MISSING |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[taxYear]`
- index `[transactionType]`

### TranslationReserve

_Table `translation_reserve` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `entityId` | `String` | — | — |
| `currency` | `String` | @db.VarChar(3) | — |
| `amount` | `Decimal` | @db.Decimal(18, 2) | — |
| `period` | `String` | @db.VarChar(7) // YYYY-MM | — |
| `translationType` | `String` | // CURRENT_RATE \| HISTORICAL_RATE \| AVERAGE_RATE | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`translationReserves`

**Indexes**

- index `[companyId, period]`
- index `[entityId]`

### User

_Table `user` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `username` | `String` | @unique(map: "User_username_key") | — |
| `email` | `String?` | @unique(map: "User_email_key") | — |
| `password` | `String?` | — | — |
| `role` | `Role` | @default(EMPLOYEE) | — |
| `employeeId` | `String?` | @unique(map: "User_employeeId_key") | — |
| `companyId` | `String?` | — | — |
| `auth0Id` | `String?` | @unique(map: "User_auth0Id_key") | — |
| `mfaEnrolled` | `Boolean` | @default(false) | — |
| `isActive` | `Boolean` | @default(true) | — |
| `failedLoginAttempts` | `Int` | @default(0) | — |
| `lockedUntil` | `DateTime?` | — | — |
| `lastLoginAt` | `DateTime?` | — | — |
| `timezone` | `String?` | @db.VarChar(50) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |
| `lastLoginCountry` | `String?` | — | — |
| `lastLoginIP` | `String?` | — | — |
| `sessionsCount` | `Int` | @default(0) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `auditLog` | [`AuditLog`](#auditlog) | many | _back-reference_ | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `employee` | [`Employee`](#employee) | optional one | `employeeId` → `id` | SetNull |
| `userApp` | [`UserApp`](#userapp) | many | _back-reference_ | — |
| `userRoles` | [`UserRole`](#userrole) | many | _back-reference_ | — |

**Referenced by:** [`AuditLog`](#auditlog).`user` · [`Company`](#company).`user` · [`Employee`](#employee).`user` · [`UserApp`](#userapp).`user` · [`UserRole`](#userrole).`user`

**Indexes**

- index `[companyId]`

### UserApp

_Table `user_app` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `userId` | `String` | — | — |
| `appId` | `String?` | — | — |
| `name` | `String` | @db.VarChar(100) | — |
| `accessLevel` | `AppAccessLevel` | @default(READ) | — |
| `grantedBy` | `String?` | @db.VarChar(100) | — |
| `grantedAt` | `DateTime` | @default(now()) | — |
| `key` | `String?` | @unique @db.VarChar(255) | — |
| `keyPrefix` | `String?` | @db.VarChar(10) | — |
| `lastUsedAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) @db.Timestamp(6) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt @db.Timestamp(6) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `user` | [`User`](#user) | optional one | `userId` → `id` | Cascade |
| `app` | [`App`](#app) | optional one | `appId` → `id` | Cascade |

**Referenced by:** [`App`](#app).`userApp` · [`User`](#user).`userApp`

**Indexes**

- unique `[userId, appId]`
- index `[userId]`
- index `[appId]`

### UserRole

_Table `user_role` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `userId` | `String` | — | — |
| `roleId` | `String` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `user` | [`User`](#user) | one | `userId` → `id` | Cascade |
| `role` | [`RoleDefinition`](#roledefinition) | one | `roleId` → `id` | Cascade |

**Referenced by:** [`RoleDefinition`](#roledefinition).`customUsers` · [`User`](#user).`userRoles`

**Indexes**

- unique `[userId, roleId]`
- index `[userId]`
- index `[roleId]`

### VatDeclaration

Proclamation No. 1341/2024 · Regulation No. 570/2025 High-precision declaration with line-item detail and audit trail.

_Table `vatdeclaration` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `taxPeriod` | `String` | @db.VarChar(20) | — |
| `countryCode` | `String` | @db.VarChar(2) | — |
| `status` | `String` | @default("DRAFT") @db.VarChar(20) | — |
| `version` | `Int` | @default(1) | — |
| `totalNetSales` | `Decimal` | @default(0.000000000000000000000000000000) @db.Decimal(18, 4) | — |
| `totalVatDue` | `Decimal` | @default(0.000000000000000000000000000000) @db.Decimal(18, 4) | — |
| `totalVatDeductible` | `Decimal` | @default(0.000000000000000000000000000000) @db.Decimal(18, 4) | — |
| `netVatPayable` | `Decimal` | @default(0.000000000000000000000000000000) @db.Decimal(18, 4) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `lineItems` | [`VatLineItem`](#vatlineitem) | many | _back-reference_ | — |
| `auditLogs` | [`TaxAuditLog`](#taxauditlog) | many | _back-reference_ | — |

**Referenced by:** [`Company`](#company).`vatDeclaration` · [`TaxAuditLog`](#taxauditlog).`declaration` · [`VatLineItem`](#vatlineitem).`declaration`

**Indexes**

- unique `[companyId, taxPeriod, countryCode, version]`
- index `[companyId, status]`

### VatETaxSubmission

_Table `vatetaxsubmission` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @db.VarChar(36) | — |
| `period` | `String` | @db.VarChar(7) | — |
| `type` | `String` | @default("VAT_RETURN") @db.VarChar(30) | — |
| `status` | `String` | @default("SUBMITTED") @db.VarChar(20) | — |
| `submittedAt` | `DateTime?` | @db.DateTime(0) | — |
| `ercaReferenceNo` | `String?` | @db.VarChar(100) | — |
| `totalAmount` | `Decimal` | @default(0.00) @db.Decimal(18, 2) | — |
| `notes` | `String?` | @db.Text | — |
| `submittedBy` | `String?` | @db.VarChar(36) | — |
| `createdAt` | `DateTime?` | @default(now()) @db.DateTime(0) | — |
| `updatedAt` | `DateTime?` | @default(now()) @db.DateTime(0) | — |
| `companyId` | `String?` | @db.VarChar(36) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`vatETaxSubmission`

**Indexes**

- index `[companyId, period]`

### VatExportEvidence

_Table `vatexportevidence` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @db.VarChar(36) | — |
| `invoiceNo` | `String` | @db.VarChar(100) | — |
| `Customer` | `String` | @db.VarChar(255) | — |
| `exportDate` | `DateTime` | @db.DateTime(0) | — |
| `amountETB` | `Decimal` | @default(0.00) @db.Decimal(18, 2) | — |
| `customsDecl` | `String` | @default("missing") @db.VarChar(20) | — |
| `billOfLading` | `String` | @default("missing") @db.VarChar(20) | — |
| `bankReceipt` | `String` | @default("missing") @db.VarChar(20) | — |
| `createdAt` | `DateTime?` | @default(now()) @db.DateTime(0) | — |
| `updatedAt` | `DateTime?` | @default(now()) @db.DateTime(0) | — |
| `companyId` | `String?` | @db.VarChar(36) | — |
| `exportPermitNo` | `String?` | @db.VarChar(100) | — |
| `freightInvoiceNo` | `String?` | @db.VarChar(100) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`vatExportEvidence`

**Indexes**

- index `[companyId]`

### VatFiling

_Table `vatfiling` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `period` | `String` | @db.VarChar(20) | — |
| `outputVat` | `Decimal` | @default(0.000000000000000000000000000000) @db.Decimal(18, 4) | — |
| `inputVat` | `Decimal` | @default(0.000000000000000000000000000000) @db.Decimal(18, 4) | — |
| `netPayable` | `Decimal` | @default(0.000000000000000000000000000000) @db.Decimal(18, 4) | — |
| `inputCreditCarryForward` | `Decimal` | @default(0.000000000000000000000000000000) @db.Decimal(18, 4) | Excess input VAT carried forward to next period (Art. 31 Proc. 1341/2024) |
| `inputApportionmentPct` | `Decimal` | @default(1.0000) @db.Decimal(5, 4) | Input VAT apportionment % (1.0 = fully claimable; <1.0 for mixed-use) |
| `collected` | `Decimal` | @default(0.000000000000000000000000000000) @db.Decimal(18, 4) | — |
| `paid` | `Decimal` | @default(0.000000000000000000000000000000) @db.Decimal(18, 4) | — |
| `projected` | `Decimal` | @default(0.000000000000000000000000000000) @db.Decimal(18, 4) | — |
| `status` | `String` | @default("DRAFT") | — |
| `filedAt` | `DateTime?` | — | — |
| `dueDate` | `DateTime?` | — | — |
| `eTaxReference` | `String?` | @db.VarChar(100) | — |
| `periodLockedAt` | `DateTime?` | — | Timestamp when this period was locked (no further mutations allowed) |
| `periodLockedBy` | `String?` | @db.VarChar(36) | User ID who locked the period |
| `notes` | `String?` | @db.Text | — |
| `companyId` | `String?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`vatFiling`

**Indexes**

- unique `[companyId, period]`
- index `[companyId]`

### VatInputLedger

_Table `vatinputledger` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @db.VarChar(36) | — |
| `supplier` | `String` | @db.VarChar(255) | — |
| `category` | `String` | @db.VarChar(100) | — |
| `invoiceNo` | `String` | @db.VarChar(100) | — |
| `date` | `DateTime` | @db.DateTime(0) | — |
| `netAmount` | `Decimal` | @default(0.00) @db.Decimal(18, 2) | — |
| `vatAmount` | `Decimal` | @default(0.00) @db.Decimal(18, 2) | — |
| `claimable` | `Boolean` | @default(true) | — |
| `period` | `String?` | @db.VarChar(7) | — |
| `sourceRef` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime?` | @default(now()) @db.DateTime(0) | — |
| `updatedAt` | `DateTime?` | @default(now()) @db.DateTime(0) | — |
| `companyId` | `String?` | @db.VarChar(36) | — |
| `supplierVatRegNo` | `String?` | @db.VarChar(50) | — |
| `importDeclNo` | `String?` | @db.VarChar(100) | — |
| `hsCode` | `String?` | @db.VarChar(20) | — |
| `apportionmentPct` | `Decimal` | @default(1.0000) @db.Decimal(5, 4) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`vatInputLedger`

**Indexes**

- index `[companyId, period]`

### VatLineItem

_Table `vatlineitem` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `declarationId` | `String` | — | — |
| `invoiceReference` | `String?` | @db.VarChar(100) | — |
| `rateCategory` | `String` | @default("STANDARD") @db.VarChar(20) | — |
| `percentage` | `Decimal` | @default(0.0000) @db.Decimal(5, 4) | — |
| `netAmount` | `Decimal` | @default(0.000000000000000000000000000000) @db.Decimal(18, 4) | — |
| `vatAmount` | `Decimal` | @default(0.000000000000000000000000000000) @db.Decimal(18, 4) | — |
| `isDeductible` | `Boolean` | @default(false) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `declaration` | [`VatDeclaration`](#vatdeclaration) | one | `declarationId` → `id` | Cascade |

**Referenced by:** [`VatDeclaration`](#vatdeclaration).`lineItems`

**Indexes**

- index `[declarationId]`

### VatNote

_Table `vatnote` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @db.VarChar(36) | — |
| `date` | `DateTime` | @db.DateTime(0) | — |
| `type` | `String` | @db.VarChar(50) | — |
| `subject` | `String` | @db.VarChar(255) | — |
| `body` | `String` | @db.Text | — |
| `createdAt` | `DateTime?` | @default(now()) @db.DateTime(0) | — |
| `updatedAt` | `DateTime?` | @default(now()) @db.DateTime(0) | — |
| `companyId` | `String?` | @db.VarChar(36) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`vatNote`

**Indexes**

- index `[companyId]`

### VatOutputLedger

_Table `vatoutputledger` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @db.VarChar(36) | — |
| `Customer` | `String` | @db.VarChar(255) | — |
| `category` | `String` | @db.VarChar(100) | — |
| `invoiceNo` | `String` | @db.VarChar(100) | — |
| `date` | `DateTime` | @db.DateTime(0) | — |
| `netAmount` | `Decimal` | @default(0.00) @db.Decimal(18, 2) | — |
| `vatAmount` | `Decimal` | @default(0.00) @db.Decimal(18, 2) | — |
| `period` | `String?` | @db.VarChar(7) | — |
| `sourceRef` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime?` | @default(now()) @db.DateTime(0) | — |
| `updatedAt` | `DateTime?` | @default(now()) @db.DateTime(0) | — |
| `companyId` | `String?` | @db.VarChar(36) | — |
| `buyerVatRegNo` | `String?` | @db.VarChar(50) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`vatOutputLedger`

**Indexes**

- index `[companyId, period]`

### VatRefundClaim

_Table `vatrefundclaim` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @db.VarChar(36) | — |
| `ref` | `String` | @db.VarChar(50) | — |
| `period` | `String` | @db.VarChar(7) | — |
| `submittedDate` | `DateTime` | @db.DateTime(0) | — |
| `amount` | `Decimal` | @default(0.00) @db.Decimal(18, 2) | — |
| `status` | `String` | @default("submitted") @db.VarChar(50) | — |
| `notes` | `String?` | @db.Text | — |
| `createdAt` | `DateTime?` | @default(now()) @db.DateTime(0) | — |
| `updatedAt` | `DateTime?` | @default(now()) @db.DateTime(0) | — |
| `companyId` | `String?` | @db.VarChar(36) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`vatRefundClaim`

**Indexes**

- index `[companyId, period]`

### VatReverseCharge

_Table `vatreverscharge` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @db.VarChar(36) | — |
| `supplier` | `String` | @db.VarChar(255) | — |
| `service` | `String` | @db.VarChar(255) | — |
| `invoiceDate` | `DateTime` | @db.DateTime(0) | — |
| `amountETB` | `Decimal` | @default(0.00) @db.Decimal(18, 2) | — |
| `vatDue` | `Decimal` | @default(0.00) @db.Decimal(18, 2) | — |
| `period` | `String?` | @db.VarChar(7) | — |
| `createdAt` | `DateTime?` | @default(now()) @db.DateTime(0) | — |
| `updatedAt` | `DateTime?` | @default(now()) @db.DateTime(0) | — |
| `companyId` | `String?` | @db.VarChar(36) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`vatReverseCharge`

**Indexes**

- index `[companyId, period]`

### VatWithholding

_Table `vatwithholding` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @db.VarChar(36) | — |
| `supplier` | `String` | @db.VarChar(255) | — |
| `tin` | `String` | @db.VarChar(50) | — |
| `invoiceDate` | `DateTime` | @db.DateTime(0) | — |
| `invoiceAmount` | `Decimal` | @default(0.00) @db.Decimal(18, 2) | — |
| `withheldVat` | `Decimal` | @default(0.00) @db.Decimal(18, 2) | — |
| `remitted` | `Boolean` | @default(false) | — |
| `period` | `String?` | @db.VarChar(7) | — |
| `createdAt` | `DateTime?` | @default(now()) @db.DateTime(0) | — |
| `updatedAt` | `DateTime?` | @default(now()) @db.DateTime(0) | — |
| `companyId` | `String?` | @db.VarChar(36) | — |
| `supplierVatRegNo` | `String?` | @db.VarChar(50) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Company`](#company).`vatWithholding`

**Indexes**

- index `[companyId, period]`

### Vendor

_Table `vendor` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `tin` | `String?` | @db.VarChar(50) | — |
| `email` | `String?` | — | — |
| `phone` | `String?` | — | — |
| `address` | `String?` | @db.Text | — |
| `paymentTerms` | `String?` | @db.VarChar(100) | — |
| `currencyCode` | `String?` | @default("ETB") @db.VarChar(3) | — |
| `companyId` | `String?` | — | — |
| `isActive` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |
| `category` | `String?` | @db.VarChar(50) | — |
| `notes` | `String?` | @db.Text | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `bill` | [`Bill`](#bill) | many | _back-reference_ | — |
| `payments` | [`Payment`](#payment) | many | _back-reference_ | — |
| `vendorPayments` | [`VendorPayment`](#vendorpayment) | many | _back-reference_ | — |
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |

**Referenced by:** [`Bill`](#bill).`vendor` · [`Company`](#company).`vendor` · [`Payment`](#payment).`vendor` · [`VendorPayment`](#vendorpayment).`vendor`

**Indexes**

- index `[companyId]`

### VendorLedger

_Table `vendor_ledger` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `vendorId` | `String` | — | — |
| `vendorName` | `String` | @db.VarChar(200) | — |
| `entryType` | `String` | @default("BILL") @db.VarChar(30) | BILL \| PAYMENT \| DEBIT_NOTE \| CREDIT_NOTE \| WHT \| ADJUSTMENT \| OPENING_BALANCE |
| `reference` | `String?` | @db.VarChar(100) | — |
| `description` | `String?` | @db.VarChar(500) | — |
| `debit` | `Decimal` | @default(0) @db.Decimal(18, 2) | Debit = amount the vendor owes us (or we owe the vendor) |
| `credit` | `Decimal` | @default(0) @db.Decimal(18, 2) | Credit = amount we paid the vendor (or they paid us) |
| `balance` | `Decimal` | @default(0) @db.Decimal(18, 2) | Running balance after this entry |
| `currencyCode` | `String` | @default("ETB") @db.VarChar(3) | — |
| `currencyRate` | `Decimal` | @default(1.0) @db.Decimal(10, 4) | — |
| `linkedBillId` | `String?` | — | — |
| `linkedPaymentId` | `String?` | — | — |
| `linkedJournalEntryId` | `String?` | @db.VarChar(36) | — |
| `entryDate` | `DateTime` | @default(now()) | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[vendorId]`
- index `[entryDate]`
- index `[companyId, vendorId]`

### VendorPayment

_Table `vendor_payment` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `paymentDate` | `DateTime` | — | — |
| `amount` | `Decimal` | — | — |
| `currencyCode` | `String` | @default("ETB") @db.VarChar(3) | — |
| `vendorId` | `String` | — | — |
| `billId` | `String?` | — | — |
| `description` | `String?` | @db.Text | — |
| `reference` | `String?` | @db.VarChar(100) | — |
| `companyId` | `String?` | — | — |
| `journalEntryId` | `String?` | @db.VarChar(36) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | — |
| `vendor` | [`Vendor`](#vendor) | one | `vendorId` → `id` | — |
| `bill` | [`Bill`](#bill) | optional one | `billId` → `id` | — |
| `journalEntry` | [`JournalEntry`](#journalentry) | optional one | `journalEntryId` → `id` | — |

**Referenced by:** [`Bill`](#bill).`vendorPayments` · [`Company`](#company).`vendorPayments` · [`JournalEntry`](#journalentry).`vendorPayments` · [`Vendor`](#vendor).`vendorPayments`

**Indexes**

- index `[companyId]`
- index `[vendorId]`
- index `[billId]`
- index `[paymentDate]`

### VerifiedLedgerState

_Table `verified_ledger_state` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `sourceType` | `String` | @db.VarChar(50) | — |
| `sourceId` | `String` | @db.VarChar(36) | — |
| `companyId` | `String?` | — | — |
| `reference` | `String?` | @db.VarChar(200) | — |
| `description` | `String?` | @db.Text | — |
| `amount` | `Decimal` | @default(0) | — |
| `currencyCode` | `String` | @default("ETB") @db.VarChar(3) | — |
| `status` | `String` | @default("VERIFIED") @db.VarChar(50) | — |
| `verifiedAt` | `DateTime` | @default(now()) | — |
| `verifiedBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`verifiedLedgerStates`

**Indexes**

- index `[sourceType, sourceId]`
- index `[companyId]`

### Warehouse

_Table `warehouse` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `name` | `String` | — | — |
| `code` | `String` | @unique @db.VarChar(50) | — |
| `address` | `String?` | @db.Text | — |
| `city` | `String?` | @db.VarChar(100) | — |
| `country` | `String?` | @default("Ethiopia") @db.VarChar(100) | — |
| `phone` | `String?` | @db.VarChar(50) | — |
| `email` | `String?` | @db.VarChar(200) | — |
| `manager` | `String?` | @db.VarChar(200) | — |
| `companyId` | `String?` | — | — |
| `isActive` | `Boolean` | @default(true) | — |
| `isDefault` | `Boolean` | @default(false) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `items` | [`Item`](#item) | many | _back-reference_ | — |
| `transfersFrom` | [`TransferOrder`](#transferorder) | many | _back-reference_ | — |
| `transfersTo` | [`TransferOrder`](#transferorder) | many | _back-reference_ | — |
| `stockEntries` | [`WarehouseStock`](#warehousestock) | many | _back-reference_ | — |

**Referenced by:** [`Item`](#item).`warehouse` · [`TransferOrder`](#transferorder).`fromWarehouse` · [`TransferOrder`](#transferorder).`toWarehouse` · [`WarehouseStock`](#warehousestock).`warehouse`

**Indexes**

- index `[companyId]`

### WarehouseStock

_Table `warehousestock` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `itemId` | `String` | — | — |
| `warehouseId` | `String` | — | — |
| `companyId` | `String?` | — | — |
| `quantity` | `Int` | @default(0) | — |
| `committedQty` | `Int` | @default(0) | — |
| `incomingQty` | `Int` | @default(0) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `item` | [`Item`](#item) | one | `itemId` → `id` | Cascade |
| `warehouse` | [`Warehouse`](#warehouse) | one | `warehouseId` → `id` | Cascade |

**Referenced by:** [`Item`](#item).`warehouseStocks` · [`Warehouse`](#warehouse).`stockEntries`

**Indexes**

- unique `[itemId, warehouseId]`
- index `[companyId]`
- index `[itemId]`
- index `[warehouseId]`

### WebhookDelivery

_Table `webhook_delivery` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `webhookId` | `String` | — | — |
| `eventType` | `String` | @db.VarChar(100) | — |
| `payload` | `String` | @db.LongText | — |
| `status` | `String` | @default("PENDING") @db.VarChar(50) | — |
| `responseStatus` | `Int?` | — | — |
| `errorMessage` | `String?` | @db.Text | — |
| `deliveredAt` | `DateTime?` | — | — |
| `createdAt` | `DateTime` | @default(now()) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `webhook` | [`WebhookEndpoint`](#webhookendpoint) | one | `webhookId` → `id` | Cascade |

**Referenced by:** [`WebhookEndpoint`](#webhookendpoint).`deliveries`

**Indexes**

- index `[webhookId]`
- index `[eventType]`

### WebhookEndpoint

_Table `webhook_endpoint` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String?` | — | — |
| `url` | `String` | @db.VarChar(500) | — |
| `secret` | `String?` | @db.VarChar(200) | — |
| `events` | `String` | @db.LongText | — |
| `isActive` | `Boolean` | @default(true) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | optional one | `companyId` → `id` | Cascade |
| `deliveries` | [`WebhookDelivery`](#webhookdelivery) | many | _back-reference_ | — |

**Referenced by:** [`Company`](#company).`webhookEndpoints` · [`WebhookDelivery`](#webhookdelivery).`webhook`

**Indexes**

- index `[companyId]`

### WhtCertificate

_Table `wht_certificate` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `certNo` | `String` | @unique @db.VarChar(50) | — |
| `companyId` | `String?` | — | — |
| `whtType` | `String` | @default("GOODS") @db.VarChar(20) | GOODS \| SERVICES \| SERVICES_NR \| RENT \| DIVIDEND \| INTEREST |
| `issueDate` | `DateTime` | @default(now()) | — |
| `period` | `String` | @db.VarChar(7) // YYYY-MM | — |
| `agentName` | `String` | @db.VarChar(200) | Withholding agent (payer) details |
| `agentTin` | `String?` | @db.VarChar(15) | — |
| `supplierName` | `String` | @db.VarChar(200) | Supplier (recipient) details |
| `supplierTin` | `String?` | @db.VarChar(15) | — |
| `grossAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | Amount details |
| `whtRate` | `Decimal` | @default(0.02) @db.Decimal(8, 6) | — |
| `whtAmount` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `netPayable` | `Decimal` | @default(0) @db.Decimal(18, 2) | — |
| `billId` | `String?` | @db.VarChar(36) | Linked bill (if deducted on a bill) |
| `billReference` | `String?` | @db.VarChar(100) | — |
| `remitted` | `Boolean` | @default(false) | Remittance to ERCA |
| `remittedAt` | `DateTime?` | — | — |
| `ercaReference` | `String?` | @db.VarChar(100) | — |
| `status` | `String` | @default("DRAFT") @db.VarChar(20) | DRAFT \| ISSUED \| REMITTED \| CANCELLED |
| `notes` | `String?` | @db.Text | — |
| `createdBy` | `String?` | @db.VarChar(100) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @default(now()) @updatedAt | — |

**Indexes**

- index `[companyId]`
- index `[period]`
- index `[status]`
- index `[supplierTin]`

### WhtWithholding

_Table `wht_withholding` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `companyId` | `String` | — | — |
| `vendorId` | `String?` | — | — |
| `invoiceId` | `String?` | — | — |
| `amount` | `Decimal` | @db.Decimal(18, 2) | — |
| `rate` | `Decimal` | @db.Decimal(5, 2) | — |
| `type` | `String` | // GOODS \| SERVICES \| NON_RESIDENT \| CORPORATE_RENT \| DIVIDEND \| INTEREST | — |
| `period` | `String` | @db.VarChar(7) // YYYY-MM | — |
| `status` | `String` | @default("PENDING") // PENDING \| REMITTED \| CANCELLED | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |

**Referenced by:** [`Company`](#company).`whtWithholdings`

**Indexes**

- index `[companyId, period]`
- index `[companyId, type]`

### workflowrun

_Table `workflow_run` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id | — |
| `companyId` | `String` | — | — |
| `period` | `String` | @db.VarChar(7) | — |
| `status` | `String` | @default("NOT_STARTED") @db.VarChar(20) | — |
| `startedAt` | `DateTime?` | — | — |
| `completedAt` | `DateTime?` | — | — |
| `summaryJson` | `String?` | @db.LongText | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `tasks` | [`workflowtaskrun`](#workflowtaskrun) | many | _back-reference_ | — |

**Referenced by:** [`workflowtaskrun`](#workflowtaskrun).`run`

**Indexes**

- unique `[companyId, period]`
- index `[companyId]`

### workflowtaskrun

_Table `workflow_task_run` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(uuid()) | — |
| `runId` | `String` | — | — |
| `taskId` | `String` | @db.VarChar(64) | — |
| `label` | `String` | @db.VarChar(255) | — |
| `module` | `String` | @db.VarChar(32) | — |
| `status` | `String` | @db.VarChar(16) | — |
| `priority` | `String` | @db.VarChar(16) | — |
| `details` | `String?` | @db.Text | — |
| `warningsJson` | `String?` | @db.Text | — |
| `dataJson` | `String?` | @db.Text | — |
| `metaJson` | `String?` | @db.Text | — |
| `startedAt` | `DateTime?` | — | — |
| `completedAt` | `DateTime?` | — | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `run` | [`workflowrun`](#workflowrun) | one | `runId` → `id` | Cascade |

**Referenced by:** [`workflowrun`](#workflowrun).`tasks`

**Indexes**

- unique `[runId, taskId]`
- index `[runId]`

### WorkOrder

_Table `work_order` · tenant-scoped_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(cuid()) | — |
| `companyId` | `String` | — | — |
| `woNumber` | `String` | @db.VarChar(50) | — |
| `itemCode` | `String?` | @db.VarChar(100) | — |
| `description` | `String?` | @db.Text | — |
| `quantity` | `Int` | @default(0) | — |
| `status` | `String?` | @default("DRAFT") @db.VarChar(20) | — |
| `createdAt` | `DateTime` | @default(now()) | — |
| `updatedAt` | `DateTime` | @updatedAt | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `company` | [`Company`](#company) | one | `companyId` → `id` | Cascade |
| `outputs` | [`WorkOrderOutput`](#workorderoutput) | many | _back-reference_ | — |

**Referenced by:** [`Company`](#company).`workOrders` · [`WorkOrderOutput`](#workorderoutput).`workOrder`

**Indexes**

- index `[companyId]`

### WorkOrderOutput

_Table `work_order_output` · global_

| Field | Type | Attributes | Notes |
|-------|------|------------|-------|
| `id` | `String` | @id @default(cuid()) | — |
| `WorkOrderId` | `String` | — | — |
| `ItemCode` | `String?` | @db.VarChar(100) | — |
| `description` | `String?` | @db.Text | — |
| `quantity` | `Int` | @default(0) | — |
| `IsByProduct` | `Boolean` | @default(false) | — |

**Relations**

| Field | Target | Cardinality | Foreign key | On delete |
|-------|--------|-------------|-------------|-----------|
| `workOrder` | [`WorkOrder`](#workorder) | one | `WorkOrderId` → `id` | Cascade |

**Referenced by:** [`WorkOrder`](#workorder).`outputs`

---

## 6. How to change the data model

1. Edit `packages/database/prisma/schema.prisma`.
2. `npm run db:migrate:dev` — creates a migration in `packages/database/prisma/migrations/`.
3. `npm run db:generate` — regenerates the Prisma client.
4. `npm run db:generate:zod` — regenerates `@ovds/contracts` Zod schemas.
5. `npm run docs:schema` — regenerates this file.

The full checklist, including production rollout and rollback, lives in
[UPGRADING.md](./UPGRADING.md#3-prisma-database-migrations).

