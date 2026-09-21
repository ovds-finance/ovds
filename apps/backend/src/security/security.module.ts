import { Module } from '@nestjs/common';

import { HoneypotGuard } from '../common/guards/honeypot.guard';
import { PrismaModule } from '../common/prisma.module';

import { DeviceControlController } from './device-control.controller';
import { HoneypotController } from './honeypot.controller';
import { InfrastructureController } from './infrastructure.controller';
import { IotController } from './iot.controller';
import { NodesController } from './nodes.controller';
import { SecurityPublicController } from './security-public.controller';
import { SecurityController } from './security.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    SecurityController,
    SecurityPublicController,
    DeviceControlController,
    IotController,
    NodesController,
    InfrastructureController,
    HoneypotController,
  ],
  providers: [HoneypotGuard],
})
export class SecurityModule {}
