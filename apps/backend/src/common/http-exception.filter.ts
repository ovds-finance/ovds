/**
 * HttpExceptionFilter — global exception handler.
 *
 * Maps every thrown exception (NestJS HttpException or raw Error) to a
 * standardised JSON envelope:
 *
 * {
 *   statusCode : number        — HTTP status code
 *   errorCode  : string        — machine-readable error token
 *   message    : string        — human-readable description
 *   timestamp  : string        — ISO-8601
 *   path       : string        — request URL
 *   errors?    : unknown       — validation detail array (400/422 only)
 *   errorType? : string        — optional sub-type from the thrower
 *   details?   : unknown       — optional structured detail from the thrower
 *   error?     : string        — raw message exposed only in development
 *   stack?     : string        — stack trace exposed only in development
 * }
 *
 * Error-code map covers the full RESTful status spectrum used by OVDS:
 *   400 BAD_REQUEST            — malformed input / validation failure
 *   401 UNAUTHORIZED           — missing or invalid authentication
 *   402 PAYMENT_REQUIRED       — subscription/licence gate
 *   403 FORBIDDEN              — authenticated but not authorised
 *   404 NOT_FOUND              — resource does not exist
 *   405 METHOD_NOT_ALLOWED     — HTTP verb not supported on this resource
 *   406 NOT_ACCEPTABLE         — requested format not supported
 *   407 PROXY_AUTH_REQUIRED    — proxy authentication required
 *   408 REQUEST_TIMEOUT        — upstream/proxy timeout
 *   409 CONFLICT               — duplicate record or state conflict
 *   410 GONE                   — resource permanently removed
 *   411 LENGTH_REQUIRED        — Content-Length header required
 *   412 PRECONDITION_FAILED    — precondition failed (resource modified)
 *   413 PAYLOAD_TOO_LARGE      — upload/body size exceeded
 *   414 URI_TOO_LONG           — request URI too long
 *   415 UNSUPPORTED_MEDIA_TYPE — wrong Content-Type
 *   416 RANGE_NOT_SATISFIABLE  — range not satisfiable
 *   417 EXPECTATION_FAILED     — expectation failed
 *   421 MISDIRECTED_REQUEST    — request sent to wrong server
 *   422 UNPROCESSABLE_ENTITY   — semantically invalid (passes schema, fails rules)
 *   423 LOCKED                 — resource is locked
 *   424 FAILED_DEPENDENCY      — dependency failed
 *   428 PRECONDITION_REQUIRED  — If-Match/If-None-Match header required
 *   429 RATE_LIMITED           — throttle limit reached
 *   431 HEADER_FIELDS_TOO_LARGE — request header fields too large
 *   451 UNAVAILABLE_LEGAL      — unavailable for legal reasons
 *   500 INTERNAL_ERROR         — unhandled server exception
 *   501 NOT_IMPLEMENTED        — endpoint declared but not yet built
 *   502 BAD_GATEWAY            — upstream returned invalid response
 *   503 SERVICE_UNAVAILABLE    — dependency unreachable / maintenance
 *   504 GATEWAY_TIMEOUT        — upstream did not respond in time
 *   505 HTTP_VERSION_NOT_SUPPORTED — HTTP version not supported
 *   507 INSUFFICIENT_STORAGE   — insufficient storage
 *   508 LOOP_DETECTED          — loop detected
 *   510 NOT_EXTENDED           — further extensions required
 *   511 NETWORK_AUTH_REQUIRED  — network authentication required
 * }
 */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';

// ── Error-code lookup table ───────────────────────────────────────────────────

const ERROR_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  402: 'PAYMENT_REQUIRED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  406: 'NOT_ACCEPTABLE',
  407: 'PROXY_AUTHENTICATION_REQUIRED',
  408: 'REQUEST_TIMEOUT',
  409: 'CONFLICT',
  410: 'GONE',
  411: 'LENGTH_REQUIRED',
  412: 'PRECONDITION_FAILED',
  413: 'PAYLOAD_TOO_LARGE',
  414: 'URI_TOO_LONG',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  416: 'RANGE_NOT_SATISFIABLE',
  417: 'EXPECTATION_FAILED',
  421: 'MISDIRECTED_REQUEST',
  422: 'UNPROCESSABLE_ENTITY',
  423: 'LOCKED',
  424: 'FAILED_DEPENDENCY',
  428: 'PRECONDITION_REQUIRED',
  429: 'RATE_LIMITED',
  431: 'REQUEST_HEADER_FIELDS_TOO_LARGE',
  451: 'UNAVAILABLE_FOR_LEGAL_REASONS',
  500: 'INTERNAL_ERROR',
  501: 'NOT_IMPLEMENTED',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT',
  505: 'HTTP_VERSION_NOT_SUPPORTED',
  507: 'INSUFFICIENT_STORAGE',
  508: 'LOOP_DETECTED',
  510: 'NOT_EXTENDED',
  511: 'NETWORK_AUTHENTICATION_REQUIRED',
};

// ── Filter ────────────────────────────────────────────────────────────────────

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();
    const request = ctx.getRequest<any>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode: string | undefined;
    const extra: Record<string, unknown> = {};

    // ── NestJS HttpException hierarchy ──────────────────────────────────────
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, any>;
        // NestJS ValidationPipe nests errors under `message` as an array;
        // also support the Zod ValidationPipe which may use `errors`.
        if (Array.isArray(body.message)) {
          // Flatten the array into a single readable sentence for the top-level
          // message, and also expose the raw array as `errors`.
          extra.errors = body.message;
          message = body.message[0] ?? 'Validation failed';
        } else {
          message = body.message ?? message;
        }
        if (body.errorCode) errorCode = body.errorCode;
        if (body.errors && !extra.errors) extra.errors = body.errors;
        if (body.errorType) extra.errorType = body.errorType;
        if (body.details) extra.details = body.details;
      }

      // ── Specialised subtypes for 400 — distinguish validation from generic
      if (exception instanceof BadRequestException && !errorCode) {
        errorCode = 'VALIDATION_ERROR';
      }
    }

    // ── Plain Error (Prisma client errors, JS runtime errors, etc.) ─────────
    else if (exception instanceof Error) {
      message = exception.message;
      const ext = exception as any;
      if (typeof ext.statusCode === 'number') {
        status = ext.statusCode;
        if (ext.errorType) extra.errorType = ext.errorType;
        if (ext.details) extra.details = ext.details;
      }

      // Prisma known-request errors
      if ((exception as any).code) {
        const prismaCode: string = (exception as any).code;
        // P2002 = Unique constraint violation
        if (prismaCode === 'P2002') {
          status = HttpStatus.CONFLICT;
          message = 'A record with this value already exists.';
          extra.prismaCode = prismaCode;
        }
        // P2025 = Record not found
        else if (prismaCode === 'P2025') {
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found.';
          extra.prismaCode = prismaCode;
        }
        // P2003 = Foreign key constraint failure
        else if (prismaCode === 'P2003') {
          status = HttpStatus.UNPROCESSABLE_ENTITY;
          message = 'Related record not found — check foreign key reference.';
          extra.prismaCode = prismaCode;
        }
      }
    }

    // ── Derive errorCode from status when not explicitly set ─────────────────
    if (!errorCode) {
      errorCode = ERROR_CODES[status] ?? 'UNKNOWN_ERROR';
    }

    // ── Build response envelope ───────────────────────────────────────────────
    const body: Record<string, unknown> = {
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request?.url ?? 'unknown',
      ...extra,
    };

    // Expose stack trace only in non-production (aids debugging, never leaks in prod)
    if (
      status === HttpStatus.INTERNAL_SERVER_ERROR &&
      exception instanceof Error &&
      process.env.NODE_ENV !== 'production'
    ) {
      body.error = exception.message;
      body.stack = exception.stack;
      // Always log 500s server-side so they are visible in the console
      this.logger.error(
        `[${request?.method ?? 'UNKNOWN'} ${request?.url ?? 'unknown'}] ${exception.message}`,
        exception.stack,
      );
    } else if (
      status === HttpStatus.INTERNAL_SERVER_ERROR &&
      process.env.NODE_ENV === 'production'
    ) {
      // Sanitise: never expose internal details in production
      body.message = 'An unexpected error occurred. Our team has been notified.';
      // Still log server-side so ops can see real errors
      this.logger.error(
        `[${request?.method ?? 'UNKNOWN'} ${request?.url ?? 'unknown'}] ${exception instanceof Error ? exception.message : String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json(body);
  }
}
