import type {
  SettingCategoryDto, SettingGroupDto, SettingDefinitionDto, SettingValueDto,
  ModuleDto, CompanyModuleDto, SettingInputDto, EmailSettingsDto,
  InvoiceSettingsDto, CurrencySettingsDto, TaxSettingsDto, SecuritySettingsDto,
  LocalizationSettingsDto, BusinessIdentitySettingsDto, DefaultsSettingsDto,
  SystemSettingsDto, IntegrationsSettingsDto,
} from '../entities';

export interface SettingsRepository {
  listCategories(): Promise<SettingCategoryDto[]>;
  listGroups(categoryId: string): Promise<SettingGroupDto[]>;
  listDefinitions(categoryId?: string, groupId?: string, module?: string): Promise<SettingDefinitionDto[]>;
  getValue(key: string, companyId?: string | null): Promise<SettingValueDto | null>;
  setValue(key: string, value: string, companyId?: string | null, type?: string, isEncrypted?: boolean): Promise<SettingValueDto>;
  deleteValue(key: string, companyId?: string | null): Promise<boolean>;
  listModules(): Promise<ModuleDto[]>;
  getCompanyModules(companyId: string): Promise<CompanyModuleDto[]>;
  enableModule(companyId: string, moduleKey: string, settings?: Record<string, string>): Promise<CompanyModuleDto>;
  disableModule(companyId: string, moduleKey: string): Promise<void>;
  isModuleEnabled(companyId: string, moduleKey: string): Promise<boolean>;
  listInputs(): Promise<SettingInputDto[]>;
  getStructuredProfile(companyId: string): Promise<Record<string, Record<string, string>>>;
  updateStructuredSection(companyId: string, section: string, data: Record<string, string>): Promise<Record<string, string>>;
  migrateLegacySettings(companyId: string): Promise<{ totalMigrated: number; migratedKeys: string[] }>;
  getEmailSettings(companyId?: string): Promise<EmailSettingsDto>;
  updateEmailSettings(data: Partial<EmailSettingsDto>, companyId?: string): Promise<EmailSettingsDto>;
  getInvoiceSettings(companyId: string): Promise<InvoiceSettingsDto>;
  updateInvoiceSettings(data: Partial<InvoiceSettingsDto>, companyId: string): Promise<InvoiceSettingsDto>;
  getCurrencySettings(companyId: string): Promise<CurrencySettingsDto>;
  updateCurrencySettings(data: Partial<CurrencySettingsDto>, companyId: string): Promise<CurrencySettingsDto>;
  getTaxSettings(companyId: string): Promise<TaxSettingsDto>;
  updateTaxSettings(data: Partial<TaxSettingsDto>, companyId: string): Promise<TaxSettingsDto>;
  getSecuritySettings(companyId: string): Promise<SecuritySettingsDto>;
  updateSecuritySettings(data: Partial<SecuritySettingsDto>, companyId: string): Promise<SecuritySettingsDto>;
  getLocalizationSettings(companyId: string): Promise<LocalizationSettingsDto>;
  updateLocalizationSettings(data: Partial<LocalizationSettingsDto>, companyId: string): Promise<LocalizationSettingsDto>;
  getBusinessIdentity(companyId: string): Promise<BusinessIdentitySettingsDto>;
  updateBusinessIdentity(data: Partial<BusinessIdentitySettingsDto>, companyId: string): Promise<BusinessIdentitySettingsDto>;
  getDefaultsSettings(companyId: string): Promise<DefaultsSettingsDto>;
  updateDefaultsSettings(data: Partial<DefaultsSettingsDto>, companyId: string): Promise<DefaultsSettingsDto>;
  getSystemSettings(): Promise<SystemSettingsDto>;
  updateSystemSettings(data: Partial<SystemSettingsDto>): Promise<SystemSettingsDto>;
  getIntegrationsSettings(): Promise<IntegrationsSettingsDto>;
  updateIntegrationsSettings(data: Partial<IntegrationsSettingsDto>): Promise<IntegrationsSettingsDto>;
}

export class SettingsService {
  constructor(private readonly repo: SettingsRepository) {}

  async listCategories() { return this.repo.listCategories(); }
  async listGroups(categoryId: string) { return this.repo.listGroups(categoryId); }
  async listDefinitions(categoryId?: string, groupId?: string, module?: string) { return this.repo.listDefinitions(categoryId, groupId, module); }
  async getValue(key: string, companyId?: string | null) { return this.repo.getValue(key, companyId); }
  async setValue(key: string, value: string, companyId?: string | null, type?: string, isEncrypted?: boolean) { return this.repo.setValue(key, value, companyId, type, isEncrypted); }
  async deleteValue(key: string, companyId?: string | null) { return this.repo.deleteValue(key, companyId); }
  async listModules() { return this.repo.listModules(); }
  async getCompanyModules(companyId: string) { return this.repo.getCompanyModules(companyId); }
  async enableModule(companyId: string, moduleKey: string, settings?: Record<string, string>) { return this.repo.enableModule(companyId, moduleKey, settings); }
  async disableModule(companyId: string, moduleKey: string) { return this.repo.disableModule(companyId, moduleKey); }
  async isModuleEnabled(companyId: string, moduleKey: string) { return this.repo.isModuleEnabled(companyId, moduleKey); }
  async listInputs() { return this.repo.listInputs(); }
  async getStructuredProfile(companyId: string) { return this.repo.getStructuredProfile(companyId); }
  async updateStructuredSection(companyId: string, section: string, data: Record<string, string>) { return this.repo.updateStructuredSection(companyId, section, data); }
  async migrateLegacySettings(companyId: string) { return this.repo.migrateLegacySettings(companyId); }
  async getEmailSettings(companyId?: string) { return this.repo.getEmailSettings(companyId); }
  async updateEmailSettings(data: Partial<EmailSettingsDto>, companyId?: string) { return this.repo.updateEmailSettings(data, companyId); }
  async getInvoiceSettings(companyId: string) { return this.repo.getInvoiceSettings(companyId); }
  async updateInvoiceSettings(data: Partial<InvoiceSettingsDto>, companyId: string) { return this.repo.updateInvoiceSettings(data, companyId); }
  async getCurrencySettings(companyId: string) { return this.repo.getCurrencySettings(companyId); }
  async updateCurrencySettings(data: Partial<CurrencySettingsDto>, companyId: string) { return this.repo.updateCurrencySettings(data, companyId); }
  async getTaxSettings(companyId: string) { return this.repo.getTaxSettings(companyId); }
  async updateTaxSettings(data: Partial<TaxSettingsDto>, companyId: string) { return this.repo.updateTaxSettings(data, companyId); }
  async getSecuritySettings(companyId: string) { return this.repo.getSecuritySettings(companyId); }
  async updateSecuritySettings(data: Partial<SecuritySettingsDto>, companyId: string) { return this.repo.updateSecuritySettings(data, companyId); }
  async getLocalizationSettings(companyId: string) { return this.repo.getLocalizationSettings(companyId); }
  async updateLocalizationSettings(data: Partial<LocalizationSettingsDto>, companyId: string) { return this.repo.updateLocalizationSettings(data, companyId); }
  async getBusinessIdentity(companyId: string) { return this.repo.getBusinessIdentity(companyId); }
  async updateBusinessIdentity(data: Partial<BusinessIdentitySettingsDto>, companyId: string) { return this.repo.updateBusinessIdentity(data, companyId); }
  async getDefaultsSettings(companyId: string) { return this.repo.getDefaultsSettings(companyId); }
  async updateDefaultsSettings(data: Partial<DefaultsSettingsDto>, companyId: string) { return this.repo.updateDefaultsSettings(data, companyId); }
  async getSystemSettings() { return this.repo.getSystemSettings(); }
  async updateSystemSettings(data: Partial<SystemSettingsDto>) { return this.repo.updateSystemSettings(data); }
  async getIntegrationsSettings() { return this.repo.getIntegrationsSettings(); }
  async updateIntegrationsSettings(data: Partial<IntegrationsSettingsDto>) { return this.repo.updateIntegrationsSettings(data); }
}
