import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * SanitizeInputMiddleware
 *
 * Applied globally before all route handlers.
 * Sanitizes:
 *  - Request body (JSON object tree)
 *  - Query string parameters
 *  - URL path (checked once; bad paths are rejected immediately)
 *
 * Patterns blocked
 * ────────────────
 *  • XSS                 — <script> tags and raw HTML tags
 *  • SQL injection        — UNION ALL, SELECT..FROM, DROP TABLE, DELETE FROM,
 *                           INSERT INTO, inline boolean injection (OR 1=1)
 *  • NoSQL injection      — MongoDB operators: $where, $gt/$lt/$ne/$in/$nin,
 *                           $or/$and/$nor, $regex, $expr
 *  • Path traversal       — ../ and ..\  sequences in body/query values
 *  • Null bytes           — \x00 (causes truncation in C-based stacks)
 *  • Template injection   — {{...}} and ${...} Jinja/Handlebars/JS template syntax
 *
 * Query parameter sanitization
 * ────────────────────────────
 * Query values are sanitized with the same rules as body fields.
 * Dangerous query key names (those beginning with $) are stripped.
 *
 * URL traversal rejection
 * ───────────────────────
 * If the raw URL contains a traversal sequence (../ or ..\) the request
 * is rejected immediately with 400 Bad Request before any handler fires.
 */
@Injectable()
export class SanitizeInputMiddleware implements NestMiddleware {

  // Patterns applied to every string value in body and query
  private static readonly VALUE_PATTERNS: Array<{ re: RegExp; replacement: string; label: string }> = [
    // XSS — script tags
    { re: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, replacement: '', label: 'xss-script' },
    // XSS — any HTML tag
    { re: /<[^>]+>/g, replacement: '', label: 'xss-html' },
    // SQL — inline boolean injection (OR 1=1, AND 1=1)
    { re: /\b(or|AND)\b\s+\d+\s*=\s*\d+/gi, replacement: '', label: 'sqli-bool' },
    // SQL — UNION ALL
    { re: /\bunion\s+all\b/gi, replacement: '', label: 'sqli-union' },
    // SQL — SELECT .. FROM
    { re: /\bselect\b\s+.*\bfrom\b/gi, replacement: '', label: 'sqli-select' },
    // SQL — DROP TABLE
    { re: /\bdrop\s+table\b/gi, replacement: '', label: 'sqli-drop' },
    // SQL — DELETE FROM
    { re: /\bdelete\s+from\b/gi, replacement: '', label: 'sqli-delete' },
    // SQL — INSERT INTO
    { re: /\binsert\s+into\b/gi, replacement: '', label: 'sqli-insert' },
    // SQL — UPDATE ... SET
    { re: /\bupdate\b\s+\w+\s+\bset\b/gi, replacement: '', label: 'sqli-update' },
    // SQL — stacked statements with semicolons
    { re: /;\s*(drop|delete|truncate|insert|update|create|alter)\b/gi, replacement: '', label: 'sqli-stacked' },
    // SQL — exec/execute (stored procedure calls)
    { re: /\b(exec|execute)\s*\(/gi, replacement: '', label: 'sqli-exec' },
    // NoSQL — MongoDB operator keys embedded in string values ($gt, $where, etc.)
    { re: /\$\s*(where|gt|gte|lt|lte|ne|in|nin|or|and|nor|regex|expr|text|geoWithin)\b/gi, replacement: '', label: 'nosql' },
    // Path traversal — forward slash variant
    { re: /\.\.\//g, replacement: '', label: 'traversal-fwd' },
    // Path traversal — backslash variant
    { re: /\.\.[\\/]/g, replacement: '', label: 'traversal-back' },
    // Null byte
    { re: /\0/g, replacement: '', label: 'null-byte' },
    // Template injection — Handlebars / Jinja {{ }}
    { re: /\{\{.*?\}\}/g, replacement: '', label: 'template-hbs' },
    // Template injection — JS template literal ${...}
    { re: /\$\{[^}]*\}/g, replacement: '', label: 'template-js' },
  ];

  use(req: Request, res: Response, next: NextFunction) {
    // ── 1. URL path traversal: reject immediately ────────────────────────────
    const rawUrl = req.url || '';
    if (/\.\.[\\/]/.test(rawUrl) || /%2e%2e/i.test(rawUrl)) {
      throw new BadRequestException('Invalid request path');
    }

    // ── 2. Body sanitization ─────────────────────────────────────────────────
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }

    // ── 3. Query string sanitization ─────────────────────────────────────────
    // NOTE: req.query is a getter-only property on Node's IncomingMessage —
    // assigning `req.query = ...` throws "Cannot set property query … which
    // has only a getter". Mutate the existing object in place instead.
    if (req.query && typeof req.query === 'object') {
      const sanitized = this.sanitizeQuery(req.query as Record<string, any>);
      for (const key of Object.keys(req.query)) {
        if (!(key in sanitized)) {
          // Key was stripped (e.g. $-prefixed NoSQL operator) — remove it
          delete (req.query as Record<string, any>)[key];
        } else {
          (req.query as Record<string, any>)[key] = sanitized[key];
        }
      }
    }

    next();
  }

  // ── Object tree walker ─────────────────────────────────────────────────────

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeValue(String(obj));
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      // Strip keys that begin with $ — these are MongoDB operator injections
      // (e.g. { "$where": "..." }). Legitimate field names never start with $.
      if (key.startsWith('$')) continue;

      const value = obj[key];
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeValue(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private sanitizeQuery(query: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(query)) {
      // Strip NoSQL operator keys from query string as well
      if (key.startsWith('$')) continue;

      const value = query[key];
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeValue(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((v) =>
          typeof v === 'string' ? this.sanitizeValue(v) : v,
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeQuery(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private sanitizeValue(input: string): string {
    let sanitized = input;
    for (const { re, replacement } of SanitizeInputMiddleware.VALUE_PATTERNS) {
      sanitized = sanitized.replace(re, replacement);
    }
    return sanitized.trim();
  }
}
