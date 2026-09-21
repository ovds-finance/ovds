/**
 * @file ae-vat-module.ts
 * @module @ovds/tax/countries/ae
 *
 * UAE VAT Module (AE-VAT)
 * ───────────────────────
 * Pluggable VAT module for the United Arab Emirates.
 * Demonstrates multi-jurisdiction capability alongside ET-VAT.
 *
 * FTA e-filing integration environment variables:
 *   FTA_API_BASE_URL  — FTA EmaraTax API base URL
 *   FTA_CLIENT_ID     — OAuth2 client ID
 *   FTA_CLIENT_SECRET — OAuth2 client secret
 *   FTA_TRN           — Company Tax Registration Number
 */

import { VatModule }      from '@ovds/core/vat';
import type {
  ModuleAppContainer,
  ModuleAppEventBus,
  ModuleAppMenuItem,
  ModuleAppPermission,
  ModuleAppSetting,
}                         from '@ovds/core';
import type {
  VatReportTemplate,
}                         from '@ovds/core/vat';
import type { VatFilingFormSpec } from '@ovds/core/vat';
import { AeVatRuleEngine } from './ae-vat-rule-engine';

export class AeVatModule extends VatModule {
  private _ruleEngine = new AeVatRuleEngine();

  constructor() {
    super({
      name:             'ae-vat',
      displayName:      'UAE VAT (FTA)',
      version:          '1.3.0',
      description:      'UAE Federal VAT per FDL 8/2017. ' +
                        'Includes 5% standard rate, zero-rated exports, exempt categories, ' +
                        'reverse-charge on imports, Designated Zones, Profit Margin Scheme, ' +
                        'and FTA EmaraTax e-filing.',
      author:           'OVDS Core',
      category:         'vat',
      icon:             'Flag',
      countryCode:      'AE',
      countryName:      'United Arab Emirates',
      filingFrequencies: ['QUARTERLY', 'MONTHLY'],
      subscriptionTiers: ['professional', 'enterprise'],
      complianceStandards: ['FTA-VAT', 'IFRS', 'UAE-CORPORATE-TAX'],
      supportsMultiJurisdiction: true,
      authority: {
        id:              'FTA',
        name:            'Federal Tax Authority',
        apiBaseUrl:      process.env['FTA_API_BASE_URL'] ?? null,
        authMethod:      'OAUTH2',
        filingChannels:  ['API_DIRECT', 'PORTAL_UPLOAD'],
        sandboxSupported: true,
        developerDocsUrl: 'https://developer.tax.gov.ae',
        requiredEnvVars:  ['FTA_API_BASE_URL', 'FTA_CLIENT_ID', 'FTA_CLIENT_SECRET', 'FTA_TRN'],
      },
      locales: [
        {
          languageTag:   'ar-AE',
          label:         'Arabic (UAE)',
          numberFormat:  { decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2 },
          currency:      { code: 'AED', symbol: 'د.إ', symbolPosition: 'AFTER' },
          calendarSystem: 'GREGORIAN',
          dateFormat:    'DD/MM/YYYY',
        },
        {
          languageTag:   'en-AE',
          label:         'English (UAE)',
          numberFormat:  { decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2 },
          currency:      { code: 'AED', symbol: 'AED', symbolPosition: 'BEFORE' },
          calendarSystem: 'GREGORIAN',
          dateFormat:    'DD/MM/YYYY',
        },
      ],
      dataFlow: {
        emitsTo:      ['audit-log', 'notifications', 'ledger'],
        receivesFrom: ['sales', 'purchases', 'banking', 'customs'],
      },
    });
  }

  // ── VAT contract ──────────────────────────────────────────────────────────

  ruleEngine(): AeVatRuleEngine {
    return this._ruleEngine;
  }

  reportTemplates(): VatReportTemplate[] {
    return [
      {
        id:          'ae-vat201-return',
        label:       'FTA VAT Return (Form VAT201)',
        description: 'Official UAE VAT quarterly return submitted to FTA via EmaraTax',
        formats:     ['PDF', 'XML', 'XLSX'],
        countryCode: 'AE',
        formVersion: 'VAT201-v3',
      },
      {
        id:          'ae-vat-summary',
        label:       'VAT Summary Report',
        description: 'Management report: output tax, input tax, net payable, designated zone',
        formats:     ['PDF', 'XLSX'],
        countryCode: 'AE',
        formVersion: 'INTERNAL-v1',
      },
      {
        id:          'ae-vat-tax-invoice',
        label:       'FTA-Compliant Tax Invoice',
        description: 'Tax invoice template meeting all FTA Art. 59 requirements',
        formats:     ['PDF'],
        countryCode: 'AE',
        formVersion: 'FTA-INV-2024',
      },
      {
        id:          'ae-vat-reverse-charge-log',
        label:       'Reverse Charge Summary',
        description: 'Log of all supplies subject to reverse-charge VAT',
        formats:     ['XLSX', 'CSV'],
        countryCode: 'AE',
        formVersion: 'INTERNAL-v1',
      },
      {
        id:          'ae-vat-audit-file',
        label:       'FTA VAT Audit File (VAF)',
        description: 'Structured XML audit file for FTA examination',
        formats:     ['XML'],
        countryCode: 'AE',
        formVersion: 'VAF-v1',
      },
    ];
  }

  filingForms(): VatFilingFormSpec[] {
    return [
      {
        formId:        'VAT201',
        label:         'Quarterly VAT Return',
        schemaRef:     'schemas/ae/vat201-v3.xsd',
        exportFormats: ['XML', 'PDF'],
        version:       'v3',
        effectiveFrom: '2024-01-01',
      },
      {
        formId:        'VAT301',
        label:         'VAT Voluntary Disclosure',
        exportFormats: ['XML', 'PDF'],
        version:       'v1',
        effectiveFrom: '2018-01-01',
      },
    ];
  }

  // ── ModuleApp lifecycle ───────────────────────────────────────────────────

  async register(eventBus: ModuleAppEventBus): Promise<void> {
    eventBus.listen('sales.invoice.posted', async (event) => {
      this.logger.debug(`AE-VAT: invoice.posted — ${JSON.stringify(event.payload)}`);
    });

    eventBus.listen('customs.import.cleared', async (event) => {
      this.logger.debug(`AE-VAT: customs.import.cleared — reverse-charge VAT trigger ${JSON.stringify(event.payload)}`);
    });

    this.logger.log('AeVatModule registered event listeners');
  }

  async boot(container: ModuleAppContainer): Promise<void> {
    const missing = this.validateEnvVars();
    if (missing.length > 0) {
      this.logger.warn(
        `AE-VAT: FTA EmaraTax integration not fully configured. ` +
        `Missing: ${missing.join(', ')}. E-filing will require manual portal upload.`,
      );
    } else {
      this.logger.log('AE-VAT: FTA EmaraTax environment verified ✓');
    }
    this.logger.log(`AeVatModule booted — rule set version ${this._ruleEngine.ruleSetVersion}`);
  }

  // ── ModuleApp declarative metadata ───────────────────────────────────────

  menus(): ModuleAppMenuItem[] {
    return [
      {
        key:   'vat-ae',
        label: 'UAE VAT',
        icon:  'FileText',
        order: 20,
        group: 'tax',
        requiredPermissions: ['vat:read'],
        children: [
          { key: 'vat-ae-dashboard',  label: 'VAT Dashboard',        path: '/tax/vat/ae',             order: 1, requiredPermissions: ['vat:read']  },
          { key: 'vat-ae-filing',     label: 'Quarterly Return',      path: '/tax/vat/ae/filing',      order: 2, requiredPermissions: ['vat:write'] },
          { key: 'vat-ae-input',      label: 'Input VAT Ledger',      path: '/tax/vat/ae/input',       order: 3, requiredPermissions: ['vat:read']  },
          { key: 'vat-ae-output',     label: 'Output VAT Ledger',     path: '/tax/vat/ae/output',      order: 4, requiredPermissions: ['vat:read']  },
          { key: 'vat-ae-rcm',        label: 'Reverse Charge Log',    path: '/tax/vat/ae/rcm',         order: 5, requiredPermissions: ['vat:read']  },
          { key: 'vat-ae-designated', label: 'Designated Zones',      path: '/tax/vat/ae/designated',  order: 6, requiredPermissions: ['vat:read']  },
          { key: 'vat-ae-audit-file', label: 'VAT Audit File',        path: '/tax/vat/ae/audit-file',  order: 7, requiredPermissions: ['vat:admin'] },
        ],
      },
    ];
  }

  permissions(): ModuleAppPermission[] {
    return [
      { key: 'vat:read',   label: 'View UAE VAT data',        description: 'View ledgers, returns, reverse-charge log' },
      { key: 'vat:write',  label: 'Prepare UAE VAT returns',  description: 'Create and edit VAT201 returns' },
      { key: 'vat:submit', label: 'Submit to FTA',            description: 'E-file returns via FTA EmaraTax' },
      { key: 'vat:admin',  label: 'UAE VAT Administration',   description: 'Manage UAE VAT settings and audit files' },
    ];
  }

  settings(): ModuleAppSetting[] {
    return [
      {
        key:          'ae_vat.filing_frequency',
        label:        'Filing Frequency',
        type:         'select',
        defaultValue: 'QUARTERLY',
        options:      [
          { label: 'Quarterly', value: 'QUARTERLY' },
          { label: 'Monthly (> AED 150M turnover)', value: 'MONTHLY' },
        ],
        group: 'UAE VAT',
      },
      {
        key:          'ae_vat.trn',
        label:        'Tax Registration Number (TRN)',
        type:         'text',
        defaultValue: '',
        group:        'UAE VAT / FTA Integration',
      },
      {
        key:          'ae_vat.auto_calculate',
        label:        'Auto-calculate VAT on invoices',
        type:         'boolean',
        defaultValue: true,
        group:        'UAE VAT',
      },
      {
        key:          'ae_vat.enable_reverse_charge',
        label:        'Enable Reverse Charge on Imports',
        type:         'boolean',
        defaultValue: true,
        group:        'UAE VAT',
      },
      {
        key:          'ae_vat.profit_margin_scheme',
        label:        'Enable Profit Margin Scheme (second-hand goods)',
        type:         'boolean',
        defaultValue: false,
        group:        'UAE VAT',
      },
      {
        key:          'ae_vat.designated_zone_ids',
        label:        'Designated Zone IDs (comma-separated)',
        type:         'text',
        defaultValue: '',
        group:        'UAE VAT / Designated Zones',
      },
    ];
  }
}

/** Singleton instance exported for registration at bootstrap */
export const aeVatModule = new AeVatModule();
