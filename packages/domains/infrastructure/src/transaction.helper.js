"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTx = withTx;
exports.parallel = parallel;
exports.batchQuery = batchQuery;
exports.withRetry = withRetry;
exports.timed = timed;
exports.withTimeout = withTimeout;
exports.dedupeUpsert = dedupeUpsert;
/**
 * Transaction and async helpers for domain services.
 * Import from @ovds/domains-infrastructure — never from app/common/.
 */
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('TransactionHelper');
/** Execute `fn` inside a Prisma interactive transaction */
async function withTx(prisma, fn, options) {
    try {
        return await prisma.$transaction(fn, {
            maxWait: options?.maxWait ?? 5000,
            timeout: options?.timeout ?? 15000,
        });
    }
    catch (err) {
        logger.error(`Transaction failed: ${err?.message ?? String(err)}`);
        throw err;
    }
}
/** Run named queries in parallel — replaces `Promise.all([a, b, c])` */
async function parallel(queries) {
    const keys = Object.keys(queries);
    const results = await Promise.all(keys.map((k) => queries[k]()));
    return Object.fromEntries(keys.map((k, i) => [k, results[i]]));
}
/** Batch large ID arrays to avoid MySQL "too many parameters" on IN clauses */
async function batchQuery(ids, chunkSize, fn) {
    const results = [];
    for (let i = 0; i < ids.length; i += chunkSize) {
        results.push(...(await fn(ids.slice(i, i + chunkSize))));
    }
    return results;
}
/** Retry transient DB errors (deadlock, timeout) with exponential back-off */
async function withRetry(fn, maxAttempts = 3, baseDelayMs = 200) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (err) {
            const isTransient = err?.code === 'P2034' ||
                err?.message?.includes('deadlock') ||
                err?.message?.includes('timeout');
            if (!isTransient || attempt === maxAttempts)
                throw err;
            const delay = baseDelayMs * 2 ** (attempt - 1);
            logger.warn(`Transient DB error attempt ${attempt}/${maxAttempts}, retry in ${delay}ms`);
            await new Promise((r) => setTimeout(r, delay));
        }
    }
    throw new Error('withRetry: unreachable');
}
/** Measure slow operations and log a warning when over `warnMs` */
async function timed(label, fn, warnMs = 1000) {
    const start = Date.now();
    const result = await fn();
    const ms = Date.now() - start;
    if (ms > warnMs)
        logger.warn(`[SLOW] ${label} took ${ms}ms`);
    return { result, ms };
}
/** Race a promise against a hard timeout */
async function withTimeout(fn, timeoutMs) {
    return Promise.race([
        fn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)),
    ]);
}
/** Deduplicate bulk upserts by a key field */
async function dedupeUpsert(items, keyField, fn) {
    const seen = new Set();
    let processed = 0, skipped = 0;
    for (const item of items) {
        const key = item[keyField];
        if (seen.has(key)) {
            skipped++;
            continue;
        }
        seen.add(key);
        await fn(item);
        processed++;
    }
    return { processed, skipped };
}
//# sourceMappingURL=transaction.helper.js.map