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
  RbacRoleDTO,
  RbacPermissionDTO,
  SodRuleDTO,
  AuditEventCatalogDTO,
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
  rolesApi,
  permissionsApi,
  sodRulesApi,
  auditEventCatalogApi,
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
export { SettingsCard } from './components/SettingsCard';
