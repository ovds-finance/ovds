import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SanitizeInputMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }
    next();
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeString(String(obj));
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private sanitizeString(input: string): string {
    let sanitized = input;

    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/<[^>]+>/g, '');
    sanitized = sanitized.replace(/\b(or|AND)\b\s+\d+\s*=\s*\d+/gi, '');
    sanitized = sanitized.replace(/\bunion\s+all\b/gi, '');
    sanitized = sanitized.replace(/\bselect\b\s+.*\bfrom\b/gi, '');
    sanitized = sanitized.replace(/\bdrop\s+table\b/gi, '');
    sanitized = sanitized.replace(/\bdelete\s+from\b/gi, '');
    sanitized = sanitized.replace(/\binsert\s+into\b/gi, '');
    sanitized = sanitized.replace(/\.\.\//g, '');
    sanitized = sanitized.replace(/\.\.\\\\/g, '');
    sanitized = sanitized.replace(/\0/g, '');

    return sanitized.trim();
  }
}
