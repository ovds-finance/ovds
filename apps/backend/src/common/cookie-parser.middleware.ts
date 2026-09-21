import { Injectable, NestMiddleware } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CookieParserMiddleware implements NestMiddleware {
  private readonly parser: ReturnType<typeof cookieParser>;

  constructor() {
    this.parser = cookieParser();
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.parser(req, res, next);
  }
}
