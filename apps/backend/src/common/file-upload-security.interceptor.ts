import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class FileUploadSecurityInterceptor implements NestInterceptor {
  private readonly allowedTypes: string[];
  private readonly maxSize: number;

  constructor(private configService?: ConfigService) {
    this.maxSize = this.configService?.get<number>('UPLOAD_MAX_SIZE', 10485760) ?? 10485760;
    const types = this.configService?.get<string>('UPLOAD_ALLOWED_TYPES', 'image/jpeg,image/png,application/pdf') ?? 'image/jpeg,image/png,application/pdf';
    this.allowedTypes = types.split(',').map(t => t.trim()).filter(Boolean);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.file || request.files) {
      this.validateFiles(request.file || request.files);
    }

    return next.handle().pipe(
      map(() => {
        const response = context.switchToHttp().getResponse();
        return response;
      }),
    );
  }

  private validateFiles(files: any): void {
    const fileArray = Array.isArray(files) ? files : [files];

    for (const file of fileArray) {
      if (!file) continue;

      if (file.size > this.maxSize) {
        throw new BadRequestException(
          `File size exceeds maximum allowed size of ${this.maxSize / 1024 / 1024}MB`,
        );
      }

      const fileType = file.mimetype || file.type;
      if (!this.allowedTypes.includes(fileType)) {
        throw new BadRequestException(
          `File type ${fileType} is not allowed. Allowed types: ${this.allowedTypes.join(', ')}`,
        );
      }

      if (file.originalname) {
        const suspiciousPatterns = /\.(exe|bat|cmd|sh|ps1|js|php|asp|aspx|jsp|py|rb|pl)$/i;
        if (suspiciousPatterns.test(file.originalname)) {
          throw new BadRequestException('File name contains suspicious extension');
        }
      }
    }
  }
}
