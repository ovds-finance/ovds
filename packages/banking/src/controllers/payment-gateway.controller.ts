import { Controller, Post, Body, Headers, BadRequestException, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { DeclarationStatus } from '@ovds/database';
import * as crypto from 'crypto';

import { PRISMA_CLIENT, type PrismaServiceLike } from '@ovds/ledger';

interface TelebirrCallbackDto {
  msisdn: string;
  totalAmount: string;
  transactionNo: string;
  outTradeNo: string; // Maps directly to our declarationId string
  updatedTime: string;
}

@Controller('api/v1/payment-callbacks')
export class PaymentGatewayController {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaServiceLike) {}

  @Post('telebirr-webhook')
  @HttpCode(HttpStatus.OK)
  async handleTelebirrHook(
    @Body() payload: TelebirrCallbackDto,
    @Headers('X-Telebirr-Signature') signature: string
  ) {
    const isVerified = this.verifyTelebirrSignature(payload, signature);
    if (!isVerified) {
      throw new BadRequestException('Cryptographic Webhook Validation Handshake Failed');
    }

    return this.prisma.$transaction(async (tx: any) => {
      const declaration = await tx.vatDeclaration.findUnique({
        where: { id: payload.outTradeNo },
      });

      if (!declaration) {
        throw new BadRequestException('Target VAT declaration asset reference not found');
      }

      return tx.vatDeclaration.update({
        where: { id: payload.outTradeNo },
        data: {
          status: DeclarationStatus.CLEARED,
          paymentReference: payload.transactionNo,
        },
      });
    });
  }

  private verifyTelebirrSignature(payload: TelebirrCallbackDto, signature: string): boolean {
    if (!signature) return false;
    const publicKey = process.env.TELEBIRR_PUBLIC_KEY || 'mock-public-key';
    const verifier = crypto.createVerify('SHA256');
    verifier.update(JSON.stringify(payload));
    try {
      return verifier.verify(publicKey, signature, 'base64');
    } catch {
      return false;
    }
  }
}