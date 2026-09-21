/**
 * @ovds/ui/utils/typed-api — typed API client with Zod response validation
 *
 * Wraps the base @ovds/ui api client with Zod schema validation for responses.
 * This ensures that API responses match the expected shape defined in
 * @ovds/contracts/schemas and @ovds/dto.
 *
 * Usage:
 *   import { typedApi } from '@ovds/ui';
 *   import { InvoiceSchema } from '@ovds/dto';
 *
 *   // Typed response with Zod validation
 *   const invoice = await typedApi.get('/invoices/123', {
 *     responseSchema: InvoiceSchema
 *   });
 *
 *   // Or use the typed methods directly
 *   const invoices = await typedApi.getTyped('/invoices', {
 *     responseSchema: z.array(InvoiceSchema)
 *   });
 */

import { z } from 'zod';
import { api, apiRequest, ApiClientOptions } from '../api-client';

export interface TypedApiClientOptions extends ApiClientOptions {
  /**
   * If true (default), throws a ZodError if the response doesn't match the schema.
   * If false, returns the raw response and logs a warning.
   */
  strict?: boolean;
}

/**
 * Validates a response against a Zod schema.
 * Throws ZodError on validation failure if strict mode is enabled.
 */
export function validateResponse<T>(data: unknown, schema: z.ZodType<T>, strict = true): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    if (strict) {
      throw result.error;
    }
    console.warn('[typed-api] Response validation failed:', result.error.issues);
  }
  return result.data!;
}

/**
 * Creates a typed API client that validates responses against Zod schemas.
 */
export function createTypedApiClient(options: TypedApiClientOptions = {}) {
  const { strict = true, ...apiOptions } = options;

  const client = api; // base api client

  return {
    ...client,

    getTyped: async <T>(url: string, params?: Record<string, string | number | boolean | null | undefined>, responseSchema?: z.ZodType<T>): Promise<T> => {
      const data = await client.get(url, params);
      if (responseSchema) {
        return validateResponse(data, responseSchema, strict);
      }
      return data as T;
    },

    postTyped: async <T>(url: string, body?: unknown, responseSchema?: z.ZodType<T>): Promise<T> => {
      const data = await client.post(url, body);
      if (responseSchema) {
        return validateResponse(data, responseSchema, strict);
      }
      return data as T;
    },

    patchTyped: async <T>(url: string, body: unknown, responseSchema?: z.ZodType<T>): Promise<T> => {
      const data = await client.patch(url, body);
      if (responseSchema) {
        return validateResponse(data, responseSchema, strict);
      }
      return data as T;
    },

    delTyped: async <T>(url: string, responseSchema?: z.ZodType<T>): Promise<T> => {
      const data = await client.del(url);
      if (responseSchema) {
        return validateResponse(data, responseSchema, strict);
      }
      return data as T;
    },
  };
}

/**
 * Default typed API client instance.
 */
export const typedApi = createTypedApiClient();
