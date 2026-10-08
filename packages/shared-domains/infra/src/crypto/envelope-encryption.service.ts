import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { KMSClient, GenerateDataKeyCommand, DecryptCommand } from '@aws-sdk/client-kms';
import * as crypto from 'crypto';

@Injectable()
export class EnvelopeEncryptionService {
  private kmsClient = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });
  private readonly kmsKeyArn = process.env.AWS_KMS_MASTER_KEY_ARN;
  private readonly algorithm = 'aes-256-gcm';

  async encryptField(plaintext: string, tenantId: string): Promise<{ ciphertext: string; encryptedKey: string; iv: string; tag: string }> {
    if (!this.kmsKeyArn) { throw new InternalServerErrorException('KMS Target Arn configuration profile is unassigned.'); }
    const kmsResponse = await this.kmsClient.send(new GenerateDataKeyCommand({ KeyId: this.kmsKeyArn, KeySpec: 'AES_256', EncryptionContext: { tenantId } }));
    const rawDeKey = kmsResponse.Plaintext;
    const encryptedKey = Buffer.from(kmsResponse.CiphertextBlob!).toString('hex');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, rawDeKey!, iv);
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return { ciphertext, encryptedKey, iv: iv.toString('hex'), tag };
  }

  async decryptField(ciphertext: string, encryptedKey: string, ivHex: string, tagHex: string, tenantId: string): Promise<string> {
    const kmsResponse = await this.kmsClient.send(new DecryptCommand({ CiphertextBlob: Buffer.from(encryptedKey, 'hex'), EncryptionContext: { tenantId } }));
    const rawDeKey = kmsResponse.Plaintext;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, rawDeKey!, iv);
    decipher.setAuthTag(tag);
    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');
    return plaintext;
  }
}
