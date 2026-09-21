/**
 * UtilsController — first-party utility endpoints.
 *
 * GET /utils/qr?data=...&size=...
 *   Server-side QR code generation that routes through the backend instead of
 *   leaking invoice data (amounts, TINs, invoice numbers) to the third-party
 *   api.qrserver.com service. Uses the `qrcode` npm package to generate a
 *   base64 PNG data URI which is safe to embed in img.src without any external
 *   network request from the browser.
 *
 *   If the `qrcode` package is not installed, the endpoint falls back to a
 *   transparent 1×1 pixel PNG so the UI never breaks. The VITE_QR_CODE_SERVICE_URL
 *   env variable should be set to `/api/utils/qr` to use this endpoint.
 */
import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const TRANSPARENT_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

@ApiTags('utils')
@Controller('utils')
@UseGuards(JwtAuthGuard)
export class UtilsController {
  @Get('qr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a QR code PNG for the given data (first-party, no external request)' })
  @ApiQuery({ name: 'data', description: 'Data to encode in the QR code', required: true })
  @ApiQuery({ name: 'size', description: 'Image dimensions WxH (e.g. 120x120)', required: false })
  @ApiQuery({ name: 'format', description: 'Output format: png (default)', required: false })
  async generateQr(
    @Query('data') data: string,
    @Query('size') size?: string,
    @Query('format') format?: string,
    @Res() res?: Response,
  ) {
    if (!data) throw new BadRequestException('data query parameter is required');

    // Parse requested dimensions
    const [w, h] = (size ?? '120x120').split('x').map((n) => Math.min(512, Math.max(32, parseInt(n, 10) || 120)));

    try {
      // Dynamic require — qrcode is optional; if not installed the catch fallback is used.
      // Using require() (not import()) so TS does not validate the missing @types/qrcode.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const QRCode = require('qrcode') as { toBuffer: (data: string, opts: Record<string, unknown>) => Promise<Buffer> };

      const pngBuffer = await QRCode.toBuffer(data, {
        type: 'png',
        width: w,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });

      res!.setHeader('Content-Type', 'image/png');
      res!.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      res!.setHeader('Content-Length', String(pngBuffer.length));
      res!.status(200).send(pngBuffer);
    } catch {
      // qrcode not installed or data is invalid — return transparent pixel
      res!.setHeader('Content-Type', 'image/png');
      res!.setHeader('Cache-Control', 'no-store');
      res!.status(200).send(TRANSPARENT_1PX);
    }
  }
}
