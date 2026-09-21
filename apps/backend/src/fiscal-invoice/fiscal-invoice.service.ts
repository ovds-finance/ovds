import { createHash } from 'crypto';

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../common/prisma.service';

import {
  FiscalInvoiceDto,
  GenerateInvoiceRequestDto,
  GenerateInvoiceResponseDto,
  InvoiceStatus,
  InvoiceType,
  InvoiceVerificationDto,
  InvoiceVerificationResponseDto,
} from './dto/fiscal-invoice.dto';

interface FiscalParty {
  legalName: string;
  tradeName: string;
  tin: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  vatNumber?: string;
  contactPerson?: string;
}

interface FiscalLineItem {
  lineNumber: number;
  description: string;
  hsCode?: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  discountPercent?: number;
  taxRate: number;
  taxType: string;
  lineTotal: number;
  taxAmount: number;
  lineTotalWithTax: number;
}

interface FiscalTotals {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  amountPaid: number;
  amountDue: number;
  roundingAdjustment: number;
}

export interface FiscalPdfResult {
  invoiceId: string;
  invoiceNumber: string;
  verificationCode: string;
  qrData: string;
  pdf: Buffer;
}

@Injectable()
export class FiscalInvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async generate(request: GenerateInvoiceRequestDto): Promise<GenerateInvoiceResponseDto> {
    const invoice = await this.findInvoice(request.transactionId);
    if (!invoice) {
      throw new NotFoundException(`Invoice ${request.transactionId} not found`);
    }

    const result = await this.generateForInvoice(invoice.id, {
      invoiceType: request.invoiceType,
      paymentTerms: request.paymentTerms,
      notes: request.notes,
    });

    return {
      success: true,
      invoiceId: result.invoiceId,
      invoiceNumber: result.invoiceNumber,
      pdfUrl: `/api/fiscal-invoices/${encodeURIComponent(result.invoiceId)}/pdf`,
    };
  }

  async generateForInvoice(
    invoiceId: string,
    options: {
      invoiceType?: InvoiceType;
      paymentTerms?: string;
      notes?: string;
    } = {},
  ): Promise<FiscalPdfResult> {
    const invoice = await this.findInvoice(invoiceId);
    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    const view = this.toFiscalInvoice(invoice, options);
    const verificationCode = this.createVerificationCode(view);
    const qrData = view.qrCodeData || this.createQrData(view, verificationCode);
    const pdf = this.renderPdf({ ...view, qrCodeData: qrData, digitalSignature: view.digitalSignature || verificationCode });

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      verificationCode,
      qrData,
      pdf,
    };
  }

  async render(invoiceId: string): Promise<FiscalPdfResult> {
    return this.generateForInvoice(invoiceId);
  }

  async verify(request: InvoiceVerificationDto): Promise<InvoiceVerificationResponseDto> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { invoiceNumber: request.invoiceNumber },
      include: { company: true, customer: true, invoicePayment: true },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${request.invoiceNumber} not found`);
    }

    const view = this.toFiscalInvoice(invoice);
    const valid = this.createVerificationCode(view) === request.verificationCode.toUpperCase();

    return {
      valid,
      invoiceNumber: invoice.invoiceNumber,
      status: this.mapStatus(invoice.status),
      invoiceDate: invoice.date,
      sellerName: invoice.company?.name || 'Unknown seller',
      buyerName: this.getBuyer(invoice).legalName || invoice.customerName,
      grandTotal: Number(invoice.totalAmount),
      message: valid ? 'Invoice verification succeeded' : 'Verification code does not match invoice data',
    };
  }

  private async findInvoice(identifier: string) {
    return this.prisma.invoice.findFirst({
      where: {
        OR: [
          { id: identifier },
          { invoiceNumber: identifier },
          { telecomReceiptRef: identifier },
        ],
      },
      include: {
        company: true,
        customer: true,
        invoiceItem: true,
        invoicePayment: true,
      },
    });
  }

  private toFiscalInvoice(invoice: any, options: {
    invoiceType?: InvoiceType;
    paymentTerms?: string;
    notes?: string;
  } = {}): FiscalInvoiceDto {
    const seller = this.getSeller(invoice);
    const buyer = this.getBuyer(invoice);
    const lineItems = this.getLineItems(invoice);
    const totals = this.getTotals(invoice);
    const verificationCode = this.createVerificationCode({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceType: options.invoiceType || this.getInvoiceType(invoice),
      status: this.mapStatus(invoice.status),
      invoiceDate: invoice.date,
      dueDate: invoice.dueDate || invoice.date,
      currency: invoice.currencyCode,
      seller,
      buyer,
      lineItems,
      totals,
      paymentTerms: options.paymentTerms || invoice.paymentTerms || undefined,
      notes: options.notes || invoice.notes || invoice.customerNotes || undefined,
      qrCodeData: invoice.qrData || undefined,
      digitalSignature: invoice.eimsSignedQr || undefined,
      signedAt: invoice.eimsRegisteredAt || undefined,
      fiscalDeviceSerial: invoice.fsNo || undefined,
      fiscalReceiptNumber: invoice.telecomReceiptRef || invoice.eimsIrn || undefined,
    } as FiscalInvoiceDto);
    const qrData = invoice.qrData || this.createQrData(
      {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceType: options.invoiceType || this.getInvoiceType(invoice),
        status: this.mapStatus(invoice.status),
        invoiceDate: invoice.date,
        dueDate: invoice.dueDate || invoice.date,
        currency: invoice.currencyCode,
        seller,
        buyer,
        lineItems,
        totals,
        paymentTerms: options.paymentTerms || invoice.paymentTerms || undefined,
        notes: options.notes || invoice.notes || invoice.customerNotes || undefined,
      } as FiscalInvoiceDto,
      verificationCode,
    );

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceType: options.invoiceType || this.getInvoiceType(invoice),
      status: this.mapStatus(invoice.status),
      invoiceDate: invoice.date,
      dueDate: invoice.dueDate || invoice.date,
      currency: invoice.currencyCode,
      seller,
      buyer,
      lineItems,
      totals,
      paymentTerms: options.paymentTerms || invoice.paymentTerms || undefined,
      notes: options.notes || invoice.notes || invoice.customerNotes || undefined,
      fiscalDeviceSerial: invoice.fsNo || undefined,
      fiscalReceiptNumber: invoice.telecomReceiptRef || invoice.eimsIrn || undefined,
      qrCodeData: qrData,
      digitalSignature: invoice.eimsSignedQr || undefined,
      signedAt: invoice.eimsRegisteredAt || undefined,
    };
  }

  private getSeller(invoice: any): FiscalParty {
    const company = invoice.company || {};
    return {
      legalName: company.name || 'Unknown seller',
      tradeName: company.name || 'Unknown seller',
      tin: company.tin || '',
      addressLine1: company.location || '',
      city: '',
      region: '',
      country: 'Ethiopia',
      postalCode: '',
      phone: '',
      email: '',
      vatNumber: company.vatNumber || undefined,
    };
  }

  private getBuyer(invoice: any): FiscalParty {
    const stored = this.parseJson(invoice.buyerDetails) as Record<string, any> | null;
    const customer = invoice.customer || {};
    const value = (key: string, fallback = '') =>
      String(stored?.[key] ?? customer[key] ?? invoice[key] ?? fallback);

    return {
      legalName: value('legalName', invoice.customerName || 'Cash customer'),
      tradeName: value('name', invoice.customerName || 'Cash customer'),
      tin: value('tin', invoice.customerTin || ''),
      addressLine1: value('addressLine1', invoice.customerAddress || ''),
      addressLine2: value('addressLine2') || undefined,
      city: value('city'),
      region: value('region'),
      country: value('country', 'Ethiopia'),
      postalCode: value('postalCode'),
      phone: value('phone', invoice.customerPhone || ''),
      email: value('email', invoice.customerEmail || ''),
      vatNumber: value('vatNumber') || undefined,
      contactPerson: value('contactPerson') || undefined,
    };
  }

  private getLineItems(invoice: any): FiscalLineItem[] {
    const storedItems = this.parseJson(invoice.items) as any[] | null;
    const items = Array.isArray(storedItems) && storedItems.length > 0
      ? storedItems
      : (invoice.invoiceItem || []);
    const taxRate = Number(invoice.vatRate || 0);
    const taxType = invoice.isVatRegistered === false ? 'EXEMPT' : 'VAT';

    return items.map((item: any, index: number) => {
      const quantity = Number(item.quantity ?? 1);
      const unitPrice = Number(item.price ?? item.salePrice ?? item.unitPrice ?? 0);
      const discountType = String(item.discountType || 'FIXED').toUpperCase();
      const discountValue = Number(item.discountValue ?? item.discount ?? 0);
      const gross = unitPrice * quantity;
      const discount = discountType === 'PERCENT'
        ? gross * (discountValue / 100)
        : Math.min(gross, discountValue);
      const lineTotal = Math.max(0, gross - discount);
      const taxAmount = taxType === 'VAT' ? Math.round(lineTotal * taxRate) / 100 : 0;
      return {
        lineNumber: index + 1,
        description: String(item.description || item.name || 'Item'),
        hsCode: item.hsCode || item.hs_code || undefined,
        quantity,
        unitOfMeasure: String(item.unitOfMeasure || item.unit || 'EA'),
        unitPrice,
        discountPercent: discountType === 'PERCENT' ? discountValue : undefined,
        taxRate,
        taxType,
        lineTotal: Math.round(lineTotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        lineTotalWithTax: Math.round((lineTotal + taxAmount) * 100) / 100,
      };
    });
  }

  private getTotals(invoice: any): FiscalTotals {
    const payments = (invoice.invoicePayment || []) as any[];
    const amountPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const grandTotal = Number(invoice.totalAmount || 0);
    const subtotal = Number(invoice.subtotal || 0);
    const totalTax = Number(invoice.vatAmount || 0);
    const totalDiscount = Number(invoice.discountAmount ?? invoice.invoiceDiscount ?? 0);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      amountPaid: Math.round(amountPaid * 100) / 100,
      amountDue: Math.round(Math.max(0, grandTotal - amountPaid) * 100) / 100,
      roundingAdjustment: 0,
    };
  }

  private getInvoiceType(invoice: any): InvoiceType {
    if (/credit/i.test(invoice.docType || '')) return InvoiceType.CREDIT_NOTE;
    if (/debit/i.test(invoice.docType || '')) return InvoiceType.DEBIT_NOTE;
    if (/proforma/i.test(invoice.docType || '')) return InvoiceType.PROFORMA;
    return InvoiceType.VAT_INVOICE;
  }

  private mapStatus(status: string): InvoiceStatus {
    const normalized = String(status || 'DRAFT').toUpperCase();
    if (normalized === 'PAID') return 'PAID' as InvoiceStatus;
    if (normalized === 'PARTIAL') return 'PARTIAL' as InvoiceStatus;
    if (normalized === 'OVERDUE') return 'OVERDUE' as InvoiceStatus;
    if (normalized === 'CANCELLED' || normalized === 'VOID') return 'CANCELLED' as InvoiceStatus;
    if (normalized === 'SENT' || normalized === 'POSTED') return 'ISSUED' as InvoiceStatus;
    return 'DRAFT' as InvoiceStatus;
  }

  private createVerificationCode(invoice: FiscalInvoiceDto): string {
    return createHash('sha256')
      .update([
        invoice.invoiceNumber,
        invoice.id,
        invoice.invoiceDate.toISOString(),
        invoice.totals.grandTotal.toFixed(2),
        invoice.totals.totalTax.toFixed(2),
      ].join('|'))
      .digest('hex')
      .slice(0, 16)
      .toUpperCase();
  }

  private createQrData(invoice: FiscalInvoiceDto, verificationCode: string): string {
    const values = [
      invoice.seller.tin,
      invoice.invoiceNumber,
      invoice.invoiceDate.toISOString().slice(0, 10),
      invoice.totals.grandTotal.toFixed(2),
      invoice.totals.totalTax.toFixed(2),
      verificationCode,
    ];
    return values.map((value) => this.escapeQrValue(value)).join('|');
  }

  private escapeQrValue(value: string): string {
    return String(value ?? '').replace(/([|\\])/g, '\\$1');
  }

  private parseJson(value: any): any {
    if (typeof value !== 'string') return value ?? null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private renderPdf(invoice: FiscalInvoiceDto): Buffer {
    const verificationCode = invoice.digitalSignature || this.createVerificationCode(invoice);
    const lines = this.buildPdfLines(invoice, verificationCode);
    const pageLines = this.paginate(lines);
    const objects: string[] = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [' + pageLines.map((_, index) => `${index + 4} 0 R`).join(' ') + '] /Count ' + pageLines.length + ' >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      ...pageLines.map((page) => this.pageObject(page)),
      ...pageLines.map((page) => this.contentObject(page)),
    ];
    const offsets: number[] = [0];
    let size = 0;
    for (let index = 0; index < objects.length; index += 1) {
      offsets.push(size);
      size += Buffer.byteLength(`${index + 1} 0 obj\n${objects[index]}\nendobj\n`);
    }

    const xrefOffset = size;
    let result = Buffer.alloc(0);
    for (let index = 0; index < objects.length; index += 1) {
      result = Buffer.concat([
        result,
        Buffer.from(`${index + 1} 0 obj\n${objects[index]}\nendobj\n`),
      ]);
    }
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let index = 1; index <= objects.length; index += 1) {
      xref += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
    }
    result = Buffer.concat([
      result,
      Buffer.from(xref),
      Buffer.from(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`),
    ]);
    return result;
  }

  private buildPdfLines(invoice: FiscalInvoiceDto, verificationCode: string): string[] {
    const lines: string[] = [
      'ETHIOPIAN FISCAL INVOICE',
      `Invoice number: ${invoice.invoiceNumber}`,
      `Invoice date: ${this.formatDate(invoice.invoiceDate)}`,
      `Due date: ${this.formatDate(invoice.dueDate)}`,
      `Status: ${invoice.status}`,
      `Currency: ${invoice.currency}`,
      '',
      'SELLER',
      `${invoice.seller.legalName} | TIN: ${invoice.seller.tin || 'N/A'}`,
      `${invoice.seller.addressLine1 || 'Address not provided'}`,
      '',
      'BUYER',
      `${invoice.buyer.legalName} | TIN: ${invoice.buyer.tin || 'N/A'}`,
      `${invoice.buyer.addressLine1 || 'Address not provided'}`,
      '',
      'LINE ITEMS',
      'No  Description                         Qty   Unit price   Total',
    ];

    for (const item of invoice.lineItems) {
      lines.push(
        `${String(item.lineNumber).padStart(2)}  ${this.fit(item.description, 34)} ${String(item.quantity).padStart(6)} ${this.money(item.unitPrice).padStart(11)} ${this.money(item.lineTotalWithTax).padStart(11)}`,
      );
    }

    lines.push('', 'TOTALS');
    lines.push(`Subtotal: ${this.money(invoice.totals.subtotal)}`);
    lines.push(`Discount: ${this.money(invoice.totals.totalDiscount)}`);
    lines.push(`VAT: ${this.money(invoice.totals.totalTax)}`);
    lines.push(`Grand total: ${this.money(invoice.totals.grandTotal)}`);
    lines.push(`Amount paid: ${this.money(invoice.totals.amountPaid)}`);
    lines.push(`Amount due: ${this.money(invoice.totals.amountDue)}`);
    lines.push('');
    lines.push(`Verification code: ${verificationCode}`);
    lines.push(`QR data: ${invoice.qrCodeData || 'Not available'}`);
    lines.push(`Verification URL: ${this.verificationUrl(invoice.invoiceNumber, verificationCode)}`);
    if (invoice.fiscalDeviceSerial) lines.push(`Fiscal device: ${invoice.fiscalDeviceSerial}`);
    if (invoice.fiscalReceiptNumber) lines.push(`Receipt reference: ${invoice.fiscalReceiptNumber}`);
    if (invoice.paymentTerms) lines.push(`Payment terms: ${invoice.paymentTerms}`);
    if (invoice.notes) lines.push(`Notes: ${invoice.notes}`);
    return lines;
  }

  private pageObject(_page: string[]): string {
    return '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents PLACEHOLDER 0 R >>';
  }

  private contentObject(page: string[]): string {
    const commands = page.map((line, index) => {
      const y = index === 0 ? 750 : 0;
      const prefix = index === 0 ? '50 750 Td' : '0 -13 Td';
      return `${prefix} (${this.escapePdf(line)}) Tj`;
    });
    return `<< /Length ${Buffer.byteLength(commands.join('\n'))} >>\nstream\n${commands.join('\n')}\nendstream`;
  }

  private paginate(lines: string[]): string[][] {
    const pages: string[][] = [];
    let current: string[] = [];
    for (const line of lines) {
      if (current.length >= 48) {
        pages.push(current);
        current = [];
      }
      current.push(line);
    }
    if (current.length > 0) pages.push(current);
    return pages.length > 0 ? pages : [['No invoice data']];
  }

  private verificationUrl(invoiceNumber: string, verificationCode: string): string {
    const baseUrl = this.config.get<string>('PUBLIC_BASE_URL') || 'http://localhost:3001';
    return `${baseUrl.replace(/\/$/, '')}/api/fiscal-invoices/verify?invoiceNumber=${encodeURIComponent(invoiceNumber)}&verificationCode=${encodeURIComponent(verificationCode)}`;
  }

  private formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  }

  private money(value: number): string {
    return `${Number(value || 0).toFixed(2)} ETB`;
  }

  private fit(value: string, width: number): string {
    const normalized = this.ascii(value);
    return normalized.length <= width ? normalized.padEnd(width) : normalized.slice(0, Math.max(1, width - 1)) + '…';
  }

  private ascii(value: string): string {
    return String(value ?? '')
      .normalize('NFKD')
      .replace(/[^\x20-\x7E]/g, '?')
      .replace(/[\r\n]+/g, ' ');
  }

  private escapePdf(value: string): string {
    return this.ascii(value).replace(/([\\()])/g, '\\$1');
  }
}
