import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { decryptLicense, verifyLicenseSignature, LicensePayload, EncryptedLicense } from '../crypto/license-crypto';
import { PrismaClient } from '@ovds/database';

declare global {
  namespace Express {
    interface Request {
      license?: LicensePayload;
      tenantId?: string;
    }
  }
}

@Injectable()
export class AirGappedLicenseGuard implements CanActivate {
  private prisma: PrismaClient;
  private publicKey: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.publicKey = process.env.LICENSE_PUBLIC_KEY || '';
    if (!this.publicKey) {
      throw new Error('LICENSE_PUBLIC_KEY environment variable is required');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const licenseHeader = request.headers['x-enterprise-license'] as string;

    if (!licenseHeader) {
      throw new UnauthorizedException('Missing x-enterprise-license header');
    }

    try {
      const encrypted: EncryptedLicense = JSON.parse(licenseHeader);
      const passphrase = process.env.LICENSE_PASSPHRASE || '';
      if (!passphrase) {
        throw new Error('LICENSE_PASSPHRASE environment variable is required');
      }

      const payload = await decryptLicense(encrypted, passphrase);

      if (!verifyLicenseSignature(payload, this.publicKey)) {
        throw new ForbiddenException('Invalid license signature');
      }

      const now = Date.now();
      if (payload.issuedAt > now) {
        throw new ForbiddenException('License not yet valid');
      }
      if (payload.expiresAt < now) {
        throw new ForbiddenException('License expired');
      }

      const tenant = await (this.prisma as any).tenant.findUnique({
        where: { id: payload.tenantId },
        select: { id: true, status: true, licenseExpiresAt: true },
      });

      if (!tenant) {
        throw new ForbiddenException('Tenant not found');
      }

      if (tenant.status !== 'ACTIVE') {
        throw new ForbiddenException('Tenant account is not active');
      }

      if (tenant.licenseExpiresAt && new Date(tenant.licenseExpiresAt).getTime() < now) {
        throw new ForbiddenException('Tenant license expired');
      }

      request.license = payload;
      request.tenantId = payload.tenantId;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Invalid license format');
    }
  }
}

export const LICENSE_PAYLOAD_KEY = 'license';
export const LICENSE_TENANT_ID_KEY = 'tenantId';