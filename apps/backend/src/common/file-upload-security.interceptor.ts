import * as path from 'path';

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

/**
 * FileUploadSecurityInterceptor
 *
 * Applied per-route on any endpoint that accepts file uploads.
 * Enforces:
 *
 *  1. File size cap           — default 10 MB, configurable via UPLOAD_MAX_SIZE
 *  2. MIME type allowlist     — default jpeg/png/pdf, configurable via UPLOAD_ALLOWED_TYPES
 *  3. Extension allowlist     — derived from allowed MIME types; cross-validated against MIME
 *  4. Filename sanitization   — strip directory traversal, enforce safe characters and max length
 *  5. Path traversal guard    — reject any filename with path separators or .. sequences
 *
 * Extension → MIME mapping (allowlist, not blocklist):
 *   image/jpeg  → .jpg .jpeg
 *   image/png   → .png
 *   image/gif   → .gif
 *   image/webp  → .webp
 *   application/pdf → .pdf
 *   text/csv    → .csv
 *   application/vnd.ms-excel → .xls
 *   application/vnd.openxmlformats-officedocument.spreadsheetml.sheet → .xlsx
 */

const MIME_TO_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg':                   ['.jpg', '.jpeg'],
  'image/png':                    ['.png'],
  'image/gif':                    ['.gif'],
  'image/webp':                   ['.webp'],
  'application/pdf':              ['.pdf'],
  'text/csv':                     ['.csv'],
  'application/vnd.ms-excel':     ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

/** Sanitize a filename: strip directory components, enforce safe characters, cap length. */
export function sanitizeFilename(original: string): string {
  // 1. Take only the base name — strips any directory path
  let name = path.basename(original);

  // 2. Reject if the result is empty or still contains a path separator
  if (!name || name.includes('/') || name.includes('\\')) {
    throw new BadRequestException('Invalid file name');
  }

  // 3. Reject null bytes
  if (name.includes('\0')) {
    throw new BadRequestException('Invalid file name');
  }

  // 4. Replace any non-alphanumeric, non-dot, non-hyphen, non-underscore chars
  name = name.replace(/[^a-zA-Z0-9.\-_]/g, '_');

  // 5. Collapse sequences of dots (prevent disguised extensions like foo..php)
  name = name.replace(/\.{2,}/g, '.');

  // 6. Enforce max length
  if (name.length > 255) {
    const ext = path.extname(name);
    name = name.slice(0, 255 - ext.length) + ext;
  }

  // 7. Prevent filenames that are only dots/special chars
  if (/^[._\-]+$/.test(name)) {
    throw new BadRequestException('Invalid file name');
  }

  return name;
}

@Injectable()
export class FileUploadSecurityInterceptor implements NestInterceptor {
  private readonly allowedMimes: string[];
  private readonly allowedExtensions: Set<string>;
  private readonly maxSize: number;

  constructor(private configService?: ConfigService) {
    this.maxSize =
      this.configService?.get<number>('UPLOAD_MAX_SIZE', 10485760) ?? 10485760;

    const mimeConfig =
      this.configService?.get<string>(
        'UPLOAD_ALLOWED_TYPES',
        'image/jpeg,image/png,application/pdf',
      ) ?? 'image/jpeg,image/png,application/pdf';

    this.allowedMimes = mimeConfig
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Build extension allowlist from the MIME allowlist
    this.allowedExtensions = new Set(
      this.allowedMimes.flatMap((m) => MIME_TO_EXTENSIONS[m] ?? []),
    );
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.file || request.files) {
      this.validateFiles(request.file ?? request.files);
    }

    // Pass through to the handler — do NOT map the return value here,
    // the handler is responsible for building the response body.
    return next.handle();
  }

  private validateFiles(files: unknown): void {
    const fileArray = Array.isArray(files) ? files : [files as object];

    for (const file of fileArray) {
      if (!file) continue;
      const f = file as Record<string, any>;

      // ── 1. Size check ────────────────────────────────────────────────────
      if (typeof f['size'] === 'number' && f['size'] > this.maxSize) {
        throw new BadRequestException(
          `File size exceeds the maximum allowed size of ${this.maxSize / 1024 / 1024} MB`,
        );
      }

      // ── 2. MIME type allowlist ────────────────────────────────────────────
      const mime: string = (f['mimetype'] ?? f['type'] ?? '').toLowerCase();
      if (mime && !this.allowedMimes.includes(mime)) {
        throw new BadRequestException(
          `File type "${mime}" is not allowed. Allowed: ${this.allowedMimes.join(', ')}`,
        );
      }

      // ── 3. Filename sanitization + extension allowlist ────────────────────
      if (f['originalname']) {
        // Sanitize — throws BadRequestException on invalid name
        const safe = sanitizeFilename(f['originalname'] as string);

        // Replace the stored original name with the sanitized version
        f['originalname'] = safe;

        // Extension allowlist cross-check (only when we have a known MIME mapping)
        if (this.allowedExtensions.size > 0) {
          const ext = path.extname(safe).toLowerCase();
          if (ext && !this.allowedExtensions.has(ext)) {
            throw new BadRequestException(
              `File extension "${ext}" is not permitted for MIME type "${mime}"`,
            );
          }
        }

        // ── 4. Cross-validate extension ↔ MIME ──────────────────────────────
        // Reject mismatches like a .jpg file claiming to be application/x-php
        if (mime && this.allowedMimes.includes(mime)) {
          const ext = path.extname(safe).toLowerCase();
          const permittedExtensions = MIME_TO_EXTENSIONS[mime];
          if (permittedExtensions && ext && !permittedExtensions.includes(ext)) {
            throw new BadRequestException(
              `File extension "${ext}" does not match declared MIME type "${mime}"`,
            );
          }
        }
      }
    }
  }
}
