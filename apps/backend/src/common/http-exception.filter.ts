import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode: string | undefined;
    const extra: Record<string, unknown> = {};

    if (exception instanceof BadRequestException) {
      status = HttpStatus.BAD_REQUEST;
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else {
        message = (res as any)?.message ?? 'The request payload failed validation.';
        if ((res as any)?.errors) extra.errors = (res as any).errors;
      }
      errorCode = 'VALIDATION_ERROR';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else {
        message = (res as any)?.message ?? message;
        errorCode = (res as any)?.errorCode;
        if ((res as any)?.errorType) extra.errorType = (res as any).errorType;
        if ((res as any)?.details) extra.details = (res as any).details;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      const ext = exception as any;
      if (typeof ext.statusCode === 'number') {
        status = ext.statusCode;
        if (ext.errorType) extra.errorType = ext.errorType;
        if (ext.details) extra.details = ext.details;
      }
    }

    const responseBody: any = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      errorCode: errorCode || (status === 400 ? 'BAD_REQUEST' : status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : status === 422 ? 'UNPROCESSABLE_ENTITY' : status === 429 ? 'RATE_LIMITED' : status === 500 ? 'INTERNAL_ERROR' : 'UNKNOWN_ERROR'),
      ...extra,
    };

    if (status === HttpStatus.INTERNAL_SERVER_ERROR && exception instanceof Error) {
      if (process.env.NODE_ENV === 'production') {
        responseBody.error = 'Internal server error';
      } else {
        responseBody.error = exception.message;
        responseBody.stack = exception.stack;
      }
    }

    response.status(status).json(responseBody);
  }
}
