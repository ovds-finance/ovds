import type { EventBusInterface } from '../events/event.interface';
import type { SettingsServiceInterface } from '../settings/settings.interface';

export interface ModuleInfo {
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: string;
  category: string;
  icon: string;
  dependsOn?: string[];
  installType: 'core' | 'app';
  subscriptionTiers?: string[];
  complianceStandards?: string[];
  dataFlow?: {
    emitsTo?: string[];
    receivesFrom?: string[];
  };
}

export interface ModuleRoute {
  path: string;
  component: string;
  permissions?: string[];
  meta?: Record<string, unknown>;
}

export interface MenuItem {
  key: string;
  label: string;
  path?: string;
  icon?: string;
  children?: MenuItem[];
  requiredPermissions?: string[];
  order: number;
  group?: string;
  badge?: number | string;
  isExternal?: boolean;
  onClick?: () => void;
}

export interface ModuleSetting {
  key: string;
  label: string;
  type: 'text' | 'boolean' | 'select' | 'number' | 'json';
  defaultValue: unknown;
  options?: { label: string; value: string }[];
  group?: string;
}

export interface ModulePermission {
  key: string;
  label: string;
  description: string;
  roles?: string[];
}

export interface ModuleHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  checkedAt: Date;
}

export interface ModuleInterface {
  info: ModuleInfo;
  register(eventBus: EventBusInterface): void | Promise<void>;
  boot(container: ModuleContainer): void | Promise<void>;
  routes(): ModuleRoute[];
  menus(): MenuItem[];
  settings(): ModuleSetting[];
  permissions(): ModulePermission[];
  migrations?: string[];
  health?(): Promise<ModuleHealth>;
}

export interface ModuleContainer {
  prisma: unknown;
  eventBus: EventBusInterface;
  settings: SettingsServiceInterface;
  logger: LoggerInterface;
  get<T>(token: string): T | undefined;
  has(token: string): boolean;
}

export interface LoggerInterface {
  log(message: string, context?: string): void;
  error(message: string, trace?: string, context?: string): void;
  warn(message: string, context?: string): void;
  debug(message: string, context?: string): void;
}
