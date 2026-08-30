export interface ModuleConfig {
  autoDiscover: boolean;
  discoveryGlobs: string[];
  defaultEnabledForNewCompanies: string[];
  allowToggleCore: boolean;
  requireRestartOnToggle: boolean;
}

export const DEFAULT_MODULE_CONFIG: ModuleConfig = {
  autoDiscover: true,
  discoveryGlobs: [
    'packages/modules/*/src/*.provider.ts',
    'packages/modules/*/src/index.ts',
  ],
  defaultEnabledForNewCompanies: ['settings', 'sales', 'purchases', 'banking', 'items', 'tax', 'ovds'],
  allowToggleCore: false,
  requireRestartOnToggle: false,
};
