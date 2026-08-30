import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';
import { OrpcModule } from '../orpc/orpc.module';

@Module({
  imports: [CommonModule, AuthModule, SettingsModule, OrpcModule],
  exports: [CommonModule, AuthModule, SettingsModule, OrpcModule],
})
export class CoreModule {}
