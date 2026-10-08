import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class AirGappedLicenseGuard implements CanActivate {
  private readonly algorithm = 'aes-256-cbc';
  private readonly deploymentSecret = process.env.LICENSE_VERIFICATION_KEY || '';

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const licensePayload = request.headers['x-enterprise-license'];

    if (!licensePayload) {
      throw new UnauthorizedException('Enterprise license token missing.');
    }

    try {
      const isValid = this.verifyLicense(licensePayload);
      if (!isValid) {
        throw new UnauthorizedException('Invalid or expired enterprise license.');
      }
      return true;
    } catch (error) {
      throw new UnauthorizedException('License validation failed.');
    }
  }

  private verifyLicense(payload: string): boolean {
    const [ivHex, encryptedText] = payload.split(':');
    if (!ivHex || !encryptedText) return false;

    const iv = Buffer.from(ivHex, 'hex');
    const encryptedBytes = Buffer.from(encryptedText, 'hex');
    const key = crypto.scryptSync(this.deploymentSecret, 'salt', 32);

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    let decrypted = decipher.update(encryptedBytes);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const licenseMeta = JSON.parse(decrypted.toString());
    const isExpired = new Date() > new Date(licenseMeta.expiresAt);
    return licenseMeta.active && !isExpired;
  }
}