/**
 * @file et-vat-module.ts
 * @module @ovds/tax/countries/et
 *
 * Ethiopia VAT Module (ET-VAT)
 * ────────────────────────────
 * The fully self-contained, pluggable VAT module for the Federal
 * Democratic Republic of Ethiopia.
 *
 * This module is the REFERENCE implementation — all other country
 * modules follow the same structure:
 *
 *   1. Extend VatModule
 *   2. Provide a concrete rule engine (EtVatRuleEngine)
 *   3. Declare report templates (VAT-01 form)
 *   4. Declare filing form specs (XML schema for ERCA e-filing)
 *   5. Implement ModuleApp lifecycle: register() + boot()
 *
 * ERCA integration environment variables (see validateEnvVars()):
 *   EIMS_API_URL      — base URL of the ERCA EIMS API
 *   EIMS_CLIENT_ID    — client ID for ERCA OAuth
 *   EIMS_CLIENT_SECRET — client secret for ERCA OAuth
 */

import { VatModule }       from '@ovds/core/vat';
import type {
  ModuleAppContainer,
  ModuleAppEventBus,
  ModuleAppMenuItem,
  ModuleAppPermission,
  ModuleAppSetting,
}                          from '@ovds/core';
import type {
  VatReportTemplate,
}                          from '@ovds/core/vat';
import type { VatFilingFormSpec } from '@ovds/core/vat';
import { EtVatRuleEngine } from './et-vat-rule-engine';

export class EtVatModule extends VatModule {
  private _ruleEngine = new EtVatRuleEngine();

  constructor() {
    super({
      name:             'et-vat',
      displayName:      'Ethiopia VAT (ERCA)',
      version:          '2.1.0',
      description:      'Ethiopian VAT rules per Proclamation 285/2002 & 609/2008. ' +
                        'Includes 15% standard rate, exempt categories, zero-rated exports, ' +
                        'ERCA EIMS integration, and Withholding VAT support.',
      author:           'OVDS Core',
      category:         'vat',
      icon:             'Flag',
      countryCode:      'ET',
      countryName:      'Ethiopia',
      filingFrequencies: ['MONTHLY'],
      subscriptionTiers: ['professional', 'enterprise'],
      complianceStandards: ['ERCA-VAT', 'IFRS', 'EIMS'],
      authority: {
        id:              'ERCA',
        name:            'Ethiopian Revenue and Customs Authority',
        apiBaseUrl:      process.env['EIMS_API_URL'] ?? null,
        authMethod:      'OAUTH2',
        filingChannels:  ['API_DIRECT', 'PORTAL_UPLOAD'],
        sandboxSupported: true,
        developerDocsUrl: 'https://www.erca.gov.et/developer',
        requiredEnvVars: ['EIMS_API_URL', 'EIMS_CLIENT_ID', 'EIMS_CLIENT_SECRET'],
      },
      locales: [
        {
          languageTag:   'am-ET',
          label:         'Amharic (Ethiopia)',
          numberFormat:  { decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2 },
          currency:      { code: 'ETB', symbol: 'Br', symbolPosition: 'BEFORE' },
          calendarSystem: 'ETHIOPIAN',
          dateFormat:    'DD/MM/YYYY',
        },
        {
          languageTag:   'en-ET',
          label:         'English (Ethiopia)',
          numberFormat:  { decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2 },
          currency:      { code: 'ETB', symbol: 'ETB', symbolPosition: 'BEFORE' },
          calendarSystem: 'GREGORIAN',
          dateFormat:    'DD/MM/YYYY',
        },
      ],
      dataFlow: {
        emitsTo:      ['audit-log', 'notifications', 'ledger'],
        receivesFrom: ['sales', 'purchases', 'banking'],
      },
    });
  }

  // ── VAT contract ──────────────────────────────────────────────────────────

  ruleEngine(): EtVatRuleEngine {
    return this._ruleEngine;
  }

  reportTemplates(): VatReportTemplate[] {
    return [
      {
        id:          'et-vat-return-form',
        label:       'ERCA VAT Return (Form VAT-01)',
        description: 'Official Ethiopian VAT return form submitted monthly to ERCA',
        formats:     ['PDF', 'XML', 'XLSX'],
        countryCode: 'ET',
        formVersion: 'VAT-01-2024',
      },
      {
        id:          'et-vat-summary-report',
        label:       'VAT Summary Report',
        description: 'Management-level VAT analysis: output, input, and net payable',
        formats:     ['PDF', 'XLSX'],
        countryCode: 'ET',
        formVersion: 'INTERNAL-v1',
      },
      {
        id:          'et-vat-withholding-certificate',
        label:       'Withholding VAT Certificate',
        description: 'Certificate issued to suppliers for WHT-deducted purchases',
        formats:     ['PDF'],
        countryCode: 'ET',
        formVersion: 'ERCA-WHT-CERT-2024',
      },
      {
        id:          'et-eims-reconciliation',
        label:       'EIMS Reconciliation Report',
        description: 'Reconciles OVDS invoices with ERCA EIMS fiscal device records',
        formats:     ['XLSX', 'CSV'],
        countryCode: 'ET',
        formVersion: 'EIMS-REC-v1',
      },
    ];
  }

  filingForms(): VatFilingFormSpec[] {
    return [
      {
        formId:        'ERCA-VAT-01',
        label:         'Monthly VAT Return',
        schemaRef:     'schemas/et/erca-vat-01-2024.xsd',
        exportFormats: ['XML', 'PDF'],
        version:       '2024',
        effectiveFrom: '2024-01-01',
      },
      {
        formId:        'ERCA-WHT-CERT',
        label:         'WHT Certificate',
        exportFormats: ['PDF'],
        version:       '2024',
        effectiveFrom: '2024-01-01',
      },
    ];
  }

  // ── ModuleApp lifecycle ───────────────────────────────────────────────────

  async register(eventBus: ModuleAppEventBus): Promise<void> {
    // Listen for invoice-posted events to auto-calculate VAT
    eventBus.listen('sales.invoice.posted', async (event) => {
      this.logger.debug(`ET-VAT: invoice.posted received — ${JSON.stringify(event.payload)}`);
    });

    // Listen for bill-posted events to record input VAT
    eventBus.listen('purchases.bill.posted', async (event) => {
      this.logger.debug(`ET-VAT: bill.posted received — ${JSON.stringify(event.payload)}`);
    });

    this.logger.log('EtVatModule registered event listeners');
  }

  async boot(container: ModuleAppContainer): Promise<void> {
    // Validate required ERCA env vars — warn but don't crash startup
    const missing = this.validateEnvVars();
    if (missing.length > 0) {
      this.logger.warn(
        `ET-VAT: ERCA integration partially configured. ` +
        `Missing env vars: ${missing.join(', ')}. ` +
        `E-filing via API will fall back to portal-upload mode.`,
      );
    } else {
      this.logger.log('ET-VAT: ERCA integration environment verified ✓');
    }

    this.logger.log(`EtVatModule booted — rule set version ${this._ruleEngine.ruleSetVersion}`);
  }

  // ── ModuleApp declarative metadata ───────────────────────────────────────

  menus(): ModuleAppMenuItem[] {
    return [
      {
        key:   'vat-et',
        label: 'Ethiopia VAT',
        icon:  'FileText',
        order: 10,
        group: 'tax',
        requiredPermissions: ['vat:read'],
        children: [
          { key: 'vat-et-dashboard',    label: 'VAT Dashboard',       path: '/tax/vat/et',             order: 1, requiredPermissions: ['vat:read'] },
          { key: 'vat-et-filing',       label: 'Monthly Return',       path: '/tax/vat/et/filing',      order: 2, requiredPermissions: ['vat:write'] },
          { key: 'vat-et-input',        label: 'Input VAT Ledger',     path: '/tax/vat/et/input',       order: 3, requiredPermissions: ['vat:read'] },
          { key: 'vat-et-output',       label: 'Output VAT Ledger',    path: '/tax/vat/et/output',      order: 4, requiredPermissions: ['vat:read'] },
          { key: 'vat-et-wht',          label: 'WHT Certificates',     path: '/tax/vat/et/wht',         order: 5, requiredPermissions: ['vat:read'] },
          { key: 'vat-et-eims',         label: 'EIMS Reconciliation',  path: '/tax/vat/et/eims',        order: 6, requiredPermissions: ['vat:read'] },
          { key: 'vat-et-ack-vault',    label: 'Acknowledgement Vault',path: '/tax/vat/et/ack-vault',   order: 7, requiredPermissions: ['vat:read'] },
        ],
      },
    ];
  }

  permissions(): ModuleAppPermission[] {
    return [
      { key: 'vat:read',    label: 'View VAT data',       description: 'View VAT ledgers, returns, and reports' },
      { key: 'vat:write',   label: 'Prepare VAT returns', description: 'Create and edit VAT returns' },
      { key: 'vat:submit',  label: 'Submit to ERCA',      description: 'E-file returns to ERCA authority' },
      { key: 'vat:admin',   label: 'VAT Administration',  description: 'Manage VAT settings, rates, and WHT agents' },
    ];
  }

  settings(): ModuleAppSetting[] {
    return [
      {
        key:          'et_vat.filing_frequency',
        label:        'Filing Frequency',
        type:         'select',
        defaultValue: 'MONTHLY',
        options:      [{ label: 'Monthly', value: 'MONTHLY' }],
        group:        'ET VAT',
      },
      {
        key:          'et_vat.auto_calculate',
        label:        'Auto-calculate VAT on invoices',
        type:         'boolean',
        defaultValue: true,
        group:        'ET VAT',
      },
      {
        key:          'et_vat.eims_enabled',
        label:        'Enable EIMS Integration',
        type:         'boolean',
        defaultValue: false,
        group:        'ET VAT / ERCA Integration',
      },
      {
        key:          'et_vat.wht_agent',
        label:        'This company is a VAT Withholding Agent',
        type:         'boolean',
        defaultValue: false,
        group:        'ET VAT / Withholding',
      },
      {
        key:          'et_vat.default_wht_rate',
        label:        'Default WHT Rate (%)',
        type:         'number',
        defaultValue: 15,
        group:        'ET VAT / Withholding',
      },
    ];
  }
}

/** Singleton instance exported for registration at bootstrap */
export const etVatModule = new EtVatModule();
