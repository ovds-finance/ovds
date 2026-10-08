import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';

@Injectable()
export class KmsPreflightValidator {
  private kmsClient = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });

  async validateKeyAvailability(keyArn: string): Promise<{ available: boolean; keyState: string; description: string }> {
    if (!keyArn) {
      throw new InternalServerErrorException('KMS Key ARN is required for preflight validation.');
    }
    try {
      const response = await this.kmsClient.send(new DescribeKeyCommand({ KeyId: keyArn }));
      const keyMetadata = response.KeyMetadata;
      if (!keyMetadata) {
        throw new InternalServerErrorException('KMS key metadata not found.');
      }
      return {
        available: keyMetadata.KeyState === 'Enabled',
        keyState: keyMetadata.KeyState ?? 'Unknown',
        description: keyMetadata.Description ?? '',
      };
    } catch (error: unknown) {
      throw new InternalServerErrorException(`KMS key preflight validation failed: ${(error as Error).message}`);
    }
  }

  async validateEncryptionContext(tenantId: string): Promise<boolean> {
    if (!tenantId) {
      throw new InternalServerErrorException('Tenant ID is required for encryption context validation.');
    }
    return true;
  }
}