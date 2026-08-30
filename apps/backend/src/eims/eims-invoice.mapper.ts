/**
 * EIMS data-mapping registry — OVDS → MoR EIMS.
 *
 * Single, auditable place that translates an OVDS domain invoice (the
 * `Invoice` aggregate: header + `invoiceItem` lines + `company` seller +
 * `customer` buyer) into the exact MoR `EimsInvoiceRegistrationRequest`
 * contract consumed by `MorEimsClient`.
 *
 * Every monetary field is normalised to a JS number (Prisma returns
 * `Decimal`/`string`); every TIN is coerced to the statutory 10-digit shape
 * with a deterministic placeholder for B2C consumers that have no TIN.
 *
 * The map is pure (no I/O) so it is trivially unit-testable and keeps the
 * `EimsService` free of MoR schema knowledge.
 */
import {
  EimsInvoiceRegistrationRequest,
  EimsItemLine,
  EimsPartyDetails,
} from '@ovds/shared';

/** Minimal structural view of the Prisma `Invoice` aggregate we read. */
export interface OVDSInvoiceLike {
  id: string;
  invoiceNumber: string;
  customerName?: string | null;
  customerTin?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerEmail?: string | null;
  companyId?: string | null;
  status?: string | null;
  date?: Date | string | null;
  currencyCode?: string | null;
  totalAmount?: DecimalLike;
  vatAmount?: DecimalLike;
  subtotal?: DecimalLike;
  discountAmount?: DecimalLike;
  invoiceDiscount?: DecimalLike;
  vatRate?: DecimalLike;
  isVatRegistered?: boolean | null;
  exciseAmount?: DecimalLike;
  whtAmount?: DecimalLike;
  whtType?: string | null;
  paymentTerms?: string | null;
  docType?: string | null;
  fsNo?: string | null;
  /** Full buyer details JSON for B2B transactions */
  buyerDetails?: string | null;
  customer?: OVDSCustomerLike | null;
  company?: OVDSCompanyLike | null;
  invoiceItem?: OVDSInvoiceItemLike[];
}

/** Parsed buyer details structure */
export interface BuyerDetailsData {
  tin?: string;
  legalName?: string;
  name?: string;
  email?: string;
  phone?: string;
  vatNumber?: string;
  region?: string;
  zone?: string;
  kebele?: string;
  city?: string;
  houseNumber?: string;
  subCity?: string;
  wereda?: string;
  country?: string;
}

export interface OVDSCustomerLike {
  name?: string | null;
  tin?: string | null;
  vatNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  nationalId?: string | null;
}

export interface OVDSCompanyLike {
  name?: string | null;
  tin?: string | null;
  vatNumber?: string | null;
  location?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface OVDSInvoiceItemLike {
  id?: string;
  quantity?: number | null;
  salePrice?: DecimalLike;
  discount?: DecimalLike;
  description?: string | null;
  itemId?: string | null;
}

/** Prisma `Decimal` / number / string union we accept for money fields. */
export type DecimalLike = number | string | { toString(): string } | null | undefined;

export interface MorMappingDefaults {
  /** ISO country code sent to MoR (Proc. 285/2002 territory). */
  country: string;
  /** Seller address components (fall back to these when `company` is sparse). */
  sellerCity: string;
  sellerRegion: string;
  sellerWereda: string;
  sellerSubCity?: string | null;
  sellerLocality?: string | null;
  sellerZone?: string | null;
  sellerKebele?: string | null;
  sellerHouseNumber?: string | null;
   sellerPhone: string;
   sellerEmail: string;
   /** Seller legal identity — falls back to env defaults when company has none. */
   sellerLegalName?: string | null;
   sellerTin?: string | null;
   sellerVatNumber?: string | null;
   /** Default payment mode / term when the invoice does not specify. */
  paymentMode: string;
  paymentTerm: string;
  /** Source system identity MoR expects on every registration. */
  systemType: 'ERP' | 'POS' | 'MANUAL';
  systemNumber: string;
  version: string;
  /** Default invoice currency when the invoice does not specify one */
  currency: string;
  salesPersonName?: string;
  cashierName?: string;
}

/** MoR document type derived from the OVDS `docType`. */
export type MorDocType = 'INV' | 'CRN' | 'DBN';

const DOC_TYPE_MAP: Record<string, MorDocType> = {
  INVOICE: 'INV',
  INV: 'INV',
  CREDIT_NOTE: 'CRN',
  CRN: 'CRN',
  CREDIT: 'CRN',
  DEBIT_NOTE: 'DBN',
  DBN: 'DBN',
  DEBIT: 'DBN',
};

/** MoR standard TIN for a consumer (B2C) with no registered TIN. */
export const MOR_CONSUMER_TIN = '0000000000';

/** MoR Ethiopia VAT tax codes. */
const TAX_CODE_STANDARD = 'A'; // 15% standard rated
const TAX_CODE_EXEMPT = 'C'; // exempt

/** Parse buyerDetails JSON string into structured data */
function parseBuyerDetails(buyerDetailsJson: string | null | undefined): BuyerDetailsData | null {
  if (!buyerDetailsJson) return null;
  try {
    const parsed = JSON.parse(buyerDetailsJson);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** Throw if the buyer TIN matches the seller TIN (self-transaction not allowed) */
function assertNotSelfTransaction(buyerTin: string, sellerTin: string): void {
  const cleanedBuyer = (buyerTin || '').replace(/\D/g, '');
  const cleanedSeller = (sellerTin || '').replace(/\D/g, '');
  if (cleanedBuyer && cleanedSeller && cleanedBuyer === cleanedSeller) {
    throw new Error(
      `Buyer TIN (${buyerTin}) cannot be the same as the seller/company TIN. ` +
      `MoR prohibits self-transactions. Select a different buyer.`
    );
  }
}

function toNumber(value: DecimalLike): number {
  if (value == null) return 0;
  const n = typeof value === 'number' ? value : Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

/** Coerce any value to a 10-digit TIN, falling back to the consumer TIN. */
function coerceTin(value: string | null | undefined, fallback = MOR_CONSUMER_TIN): string {
  const cleaned = (value ?? '').replace(/\D/g, '').slice(0, 10);
  return cleaned.length === 10 ? cleaned : fallback;
}

function docTypeOf(invoice: OVDSInvoiceLike): MorDocType {
  return DOC_TYPE_MAP[(invoice.docType ?? 'INVOICE').toUpperCase()] ?? 'INV';
}

/** B2B when the buyer carries a TIN, otherwise B2C. */
function transactionTypeOf(buyerTin: string, fallback: 'B2B' | 'B2C'): 'B2B' | 'B2C' | 'B2G' | 'EXP' | 'IMP' {
  if (buyerTin && buyerTin !== MOR_CONSUMER_TIN) return 'B2B';
  return fallback;
}

function mapParty(
  party: { name: string; tin: string; vatNumber?: string | null; phone?: string | null; email?: string | null },
  defaults: { city: string; region: string; wereda: string; subCity?: string | null; locality?: string | null; zone?: string | null; kebele?: string | null; houseNumber?: string | null; country: string; idNumber?: string | null; idType?: string | null },
): EimsPartyDetails {
  return {
    Tin: coerceTin(party.tin),
    LegalName: party.name || 'Unknown',
    VatNumber: party.vatNumber || '',
    Phone: party.phone || '',
    Email: party.email || '',
    City: defaults.city,
    Region: defaults.region,
    Wereda: defaults.wereda,
    HouseNumber: defaults.houseNumber ?? null,
    SubCity: defaults.subCity ?? null,
    Locality: defaults.locality ?? null,
    IdNumber: defaults.idNumber ?? undefined,
    IdType: defaults.idType ?? undefined,
    Country: defaults.country,
    Zone: defaults.zone ?? undefined,
    Kebele: defaults.kebele ?? undefined,
  };
}

function mapLines(
  invoice: OVDSInvoiceLike,
  isVat: boolean,
  vatRateFrac: number,
): EimsItemLine[] {
  const items = invoice.invoiceItem ?? [];
  if (items.length === 0) {
    // MoR requires at least one line — synthesise a single summary line so the
    // registration never fails schema validation on an empty ItemList.
    const total = toNumber(invoice.subtotal) || toNumber(invoice.totalAmount);
    const tax = isVat ? total * vatRateFrac : 0;
    return [
      {
        LineNumber: 1,
        ItemCode: 'SUMMARY',
        ProductDescription: invoice.customerName ? `Invoice summary` : 'Invoice summary',
        NatureOfSupplies: 'Goods',
        Unit: 'PCS',
        Quantity: 1,
        UnitPrice: total,
        PreTaxValue: total,
        Discount: 0,
        TaxCode: isVat ? TAX_CODE_STANDARD : TAX_CODE_EXEMPT,
        TaxAmount: tax,
        ExciseTaxValue: 0,
        HarmonizationCode: null,
        TotalLineAmount: total + tax,
      },
    ];
  }

  return items.map((item, idx) => {
    const qty = toNumber(item.quantity) || 1;
    const unitPrice = toNumber(item.salePrice);
    const discount = toNumber(item.discount);
    const preTax = unitPrice * qty - discount;
    const tax = isVat ? preTax * vatRateFrac : 0;
    return {
      LineNumber: idx + 1,
      ItemCode: item.itemId || `ITEM-${idx + 1}`,
      ProductDescription: item.description || 'Item',
      NatureOfSupplies: 'Goods',
      Unit: 'PCS',
      Quantity: qty,
      UnitPrice: round2(unitPrice),
      PreTaxValue: round2(preTax),
      Discount: round2(discount),
      TaxCode: isVat ? TAX_CODE_STANDARD : TAX_CODE_EXEMPT,
      TaxAmount: round2(tax),
      ExciseTaxValue: 0,
      HarmonizationCode: null,
      TotalLineAmount: round2(preTax + tax),
    };
  });
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Map a fully-loaded OVDS invoice to the MoR `EimsInvoiceRegistrationRequest`.
 */
export function mapInvoiceToMorRequest(
  invoice: OVDSInvoiceLike,
  defaults: MorMappingDefaults,
): EimsInvoiceRegistrationRequest {
  const company = invoice.company ?? {};
  const customer = invoice.customer ?? {};

  const isVat = invoice.isVatRegistered !== false && toNumber(invoice.vatRate) > 0;
  const vatRateFrac = toNumber(invoice.vatRate) / 100;

  const sellerTin = coerceTin(company.tin ?? defaults.sellerTin);
  const sellerName = company.name || defaults.sellerLegalName || 'Company';

  // Parse full buyer details (B2B) if available
  const buyerDetails = parseBuyerDetails(invoice.buyerDetails);

  // Resolve buyer TIN: prefer structured buyerDetails, then customer, then invoice fallback
  const buyerTinRaw = buyerDetails?.tin ?? customer.tin ?? invoice.customerTin;
  const buyerTin = coerceTin(buyerTinRaw);

  // Validate: buyer TIN must not match seller TIN (self-transaction)
  assertNotSelfTransaction(buyerTin, sellerTin);

  // Resolve buyer name: prefer structured buyerDetails legalName/name, then customer, then invoice
  const buyerName = buyerDetails?.legalName ?? buyerDetails?.name ?? customer.name ?? invoice.customerName ?? 'Customer';
  const transactionType = transactionTypeOf(buyerTin, 'B2C');

  const seller = mapParty(
    {
      name: sellerName,
      tin: sellerTin,
      vatNumber: company.vatNumber ?? defaults.sellerVatNumber ?? '',
      phone: company.phone ?? defaults.sellerPhone,
      email: company.email ?? defaults.sellerEmail,
    },
    {
      city: defaults.sellerCity,
      region: defaults.sellerRegion,
      wereda: defaults.sellerWereda,
      subCity: defaults.sellerSubCity ?? null,
      locality: defaults.sellerLocality ?? null,
      zone: defaults.sellerZone ?? null,
      kebele: defaults.sellerKebele ?? null,
      houseNumber: defaults.sellerHouseNumber ?? null,
      country: defaults.country,
    },
  );

  // Build buyer party with full address details from buyerDetails
  const buyer = mapParty(
    {
      name: buyerName,
      tin: buyerTin,
      vatNumber: buyerDetails?.vatNumber ?? customer.vatNumber ?? '',
      phone: buyerDetails?.phone ?? customer.phone ?? invoice.customerPhone ?? '',
      email: buyerDetails?.email ?? customer.email ?? invoice.customerEmail ?? '',
    },
    {
      city: buyerDetails?.city ?? (invoice.customerAddress ? (invoice.customerAddress.split(',')[0]?.trim() ?? '') : ''),
      region: buyerDetails?.region ?? '',
      wereda: buyerDetails?.wereda ?? '',
      subCity: buyerDetails?.subCity ?? null,
      locality: null,
      zone: buyerDetails?.zone ?? null,
      kebele: buyerDetails?.kebele ?? null,
      houseNumber: buyerDetails?.houseNumber ?? null,
      country: buyerDetails?.country ?? defaults.country,
      idNumber: customer.nationalId ?? null,
      idType: customer.nationalId ? 'NATIONAL_ID' : null,
    },
  );

  const docType = docTypeOf(invoice);
  const totalValue = toNumber(invoice.subtotal) || toNumber(invoice.totalAmount);
  const taxValue = isVat ? toNumber(invoice.vatAmount) : 0;
  const discount = toNumber(invoice.discountAmount) || toNumber(invoice.invoiceDiscount);

  const lines = mapLines(invoice, isVat, vatRateFrac);

  return {
    SellerDetails: seller,
    BuyerDetails: buyer,
    DocumentDetails: {
      DocumentNumber: invoice.invoiceNumber,
      Date: (invoice.date ? new Date(invoice.date) : new Date()).toISOString(),
      Type: docType,
    },
    ItemList: lines,
    PaymentDetails: {
      Mode: (invoice.paymentTerms as string) || defaults.paymentMode,
      PaymentTerm: invoice.paymentTerms || defaults.paymentTerm,
    },
    ReferenceDetails: {
      PreviousIrn: '',
      RelatedDocument: null,
    },
    SourceSystem: {
      SystemNumber: defaults.systemNumber,
      SystemType: defaults.systemType,
      SalesPersonName: defaults.salesPersonName ?? '',
      CashierName: defaults.cashierName ?? '',
      InvoiceCounter: 0,
    },
    TransactionType: transactionType,
    ValueDetails: {
      TotalValue: round2(totalValue),
      TaxValue: round2(taxValue),
      ExciseValue: round2(toNumber(invoice.exciseAmount)),
      IncomeWithholdValue: round2(toNumber(invoice.whtAmount)),
      TransactionWithholdValue: 0,
      Discount: round2(discount),
      InvoiceCurrency: invoice.currencyCode || defaults.currency,
    },
    Version: defaults.version,
  };
}

export const EIMS_MAPPER = { mapInvoiceToMorRequest };
