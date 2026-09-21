/**
 * Ethiopian Ministry of Revenues (MoR) eTax Gateway — JSON Payload Types
 *
 * Defines the canonical outbound JSON schema for submitting tax declarations
 * to the MoR National e-Tax System via HTTPS POST.
 *
 * Based on: MoR API specification + Ethiopian tax proclamations.
 * All monetary amounts in ETB (Ethiopian Birr), 2 decimal places.
 */
export type CalendarSystem = 'Gregorian' | 'Ethiopian';
export interface ETaxHeader {
    TaxpayerTIN: string;
    TaxpayerName: string;
    FilingPeriodCode: string;
    CalendarSystem: CalendarSystem;
    DeclarationTimestamp: string;
    FiscalYear?: string;
    AmendmentNumber?: number;
}
export interface ETaxVatSummary {
    StandardTaxableSalesETB: number;
    OutputVatCollectedETB: number;
    ZeroRatedSalesETB: number;
    ExemptSalesETB: number;
    TotalEligibleInputVatETB: number;
    NetVatPayableRefundableETB: number;
}
export interface ETaxTotSummary {
    GoodsSalesETB: number;
    ServicesSalesETB: number;
    TotOnGoodsETB: number;
    TotOnServicesETB: number;
    TotalTotPayableETB: number;
}
export interface ETaxWhtSummary {
    Wht3PctGoodsBaseETB: number;
    Wht3PctGoodsWithheldETB: number;
    Wht3PctServicesBaseETB: number;
    Wht3PctServicesWithheldETB: number;
    Wht15PctDividendsETB: number;
    Wht10PctInterestETB: number;
    Wht15PctNonResidentServicesETB: number;
    TotalWhtToRemitETB: number;
}
export interface ETaxPayeSummary {
    EmployeeCount: number;
    TotalGrossSalaryETB: number;
    TotalPitWithheldETB: number;
    TotalEmployeePensionETB: number;
    TotalEmployerPensionETB: number;
    TotalDrrfETB: number;
    NetPayableErcaETB: number;
    NetPayablePfsaETB: number;
}
export interface ETaxBitSummary {
    FiscalYear: number;
    AccountingProfitBeforeTaxETB: number;
    PermanentAddBacksETB: number;
    PermanentDeductionsETB: number;
    TemporaryDifferencesNetETB: number;
    TaxableNetIncomeETB: number;
    RegularCitETB: number;
    MatBaseETB: number;
    MatAmountETB: number;
    MatApplies: boolean;
    FinalTaxPayableETB: number;
    WhtCreditsAppliedETB: number;
    ProvisionalTaxPaidETB: number;
    BalanceDueETB: number;
}
export interface ETaxExciseSummary {
    /** Period type — monthly for manufacturers, per-import for importers */
    PeriodType: 'MONTHLY' | 'PER_IMPORT';
    AlcoholBaseETB: number;
    TobaccoBaseETB: number;
    AutomobileGt1800ccBaseETB: number;
    AutomobileLt1800ccBaseETB: number;
    AutomobileElectricBaseETB: number;
    SugarSweetenedBaseETB: number;
    EnergyDrinkBaseETB: number;
    PlasticBaseETB: number;
    OtherExcisableBaseETB: number;
    TotalExciseDueETB: number;
}
export interface ETaxDrrfSummary {
    Quarter: string;
    DigitalBankingBaseETB: number;
    TelecomAirtimeBaseETB: number;
    LoanDisbursementsBaseETB: number;
    InsurancePremiumsBaseETB: number;
    DividendsBaseETB: number;
    TotalLevyETB: number;
}
export interface ETaxSystemSecurity {
    ApplicationSignature: string;
    AuditLogReference: string;
    SubmittedByUserId?: string;
    IPAddress?: string;
}
export interface TaxpayerDeclaration {
    Header: ETaxHeader;
    VatSummary?: ETaxVatSummary;
    TotSummary?: ETaxTotSummary;
    WithholdingTaxSummary?: ETaxWhtSummary;
    PayeSummary?: ETaxPayeSummary;
    BusinessIncomeTaxSummary?: ETaxBitSummary;
    ExciseSummary?: ETaxExciseSummary;
    DrrfSummary?: ETaxDrrfSummary;
    SystemSecurity: ETaxSystemSecurity;
}
export interface ETaxSubmissionResponse {
    status: 'SUCCESS' | 'REJECTED' | 'PENDING';
    receiptId?: string;
    paymentSlipUrl?: string;
    validationErrors?: string[];
    timestamp: string;
    requestId: string;
}
/**
 * Build a complete TaxpayerDeclaration payload for MoR submission.
 * Call this in the backend eTax export service before signing and posting.
 */
export declare function buildTaxpayerDeclaration(params: {
    tin: string;
    taxpayerName: string;
    period: string;
    calendarSystem?: CalendarSystem;
    auditLogRef: string;
    vat?: ETaxVatSummary;
    tot?: ETaxTotSummary;
    wht?: ETaxWhtSummary;
    paye?: ETaxPayeSummary;
    bit?: ETaxBitSummary;
    excise?: ETaxExciseSummary;
    drrf?: ETaxDrrfSummary;
    submittedByUserId?: string;
}): TaxpayerDeclaration;
/**
 * Validate a TaxpayerDeclaration payload before submission.
 * Returns array of error strings; empty = valid.
 */
export declare function validateTaxpayerDeclaration(d: TaxpayerDeclaration): string[];
//# sourceMappingURL=etax-payload.types.d.ts.map