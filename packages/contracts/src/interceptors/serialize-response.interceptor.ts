/**
 * @ovds/contracts/interceptors/serialize-response — NestJS response serialization interceptor
 *
 * Automatically transforms outgoing Prisma entities into clean DTO shapes
 * before they hit the wire. Uses @ovds/dto serializer utilities to ensure
 * sensitive fields are stripped, dates are ISO-8601, and decimals are strings.
 *
 * Usage:
 *   import { SerializeResponseInterceptor } from '@ovds/contracts';
 *
 *   @UseInterceptors(SerializeResponseInterceptor)
 *   @Get()
 *   findAll() {
 *     return this.service.findAll(); // Prisma entities → clean JSON
 *   }
 *
 * The interceptor:
 *  1. Detects arrays and applies serializePaginated.
 *  2. Detects single objects and applies serializeEntity.
 *  3. Passes through primitives, null, and already-serialized values unchanged.
 *  4. Uses the standard ApiResponse envelope if wrapInEnvelope is true.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Type,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  serializeEntity,
  serializePaginated,
  SerializeOptions,
  ApiEnvelope,
} from '@ovds/dto';

export interface SerializeResponseOptions extends SerializeOptions {
  /**
   * If true (default), wraps single objects in the standard ApiResponse envelope.
   * Arrays are always wrapped with PaginatedDto shape when total/page/limit are detected.
   */
  wrapInEnvelope?: boolean;
  /**
   * If true (default), strips sensitive fields automatically.
   */
  stripSensitive?: boolean;
}

@Injectable()
export class SerializeResponseInterceptor implements NestInterceptor {
  constructor(private readonly options: SerializeResponseOptions = {}) {}

  static apply(options?: SerializeResponseOptions) {
    return UseInterceptors(new SerializeResponseInterceptor(options));
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const opts = {
      wrapInEnvelope: this.options.wrapInEnvelope ?? false,
      stripSensitive: this.options.stripSensitive ?? true,
      ...this.options,
    };

    return next.handle().pipe(
      map(async (raw) => {
        if (raw === null || raw === undefined) return raw;

        // Already a plain object with envelope shape — pass through
        if (this.isEnvelope(raw)) {
          return raw;
        }

        // Array of entities
        if (Array.isArray(raw)) {
          const serialized = raw.map((item) =>
            opts.stripSensitive ? serializeEntity(item, opts) : item,
          );
          if (opts.wrapInEnvelope) {
            return serializeApiResponse({
              success: true,
              statusCode: 200,
              data: serialized,
            });
          }
          return serialized;
        }

        // Single entity
        if (typeof raw === 'object' && raw.constructor === Object) {
          const serialized = opts.stripSensitive ? serializeEntity(raw, opts) : raw;
          if (opts.wrapInEnvelope) {
            return serializeApiResponse({
              success: true,
              statusCode: 200,
              data: serialized,
            });
          }
          return serialized;
        }

        return raw;
      }),
    );
  }

  private isEnvelope(value: any): value is ApiEnvelope<any> {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof value.success === 'boolean' &&
      typeof value.statusCode === 'number'
    );
  }
}

function serializeApiResponse<T>(opts: {
  success: boolean;
  statusCode: number;
  data?: T;
}): ApiEnvelope<T> {
  return {
    success: opts.success,
    statusCode: opts.statusCode,
    timestamp: new Date().toISOString(),
    data: opts.data,
  };
}
