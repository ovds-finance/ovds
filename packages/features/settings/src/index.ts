/**
 * @ovds/features/settings — public API
 */

// ── Types ──────────────────────────────────────────────────────────────────────
export type {
  RolePermissionOverrideDTO,
  SettingCategory,
  SettingGroup,
  SettingDefinition,
  SettingValueResponse,
  SettingOption,
} from './types/settings.types';

// ── Page content ───────────────────────────────────────────────────────────────
export { CentralControlPanelContent, SETTINGS_SECTIONS } from './pages/CentralControlPanelContent';
export type { SettingsSection, CentralControlPanelContentProps } from './pages/CentralControlPanelContent';

// ── API clients ────────────────────────────────────────────────────────────────
export {
  companySettingsApi, moduleSettingsApi, settingsCatalogApi, settingsCatalog, systemAdminApi,
  settingsCatalogCategoriesApi,
  settingsCatalogGroupsApi,
  settingsCatalogDefinitionsApi,
  settingsCatalogValuesApi,
  settingsCatalogOptionsApi,
  invoiceSettingsApi, currencySettingsApi, emailSettingsApi, centralControlPanelApi,
  taxSettingsApi, securitySettingsApi, defaultsSettingsApi,
  localizationSettingsApi, businessIdentityApi, systemSettingsApi, integrationsSettingsApi,
  maintainingTechnologyApi,
  advancedAccessApi,
} from './services/settingsApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useCompanySettings, useModuleSettings, useInvoiceSettings, useCurrencySettings,
  useEmailSettings, useSettingsCatalog, useCentralControlPanel,
  useTaxSettings, useSecuritySettings, useDefaultsSettings,
  useLocalizationSettings, useBusinessIdentity, useSystemSettings, useIntegrationsSettings,
  useMaintainingTechnologySettings
} from './hooks/useSettings';

// ── Components ────────────────────────────────────────────────────────────────
export { FieldRow, TextInput, SelectInput, ToggleInput, SetupChecklist } from './components/settingsForms';
export { SettingsCard } from './components/SettingsCard';
