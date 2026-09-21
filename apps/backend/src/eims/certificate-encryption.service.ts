import * as crypto from 'crypto';

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CertificateEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly saltLength = 16;

  constructor(private readonly config: ConfigService) {}

  private getKey(): Buffer {
    const raw = this.config.get<string>('EIMS_CERTIFICATE_ENCRYPTION_KEY') || '';
    if (!raw) {
      throw new Error('EIMS_CERTIFICATE_ENCRYPTION_KEY environment variable is required for certificate private key encryption');
    }
    const key = Buffer.from(raw, 'utf8');
    if (key.length < this.keyLength) {
      throw new Error('EIMS_CERTIFICATE_ENCRYPTION_KEY must be at least 32 characters');
    }
    return key.slice(0, this.keyLength);
  }

  encrypt(plaintext: string): string {
    const key = this.getKey();
    const iv = crypto.randomBytes(this.ivLength);
    const salt = crypto.randomBytes(this.saltLength);
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100_000, this.keyLength, 'sha256');
    const cipher = crypto.createCipheriv(this.algorithm, derivedKey, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    const key = this.getKey();
    const parts = ciphertext.split(':');
    if (parts.length !== 4) {
      throw new InternalServerErrorException('Invalid encrypted private key format');
    }
    const [saltHex, ivHex, tagHex, encrypted] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100_000, this.keyLength, 'sha256');
    const decipher = crypto.createDecipheriv(this.algorithm, derivedKey, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
