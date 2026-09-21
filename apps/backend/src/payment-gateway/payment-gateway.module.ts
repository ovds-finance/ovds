import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { TelebirrCryptoService, TelebirrConfigService } from './telebirr-crypto.service';
import { TelebirrController } from './telebirr.controller';
import { TelebirrService } from './telebirr.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [TelebirrController],
  providers: [
    TelebirrService,
    TelebirrCryptoService,
    TelebirrConfigService,
  ],
  exports: [
    TelebirrService,
    TelebirrCryptoService,
    TelebirrConfigService,
  ],
})
export class TelebirrModule {}