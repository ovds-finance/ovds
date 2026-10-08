import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class S3ArchiveUploaderEngine {
  private s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID || '', secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '' },
  });
  private readonly localArchiveRoot = '/mnt/cold-storage/archives';
  private readonly s3BucketName = process.env.AWS_S3_ARCHIVE_BUCKET_NAME || 'ovds-ledger-cold-storage';

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async uploadPurgedArchivesToS3() {
    console.log('🚀 Synchronizing local historical ledger files with AWS S3 cold vault...');
    try {
      const tenantFolders = await fs.readdir(this.localArchiveRoot);
      for (const tenantId of tenantFolders) {
        const tenantDirPath = path.join(this.localArchiveRoot, tenantId);
        const files = await fs.readdir(tenantDirPath);
        for (const file of files) {
          const localFilePath = path.join(tenantDirPath, file);
          const fileStream = await fs.readFile(localFilePath);
          const s3KeyPath = `tenant-archives/${tenantId}/${file}`;
          console.log(`📤 Uploading archive item [${file}] for Tenant Context: [${tenantId}]`);
          await this.s3Client.send(new PutObjectCommand({
            Bucket: this.s3BucketName, Key: s3KeyPath, Body: fileStream, ContentType: 'application/json', ServerSideEncryption: 'aws:kms',
          }));
          await fs.unlink(localFilePath);
          console.log(`🗑️ Reclaimed storage space. Removed local file copy: ${file}`);
        }
      }
    } catch (s3Fault: unknown) { console.error('❌ Cloud backup synchronization task encountered an error:', (s3Fault as Error).message); }
  }
}
