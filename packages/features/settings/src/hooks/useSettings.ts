import { useState, useEffect, useCallback } from 'react';
import {
  companySettingsApi, moduleSettingsApi, invoiceSettingsApi, currencySettingsApi,
  emailSettingsApi, centralControlPanelApi, settingsCatalogApi,
  taxSettingsApi, securitySettingsApi, defaultsSettingsApi,
  localizationSettingsApi, businessIdentityApi, systemSettingsApi, integrationsSettingsApi,
  maintainingTechnologyApi
} from '../services/settingsApi';

export function useCompanySettings(companyId?: string | null) {
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { setSettings(await companySettingsApi.get(companyId)); }
    catch (e: any) { setError(e?.message ?? 'Failed to load settings'); }
    finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { settings, loading, error, refetch: fetch };
}

export function useModuleSettings(companyId?: string | null) {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { setModules(await moduleSettingsApi.list(companyId)); }
    catch (e: any) { setError(e?.message ?? 'Failed to load module settings'); }
    finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { modules, loading, error, refetch: fetch };
}

export function useInvoiceSettings(companyId?: string | null) {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { setSettings(await invoiceSettingsApi.get(companyId)); }
    catch (e: any) { setError(e?.message ?? 'Failed to load invoice settings'); }
    finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { fetch(); }, [fetch]);
  const update = useCallback(async (data: Record<string, string>) => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { await invoiceSettingsApi.update(companyId, data); await fetch(); }
    catch (e: any) { setError(e?.message ?? 'Failed to update invoice settings'); }
    finally { setLoading(false); }
  }, [companyId, fetch]);
  return { settings, loading, error, refetch: fetch, update };
}

export function useCurrencySettings(companyId?: string | null) {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { setSettings(await currencySettingsApi.get(companyId)); }
    catch (e: any) { setError(e?.message ?? 'Failed to load currency settings'); }
    finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { fetch(); }, [fetch]);
  const update = useCallback(async (data: Record<string, string>) => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { await currencySettingsApi.update(companyId, data); await fetch(); }
    catch (e: any) { setError(e?.message ?? 'Failed to update currency settings'); }
    finally { setLoading(false); }
  }, [companyId, fetch]);
  return { settings, loading, error, refetch: fetch, update };
}

export function useEmailSettings() {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSettings(await emailSettingsApi.get()); }
    catch (e: any) { setError(e?.message ?? 'Failed to load email settings'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  const update = useCallback(async (data: Record<string, string>) => {
    setLoading(true); setError(null);
    try { await emailSettingsApi.update(data); await fetch(); }
    catch (e: any) { setError(e?.message ?? 'Failed to update email settings'); }
    finally { setLoading(false); }
  }, [fetch]);
  const test = useCallback(async (to: string) => {
    return emailSettingsApi.test(to);
  }, []);
  return { settings, loading, error, refetch: fetch, update, test };
}

export function useSettingsCatalog() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setCategories(await settingsCatalogApi.list()); }
    catch (e: any) { setError(e?.message ?? 'Failed to load settings catalog'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  return { categories, loading, error, refetch: fetch };
}

export function useCentralControlPanel(companyId?: string | null) {
  const [panel, setPanel] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);
  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { setPanel(await centralControlPanelApi.get(companyId)); }
    catch (e: any) { setError(e?.message ?? 'Failed to load control panel'); }
    finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { fetch(); }, [fetch]);
  const updateSection = useCallback(async (section: string, data: Record<string, any>) => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try {
      const result = await centralControlPanelApi.updateSection(companyId, section, data);
      await fetch();
      return result;
    } catch (e: any) {
      setError(e?.message ?? `Failed to update ${section}`);
      throw e;
    } finally { setLoading(false); }
  }, [companyId, fetch]);
  const migrate = useCallback(async () => {
    if (!companyId) return;
    setMigrating(true); setError(null);
    try {
      const result = await centralControlPanelApi.migrate(companyId);
      await fetch();
      return result;
    } catch (e: any) {
      setError(e?.message ?? 'Failed to migrate legacy configurations');
      throw e;
    } finally { setMigrating(false); }
  }, [companyId, fetch]);
  return { panel, loading, error, migrating, refetch: fetch, updateSection, migrate };
}

export function useTaxSettings(companyId?: string | null) {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { setSettings(await taxSettingsApi.get(companyId)); }
    catch (e: any) { setError(e?.message ?? 'Failed to load tax settings'); }
    finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { fetch(); }, [fetch]);
  const update = useCallback(async (data: Record<string, string>) => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { await taxSettingsApi.update(companyId, data); await fetch(); }
    catch (e: any) { setError(e?.message ?? 'Failed to update tax settings'); }
    finally { setLoading(false); }
  }, [companyId, fetch]);
  return { settings, loading, error, refetch: fetch, update };
}

export function useSecuritySettings(companyId?: string | null) {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { setSettings(await securitySettingsApi.get(companyId)); }
    catch (e: any) { setError(e?.message ?? 'Failed to load security settings'); }
    finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { fetch(); }, [fetch]);
  const update = useCallback(async (data: Record<string, string>) => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { await securitySettingsApi.update(companyId, data); await fetch(); }
    catch (e: any) { setError(e?.message ?? 'Failed to update security settings'); }
    finally { setLoading(false); }
  }, [companyId, fetch]);
  return { settings, loading, error, refetch: fetch, update };
}

export function useDefaultsSettings(companyId?: string | null) {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { setSettings(await defaultsSettingsApi.get(companyId)); }
    catch (e: any) { setError(e?.message ?? 'Failed to load default settings'); }
    finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { fetch(); }, [fetch]);
  const update = useCallback(async (data: Record<string, string>) => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { await defaultsSettingsApi.update(companyId, data); await fetch(); }
    catch (e: any) { setError(e?.message ?? 'Failed to update default settings'); }
    finally { setLoading(false); }
  }, [companyId, fetch]);
  return { settings, loading, error, refetch: fetch, update };
}

export function useLocalizationSettings(companyId?: string | null) {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { setSettings(await localizationSettingsApi.get(companyId)); }
    catch (e: any) { setError(e?.message ?? 'Failed to load localization settings'); }
    finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { fetch(); }, [fetch]);
  const update = useCallback(async (data: Record<string, string>) => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { await localizationSettingsApi.update(companyId, data); await fetch(); }
    catch (e: any) { setError(e?.message ?? 'Failed to update localization settings'); }
    finally { setLoading(false); }
  }, [companyId, fetch]);
  return { settings, loading, error, refetch: fetch, update };
}

export function useBusinessIdentity(companyId?: string | null) {
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { setSettings(await businessIdentityApi.get(companyId)); }
    catch (e: any) { setError(e?.message ?? 'Failed to load business identity'); }
    finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { fetch(); }, [fetch]);
  const update = useCallback(async (data: Record<string, string>) => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { await businessIdentityApi.update(companyId, data); await fetch(); }
    catch (e: any) { setError(e?.message ?? 'Failed to update business identity'); }
    finally { setLoading(false); }
  }, [companyId, fetch]);
  return { settings, loading, error, refetch: fetch, update };
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSettings(await systemSettingsApi.get()); }
    catch (e: any) { setError(e?.message ?? 'Failed to load system settings'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  const update = useCallback(async (data: Record<string, string>) => {
    setLoading(true); setError(null);
    try { await systemSettingsApi.update(data); await fetch(); }
    catch (e: any) { setError(e?.message ?? 'Failed to update system settings'); }
    finally { setLoading(false); }
  }, [fetch]);
  return { settings, loading, error, refetch: fetch, update };
}

export function useIntegrationsSettings() {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSettings(await integrationsSettingsApi.get()); }
    catch (e: any) { setError(e?.message ?? 'Failed to load integrations settings'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  const update = useCallback(async (data: Record<string, string>) => {
    setLoading(true); setError(null);
    try { await integrationsSettingsApi.update(data); await fetch(); }
    catch (e: any) { setError(e?.message ?? 'Failed to update integrations settings'); }
    finally { setLoading(false); }
  }, [fetch]);
  return { settings, loading, error, refetch: fetch, update };
}

export function useMaintainingTechnologySettings(companyId?: string | null) {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { setSettings(await maintainingTechnologyApi.get(companyId)); }
    catch (e: any) { setError(e?.message ?? 'Failed to load maintaining technology settings'); }
    finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { fetch(); }, [fetch]);
  const update = useCallback(async (data: Record<string, string>) => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { await maintainingTechnologyApi.update(companyId, data); await fetch(); }
    catch (e: any) { setError(e?.message ?? 'Failed to update maintaining technology settings'); }
    finally { setLoading(false); }
  }, [companyId, fetch]);
  return { settings, loading, error, refetch: fetch, update };
}
