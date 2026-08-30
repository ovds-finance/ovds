import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { DeviceControlController } from './device-control.controller';
import { IotController } from './iot.controller';
import { NodesController } from './nodes.controller';
import { InfrastructureController } from './infrastructure.controller';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SecurityController, DeviceControlController, IotController, NodesController, InfrastructureController],
})
export class SecurityModule {}
