import type { Event, EventListener } from './events/event.interface';

export type ModuleInstallType = 'core' | 'app';

export interface ModuleAppOptions {
  name: string;
  displayName: string;
  version?: string;
  description?: string;
  author?: string;
  category?: string;
  icon?: string;
  dependsOn?: string[];
  autoDiscover?: boolean;
  singleton?: boolean;
  installType?: ModuleInstallType;
  subscriptionTiers?: string[];
  complianceStandards?: string[];
  dataFlow?: {
    emitsTo?: string[];
    receivesFrom?: string[];
  };
}

export interface ModuleAppContainer {
  prisma: unknown;
  eventBus: unknown;
  settings: unknown;
  logger: unknown;
  get<T>(token: string): T | undefined;
  has(token: string): boolean;
}

export interface ModuleAppEventBus {
  dispatch(event: Event): Promise<void>;
  listen(eventName: string, handler: (event: Event) => Promise<void> | void, options?: { priority?: number }): string;
  removeListener(listenerId: string): void;
  removeListeners(eventName: string, source?: string): void;
  getListeners(eventName: string): EventListener[];
  getHistory(eventName?: string): Event[];
}

export interface ModuleAppLogger {
  log(message: string, context?: string): void;
  error(message: string, trace?: string, context?: string): void;
  warn(message: string, context?: string): void;
  debug(message: string, context?: string): void;
}

export interface ModuleAppRoute {
  path: string;
  component: string;
  permissions?: string[];
  meta?: Record<string, unknown>;
}

export interface ModuleAppMenuItem {
  key: string;
  label: string;
  path?: string;
  icon?: string;
  children?: ModuleAppMenuItem[];
  requiredPermissions?: string[];
  order: number;
  group?: string;
  badge?: number | string;
  isExternal?: boolean;
  onClick?: () => void;
}

export interface ModuleAppSetting {
  key: string;
  label: string;
  type: 'text' | 'boolean' | 'select' | 'number' | 'json';
  defaultValue: unknown;
  options?: { label: string; value: string }[];
  group?: string;
}

export interface ModuleAppPermission {
  key: string;
  label: string;
  description: string;
  roles?: string[];
}

export interface ModuleAppInfo {
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: string;
  category: string;
  icon: string;
  dependsOn?: string[];
  installType: ModuleInstallType;
  subscriptionTiers?: string[];
  complianceStandards?: string[];
  dataFlow?: {
    emitsTo?: string[];
    receivesFrom?: string[];
  };
}

export interface ModuleAppHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  checkedAt: Date;
}

export interface ModuleAppInterface {
  info: ModuleAppInfo;
  register(eventBus: ModuleAppEventBus): void | Promise<void>;
  boot(container: ModuleAppContainer): void | Promise<void>;
  routes(): ModuleAppRoute[];
  menus(): ModuleAppMenuItem[];
  settings(): ModuleAppSetting[];
  permissions(): ModuleAppPermission[];
  migrations?: string[];
  health?(): Promise<ModuleAppHealth>;
}

export abstract class ModuleApp implements ModuleAppInterface {
  public readonly info: ModuleAppInfo;
  public readonly category: string;
  public readonly icon: string;
  public readonly dependsOn: string[];
  public readonly version: string;
  public readonly description: string;
  public readonly author: string;
  public readonly singleton: boolean;
  public readonly installType: ModuleInstallType;
  public readonly subscriptionTiers: string[];
  public readonly complianceStandards: string[];
  public readonly dataFlow: {
    emitsTo?: string[];
    receivesFrom?: string[];
  };

  protected container?: ModuleAppContainer;
  protected eventBus?: ModuleAppEventBus;
  protected logger: ModuleAppLogger;
  private _enabled = true;
  private _booted = false;
  private _registered = false;

  constructor(options: ModuleAppOptions) {
    this.info = {
      name: options.name,
      displayName: options.displayName,
      version: options.version ?? '1.0.0',
      description: options.description ?? '',
      author: options.author ?? 'OVDS',
      category: options.category ?? 'general',
      icon: options.icon ?? 'Package',
      dependsOn: options.dependsOn ?? [],
      installType: options.installType ?? 'app',
      subscriptionTiers: options.subscriptionTiers ?? [],
      complianceStandards: options.complianceStandards ?? [],
      dataFlow: options.dataFlow ?? {},
    };
    this.category = options.category ?? 'general';
    this.icon = options.icon ?? 'Package';
    this.dependsOn = options.dependsOn ?? [];
    this.version = options.version ?? '1.0.0';
    this.description = options.description ?? '';
    this.author = options.author ?? 'OVDS';
    this.singleton = options.singleton ?? true;
    this.installType = options.installType ?? 'app';
    this.subscriptionTiers = options.subscriptionTiers ?? [];
    this.complianceStandards = options.complianceStandards ?? [];
    this.dataFlow = options.dataFlow ?? {};

    this.logger = {
      log: (message: string, context?: string) => console.log(`[${this.info.name}] ${message}`, context ?? ''),
      error: (message: string, trace?: string, context?: string) => console.error(`[${this.info.name}] ${message}`, trace ?? '', context ?? ''),
      warn: (message: string, context?: string) => console.warn(`[${this.info.name}] ${message}`, context ?? ''),
      debug: (message: string, context?: string) => console.debug(`[${this.info.name}] ${message}`, context ?? ''),
    };
  }

  abstract register(eventBus: ModuleAppEventBus): void | Promise<void>;
  abstract boot(container: ModuleAppContainer): void | Promise<void>;

  setContainer(container: ModuleAppContainer): void {
    this.container = container;
  }

  setEventBus(eventBus: ModuleAppEventBus): void {
    this.eventBus = eventBus;
  }

  get isEnabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
  }

  get isBooted(): boolean {
    return this._booted;
  }

  get isRegistered(): boolean {
    return this._registered;
  }

  markRegistered(): void {
    this._registered = true;
  }

  markBooted(): void {
    this._booted = true;
  }

  routes(): ModuleAppRoute[] {
    return [];
  }

  menus(): ModuleAppMenuItem[] {
    return [];
  }

  settings(): ModuleAppSetting[] {
    return [];
  }

  permissions(): ModuleAppPermission[] {
    return [];
  }

  migrations?: string[];

  async health?(): Promise<ModuleAppHealth> {
    return {
      status: 'healthy',
      checkedAt: new Date(),
    };
  }
}
