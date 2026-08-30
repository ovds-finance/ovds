import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { InventoryController } from './inventory.controller';
import { ManufacturingController } from './manufacturing.controller';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ItemsController, InventoryController, ManufacturingController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
