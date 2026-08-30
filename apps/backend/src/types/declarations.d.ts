declare module 'passport-local' {
  export interface StrategyOptions {
    usernameField?: string;
    passwordField?: string;
    passReqToCallback?: boolean;
    session?: boolean;
  }

  export class Strategy {
    constructor(options?: StrategyOptions);
  }
}

declare module 'cookie-parser' {
  import { RequestHandler } from 'express';

  function cookieParser(secret?: string | string[], options?: Record<string, unknown>): RequestHandler;
  const _default: typeof cookieParser;
  export default _default;
}

// Fallback declaration for nodemailer if @types/nodemailer is not installed.
// When @types/nodemailer IS installed this declaration is superseded by the
// full type definitions in node_modules/@types/nodemailer.
declare module 'nodemailer' {
  export interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: { user?: string; pass?: string };
    [key: string]: unknown;
  }
  export interface SendMailOptions {
    from?: string;
    to?: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject?: string;
    text?: string;
    html?: string;
    [key: string]: unknown;
  }
  export interface SentMessageInfo {
    messageId?: string;
    accepted?: string[];
    rejected?: string[];
    [key: string]: unknown;
  }
  export interface Transporter {
    sendMail(options: SendMailOptions): Promise<SentMessageInfo>;
    verify(): Promise<boolean>;
  }
  export function createTransport(options: TransportOptions): Transporter;
  export function createTransport(connectionUrl: string): Transporter;
}

// Fallback declarations for NestJS packages that must be installed separately.
// These are minimal stubs — once `npm install` succeeds they are replaced by
// the real type definitions in node_modules.
declare module '@nestjs/event-emitter' {
  import { DynamicModule } from '@nestjs/common';
  export function OnEvent(event: string, options?: Record<string, unknown>): MethodDecorator;
  export class EventEmitter2 {
    emit(event: string, ...values: unknown[]): boolean;
    on(event: string, listener: (...args: unknown[]) => void): this;
    removeListener(event: string, listener: (...args: unknown[]) => void): this;
  }
  export class EventEmitterModule {
    static forRoot(options?: Record<string, unknown>): DynamicModule;
  }
}

declare module '@nestjs/websockets' {
  export function WebSocketGateway(options?: Record<string, unknown>): ClassDecorator;
  export function WebSocketServer(): PropertyDecorator;
  export function SubscribeMessage(event: string): MethodDecorator;
  export interface OnGatewayInit { afterInit(server: unknown): void; }
  export interface OnGatewayConnection { handleConnection(client: unknown, ...args: unknown[]): void; }
  export interface OnGatewayDisconnect { handleDisconnect(client: unknown): void; }
}

declare module '@nestjs/platform-socket.io' {
  export class IoAdapter {
    constructor(app?: unknown);
    createIOServer(port: number, options?: Record<string, unknown>): unknown;
  }
}

// Fallback for bullmq — used by NotificationsModule.
// When bullmq IS installed via pnpm, the real types take precedence.
declare module 'bullmq' {
  export interface JobsOptions {
    attempts?: number;
    backoff?: { type: string; delay: number };
    removeOnComplete?: boolean | number | { count?: number; age?: number };
    removeOnFail?: boolean | number | { count?: number; age?: number };
    delay?: number;
    priority?: number;
    [key: string]: unknown;
  }
  export class Job<T = unknown> {
    id?: string;
    name: string;
    data: T;
    opts: JobsOptions;
    returnvalue?: unknown;
    failedReason?: string;
    stacktrace?: string[];
    attemptsMade: number;
    timestamp: number;
  }
  export class Queue<T = unknown> {
    constructor(name: string, opts?: { connection?: unknown });
    add(name: string, data: T, opts?: JobsOptions): Promise<Job<T>>;
    getJobs(types?: string[]): Promise<Job<T>[]>;
    getJob(jobId: string): Promise<Job<T> | null>;
    close(): Promise<void>;
    remove(jobId: string): Promise<void>;
  }
  export class Worker<T = unknown> {
    constructor(name: string, processor: (job: Job<T>) => Promise<unknown>, opts?: unknown);
    close(): Promise<void>;
  }
}

declare global {
  namespace Express {
    interface Request {
      session?: Record<string, any>;
      body: any;
      query: any;
      url: string;
      path: string;
      route: any;
      connection: any;
      ip: string;
      cookies?: Record<string, string>;
    }

    interface Response {
      locals: Record<string, any>;
    }

    interface NextFunction {
      (err?: any): void;
    }
  }
}

export {};
