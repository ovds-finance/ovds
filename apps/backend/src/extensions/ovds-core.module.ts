import { Module, DynamicModule, Type, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

export interface OvdsCoreModuleOptions {
  modules?: Type<any>[];
  enableAutomation?: boolean;
}

export const OVDS_CORE_CONFIG = Symbol('OVDS_CORE_CONFIG');

export interface OvdsCoreConfig {
  modules: Type<any>[];
  enableAutomation: boolean;
}

@Module({})
export class OvdsCoreModule {
  static registerExtensions(
    modules: Type<any>[],
    options?: { enableAutomation?: boolean },
  ): DynamicModule {
    const config: OvdsCoreConfig = {
      modules,
      enableAutomation: options?.enableAutomation ?? false,
    };

    const configProvider: Provider = {
      provide: OVDS_CORE_CONFIG,
      useValue: config,
    };

    return {
      module: OvdsCoreModule,
      imports: [ConfigModule, ...modules],
      providers: [configProvider],
      exports: [configProvider, ...modules],
    };
  }

  static forRootAsync(options: {
    modules?: Type<any>[];
    enableAutomation?: boolean;
  }): DynamicModule {
    return this.registerExtensions(options.modules ?? [], {
      enableAutomation: options.enableAutomation,
    });
  }
}
