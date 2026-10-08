import { DynamicModule, Module, Provider } from '@nestjs/common';

export interface OvdsExtensionConfig {
  moduleName: string;
  enableAutomation: boolean;
  hooks: string[];
}

@Module({})
export class ExtensionEngineModule {
  static registerExtension(config: OvdsExtensionConfig): DynamicModule {
    const configProvider: Provider = {
      provide: 'EXTENSION_CONFIG',
      useValue: config,
    };

    // Dynamically mount providers or resolve internal endpoints depending on config
    return {
      module: ExtensionEngineModule,
      providers: [configProvider],
      exports: [configProvider],
    };
  }
}