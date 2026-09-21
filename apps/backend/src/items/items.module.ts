import { Module } from '@nestjs/common';

import { PrismaModule } from '../common/prisma.module';

import { InventoryController } from './inventory.controller';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { ManufacturingController } from './manufacturing.controller';


@Module({
  imports: [PrismaModule],
  controllers: [ItemsController, InventoryController, ManufacturingController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
