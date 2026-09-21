import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PrismaModule } from '../common/prisma.module';
import { PrismaService } from '../common/prisma.service';
import { CoreModule } from '../core/core.module';

import { AdminMenuItemsController } from './admin-menu-items.controller';
import { AppstoreController } from './appstore.controller';
import { HelpdeskController } from './helpdesk.controller';
import { LicenseController } from './license.controller';
import { ModuleDownloadController } from './module-download.controller';
import { ModuleDownloadService } from './module-download.service';
import { NavController } from './nav.controller';
import { OfflineController } from './offline.controller';
import { ReleasesController } from './releases.controller';
import { SyncController } from './sync.controller';
import { SystemModulesController } from './system-modules.controller';
import { UtilsController } from './utils.controller';

@Module({
  imports: [PrismaModule, ConfigModule, CoreModule],
  controllers: [
    NavController,
    AdminMenuItemsController,
    AppstoreController,
    SystemModulesController,
    ReleasesController,
    OfflineController,
    SyncController,
    HelpdeskController,
    UtilsController,
    LicenseController,
    ModuleDownloadController,
  ],
  providers: [
    PrismaService,
    ConfigService,
    // Module download pipeline — handles on-premises ZIP extraction and SaaS activation
    ModuleDownloadService,
  ],
})
export class PlatformModule {}
