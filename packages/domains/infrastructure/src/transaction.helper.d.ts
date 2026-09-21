/** Execute `fn` inside a Prisma interactive transaction */
export declare function withTx<T>(prisma: {
    $transaction: (fn: (tx: any) => Promise<T>, opts?: {
        maxWait?: number;
        timeout?: number;
    }) => Promise<T>;
}, fn: (tx: any) => Promise<T>, options?: {
    maxWait?: number;
    timeout?: number;
}): Promise<T>;
/** Run named queries in parallel — replaces `Promise.all([a, b, c])` */
export declare function parallel<T extends Record<string, () => Promise<unknown>>>(queries: T): Promise<{
    [K in keyof T]: Awaited<ReturnType<T[K]>>;
}>;
/** Batch large ID arrays to avoid MySQL "too many parameters" on IN clauses */
export declare function batchQuery<TId, TResult>(ids: TId[], chunkSize: number, fn: (chunk: TId[]) => Promise<TResult[]>): Promise<TResult[]>;
/** Retry transient DB errors (deadlock, timeout) with exponential back-off */
export declare function withRetry<T>(fn: () => Promise<T>, maxAttempts?: number, baseDelayMs?: number): Promise<T>;
/** Measure slow operations and log a warning when over `warnMs` */
export declare function timed<T>(label: string, fn: () => Promise<T>, warnMs?: number): Promise<{
    result: T;
    ms: number;
}>;
/** Race a promise against a hard timeout */
export declare function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T>;
/** Deduplicate bulk upserts by a key field */
export declare function dedupeUpsert<T>(items: T[], keyField: keyof T, fn: (item: T) => Promise<unknown>): Promise<{
    processed: number;
    skipped: number;
}>;
//# sourceMappingURL=transaction.helper.d.ts.map