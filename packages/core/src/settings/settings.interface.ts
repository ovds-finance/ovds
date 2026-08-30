export interface SettingsServiceInterface {
  get(key: string, defaultValue?: unknown): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  getForModule(moduleName: string, key: string): Promise<unknown>;
  setForModule(moduleName: string, key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  deleteForModule(moduleName: string, key: string): Promise<void>;
  getAllForModule(moduleName: string): Promise<Record<string, unknown>>;
  getAll(): Promise<Record<string, unknown>>;
}

export interface CoreSettingDefinition {
  key: string;
  label: string;
  type: 'text' | 'boolean' | 'select' | 'number' | 'json';
  defaultValue: unknown;
  options?: { label: string; value: string }[];
  group?: string;
  module?: string;
  required?: boolean;
  description?: string;
}

export interface ModuleSettings {
  moduleName: string;
  settings: CoreSettingDefinition[];
}
