# 26 — File Storage and Document Management

## 1. Storage Architecture

The system uses object storage (S3-compatible) for all file operations. Local filesystem is used only for temporary processing.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   API       │────▶│   S3 /      │
│   Upload    │     │   Presign   │     │   MinIO     │
└─────────────┘     └─────────────┘     └─────────────┘
                            │
                            ▼
                   ┌─────────────┐
                   │   Virus     │
                   │   Scan      │
                   └─────────────┘
```

## 2. Storage Service

```typescript
// storage/storage.service.ts
@Injectable()
export class StorageService {
  constructor(private readonly s3: S3Client) {}

  async upload(path: string, buffer: Buffer, metadata?: any): Promise<string> {
    await this.s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: path,
      Body: buffer,
      ContentType: metadata?.contentType,
      ServerSideEncryption: 'AES256',
      Metadata: metadata?.custom || {},
    }));
    return path;
  }

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    return this.s3.getSignedUrl(
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: path }),
      { expiresIn },
    );
  }

  async download(path: string): Promise<Buffer> {
    const response = await this.s3.send(new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: path,
    }));
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async delete(path: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: path,
    }));
  }

  async list(prefix: string): Promise<S3Object[]> {
    const response = await this.s3.send(new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET,
      Prefix: prefix,
    }));
    return response.Contents || [];
  }
}
```

## 3. Document Model

```prisma
model Document {
  id              String   @id @default(cuid())
  organizationId  String
  name            String
  originalName    String
  mimeType        String
  size            Int      // bytes
  path            String   // S3 key
  hash            String   // SHA-256 for integrity
  status          String   @default("pending") // pending, scanned, approved, rejected
  uploadedBy      String
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  vatReturnId     String?
  vatReturn       VatReturn? @relation(fields: [vatReturnId], references: [id])

  @@index([organizationId, vatReturnId])
  @@index([createdAt])
}
```

## 4. Upload Flow

```typescript
// documents/documents.controller.ts
@Controller('documents')
export class DocumentsController {
  constructor(private readonly storageService: StorageService, private readonly virusScanner: VirusScanner) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @Permissions('documents.upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('vatReturnId') vatReturnId: string,
    @CurrentUser() user: User,
  ) {
    // 1. Validate file
    this.validateFile(file);

    // 2. Scan for viruses
    const scanResult = await this.virusScanner.scan(file.buffer);
    if (!scanResult.clean) {
      throw new BadRequestException('File contains malware');
    }

    // 3. Generate unique path
    const path = `documents/${user.organizationId}/${Date.now()}_${file.originalname}`;

    // 4. Upload to S3
    const filePath = await this.storageService.upload(path, file.buffer, {
      contentType: file.mimetype,
      custom: {
        uploadedBy: user.id,
        vatReturnId,
      },
    });

    // 5. Create document record
    const document = await this.prisma.document.create({
      data: {
        organizationId: user.organizationId,
        name: file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: filePath,
        hash: this.hashBuffer(file.buffer),
        uploadedBy: user.id,
        vatReturnId,
        status: 'scanned',
      },
    });

    return { data: document };
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @Permissions('documents.read')
  async download(@Param('id') id: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, organizationId: TenantContext.getOrganizationId() },
    });

    if (!document) throw new NotFoundException('Document not found');

    const signedUrl = await this.storageService.getSignedUrl(document.path, 3600);

    return {
      data: {
        url: signedUrl,
        name: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
      },
    };
  }
}
```

## 5. File Validation

```typescript
// documents/validators/file.validator.ts
export class FileValidator {
  private readonly allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  private readonly maxSize = 10 * 1024 * 1024; // 10 MB

  validate(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }

    if (file.size > this.maxSize) {
      throw new BadRequestException(`File size exceeds maximum of ${this.maxSize / 1024 / 1024}MB`);
    }
  }
}
```

## 6. Virus Scanning

```typescript
// documents/services/virus-scanner.service.ts
@Injectable()
export class VirusScanner {
  constructor(private readonly configService: ConfigService) {}

  async scan(buffer: Buffer): Promise<ScanResult> {
    // Integration with ClamAV or VirusTotal
    const definitions = await this.getDefinitions();
    const scan = this.scanBuffer(buffer, definitions);

    return {
      clean: !scan.infected,
      threats: scan.infected ? scan.viruses : [],
      scannedAt: new Date(),
    };
  }
}
```

## 7. Image Processing

```typescript
// documents/services/image-processor.service.ts
@Injectable()
export class ImageProcessorService {
  async generateThumbnail(buffer: Buffer, width = 200, height = 200): Promise<Buffer> {
    const sharp = require('sharp');
    return sharp(buffer)
      .resize(width, height, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  async getMetadata(buffer: Buffer): Promise<ImageMetadata> {
    const sharp = require('sharp');
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
    };
  }
}
```

## 8. Document Versioning

```typescript
// documents/services/versioning.service.ts
@Injectable()
export class DocumentVersioningService {
  async createVersion(documentId: string, userId: string, changes: any): Promise<DocumentVersion> {
    const document = await this.prisma.document.findUnique({ where: { id: documentId } });

    return this.prisma.documentVersion.create({
      data: {
        documentId,
        version: (await this.getNextVersion(documentId)),
        name: document.name,
        path: document.path,
        hash: document.hash,
        size: document.size,
        changes,
        createdBy: userId,
      },
    });
  }

  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    return this.prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { version: 'desc' },
    });
  }
}
```

## 9. Storage Quotas

```typescript
// organizations/services/storage-quota.service.ts
@Injectable()
export class StorageQuotaService {
  async getUsage(orgId: string): Promise<StorageUsage> {
    const totalSize = await this.prisma.document.aggregate({
      where: { organizationId: orgId },
      _sum: { size: true },
    });

    const plan = await this.getOrganizationPlan(orgId);

    return {
      used: totalSize._sum.size || 0,
      limit: plan.storageLimit || 10 * 1024 * 1024 * 1024, // 10 GB default
      percentage: ((totalSize._sum.size || 0) / (plan.storageLimit || 10 * 1024 * 1024 * 1024)) * 100,
    };
  }

  async checkQuota(orgId: string, fileSize: number): Promise<void> {
    const usage = await this.getUsage(orgId);
    if (usage.used + fileSize > usage.limit) {
      throw new QuotaExceededException(`Storage quota exceeded. Used: ${usage.used}, Limit: ${usage.limit}`);
    }
  }
}
```

## 10. CDN Integration

```typescript
// storage/cdn.service.ts
@Injectable()
export class CdnService {
  private readonly cdnBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.cdnBaseUrl = this.configService.get('CDN_BASE_URL');
  }

  getCdnUrl(path: string): string {
    return `${this.cdnBaseUrl}/${path}`;
  }

  async invalidateCache(paths: string[]): Promise<void> {
    // Invalidate CDN cache for updated files
    await this.cdnClient.createInvalidation({
      DistributionId: this.configService.get('CDN_DISTRIBUTION_ID'),
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: { Items: paths, Quantity: paths.length },
      },
    });
  }
}
```
