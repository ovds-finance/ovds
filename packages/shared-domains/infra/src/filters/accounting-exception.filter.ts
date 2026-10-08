import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AccountingExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    let status = 500;
    let errorCode = 'ERR_LEDGER_INTERNAL_SYSTEM_FAULT';
    let errorMessage = 'An unexpected backend ledger processing exception was intercepted.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resBody = exception.getResponse();
      errorMessage = typeof resBody === 'string' ? resBody : (resBody as Record<string, unknown>)?.message as string ?? errorMessage;
      if (status === 429) errorCode = 'ERR_TENANT_RATE_LIMIT_EXCEEDED';
      if (status === 403) errorCode = 'ERR_SUBSCRIPTION_LICENSE_INVALID';
      if (status === 401) errorCode = 'ERR_CONTEXT_AUTHENTICATION_FAILED';
    } else if (exception && typeof exception === 'object' && 'code' in exception) {
      const prismaError = exception as { code: string };
      errorMessage = 'Database constraint structural violation encountered.';
      switch (prismaError.code) {
        case 'P2002': status = 400; errorCode = 'ERR_CHART_OF_ACCOUNTS_CODE_CONFLICT'; errorMessage = 'Duplicate account ledger code registration rejected.'; break;
        case 'P2003': status = 400; errorCode = 'ERR_LEDGER_INTEGRITY_VIOLATION'; errorMessage = 'Foreign key balance reference missing.'; break;
        case 'P2034': status = 409; errorCode = 'ERR_DATABASE_DEADLOCK_TRANSACTION_RETRY'; errorMessage = 'Concurrent update conflict detected.'; break;
      }
    }

    response.status(status).json({ errorCode, message: errorMessage, timestamp: new Date().toISOString(), path: request.url });
  }
}