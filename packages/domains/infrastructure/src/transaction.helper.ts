/**
 * Transaction and async helpers for domain services.
 * Import from @ovds/domains-infrastructure — never from app/common/.
 */
import { Logger } from '@nestjs/common';

const logger = new Logger('TransactionHelper');

/** Execute `fn` inside a Prisma interactive transaction */
export async function withTx<T>(
  prisma: {
    $transaction: (fn: (tx: any) => Promise<T>, opts?: { maxWait?: number; timeout?: number }) => Promise<T>;
  },
  fn: (tx: any) => Promise<T>,
  options?: { maxWait?: number; timeout?: number },
): Promise<T> {
  try {
    return await prisma.$transaction(fn, {
      maxWait: options?.maxWait ?? 5_000,
      timeout: options?.timeout ?? 15_000,
    });
  } catch (err: any) {
    logger.error(`Transaction failed: ${err?.message ?? String(err)}`);
    throw err;
  }
}

/** Run named queries in parallel — replaces `Promise.all([a, b, c])` */
export async function parallel<T extends Record<string, () => Promise<unknown>>>(
  queries: T,
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const keys = Object.keys(queries) as (keyof T)[];
  const results = await Promise.all(keys.map((k) => queries[k]()));
  return Object.fromEntries(keys.map((k, i) => [k, results[i]])) as {
    [K in keyof T]: Awaited<ReturnType<T[K]>>;
  };
}

/** Batch large ID arrays to avoid MySQL "too many parameters" on IN clauses */
export async function batchQuery<TId, TResult>(
  ids: TId[],
  chunkSize: number,
  fn: (chunk: TId[]) => Promise<TResult[]>,
): Promise<TResult[]> {
  const results: TResult[] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    results.push(...(await fn(ids.slice(i, i + chunkSize))));
  }
  return results;
}

/** Retry transient DB errors (deadlock, timeout) with exponential back-off */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 200,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isTransient =
        err?.code === 'P2034' ||
        err?.message?.includes('deadlock') ||
        err?.message?.includes('timeout');
      if (!isTransient || attempt === maxAttempts) throw err;
      const delay = baseDelayMs * 2 ** (attempt - 1);
      logger.warn(`Transient DB error attempt ${attempt}/${maxAttempts}, retry in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('withRetry: unreachable');
}

/** Measure slow operations and log a warning when over `warnMs` */
export async function timed<T>(
  label: string,
  fn: () => Promise<T>,
  warnMs = 1000,
): Promise<{ result: T; ms: number }> {
  const start = Date.now();
  const result = await fn();
  const ms = Date.now() - start;
  if (ms > warnMs) logger.warn(`[SLOW] ${label} took ${ms}ms`);
  return { result, ms };
}

/** Race a promise against a hard timeout */
export async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs),
    ),
  ]);
}

/** Deduplicate bulk upserts by a key field */
export async function dedupeUpsert<T>(
  items: T[],
  keyField: keyof T,
  fn: (item: T) => Promise<unknown>,
): Promise<{ processed: number; skipped: number }> {
  const seen = new Set<unknown>();
  let processed = 0, skipped = 0;
  for (const item of items) {
    const key = item[keyField];
    if (seen.has(key)) { skipped++; continue; }
    seen.add(key);
    await fn(item);
    processed++;
  }
  return { processed, skipped };
}
