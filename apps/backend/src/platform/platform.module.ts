import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { NavController } from './nav.controller';
import { AdminMenuItemsController } from './admin-menu-items.controller';
import { AppstoreController } from './appstore.controller';
import { SystemModulesController } from './system-modules.controller';
import { ReleasesController } from './releases.controller';
import { OfflineController } from './offline.controller';
import { SyncController } from './sync.controller';
import { HelpdeskController } from './helpdesk.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    NavController,
    AdminMenuItemsController,
    AppstoreController,
    SystemModulesController,
    ReleasesController,
    OfflineController,
    SyncController,
    HelpdeskController,
  ],
})
export class PlatformModule {}
