/**
 * @ovds/contracts/filters/http-exception — global NestJS exception filter
 *
 * Formats all HTTP exceptions into the standard ApiResponse envelope defined
 * in @ovds/dto and used across the platform. This guarantees that error
 * responses are predictable for the frontend regardless of where they originate.
 *
 * Envelope shape:
 *   {
 *     success: false,
 *     statusCode: 400|404|500...,
 *     message: "Validation failed: 2 error(s)",
 *     fields: { "email": "Invalid email", "password": "Too short" },
 *     error: "Bad Request",
 *     requestId: "abc-123",
 *     timestamp: "2026-09-06T04:00:00.000Z",
 *     ms: "12"
 *   }
 *
 * Usage (in main.ts):
 *   import { HttpExceptionFilter } from '@ovds/contracts';
 *   app.useGlobalFilters(new HttpExceptionFilter());
 */

import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { ZodError } from 'zod';
import { serializeApiResponse, zodErrorsToMap } from '@ovds/dto';

export interface HttpExceptionFilterOptions {
  /**
   * If true (default), ZodValidationPipe errors are normalized into the same
   * field-level error map as class-validator errors.
   */
  normalizeZodErrors?: boolean;
  /**
   * Optional request ID extractor. Defaults to reading x-request-id header
   * or generating a random v4 UUID.
   */
  requestIdExtractor?: (host: ArgumentsHost) => string | undefined;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly options: HttpExceptionFilterOptions = {}) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const requestId =
      this.options.requestIdExtractor?.(host) ??
      request.headers['x-request-id'] ??
      request.id ??
      crypto.randomUUID();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let fields: Record<string, string> | undefined;
    let error: string | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exMessage = exception.getResponse();

      if (typeof exMessage === 'string') {
        message = exMessage;
      } else if (typeof exMessage === 'object' && exMessage !== null) {
        const obj = exMessage as Record<string, any>;
        message = obj.message ?? exception.message;
        fields = obj.fields;
        error = obj.error;
      } else {
        message = exception.message;
      }

      error = error ?? exception.name;
    } else if (exception instanceof ZodError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = `Validation failed: ${exception.issues.length} error(s)`;
      fields = this.options.normalizeZodErrors !== false ? zodErrorsToMap(exception) : undefined;
      error = 'ZodValidationError';
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    const start = request['startTime'] as number | undefined;
    const ms = start ? `${Date.now() - start}ms` : undefined;

    const envelope = serializeApiResponse({
      success: false,
      statusCode,
      message,
      data: undefined,
      error,
      fields,
      requestId,
      ms,
    });

    response.status(statusCode).json(envelope);
  }
}
