/**
 * @ovds/contracts — root barrel
 *
 * Re-exports the complete oRPC contract, all Zod schemas, and prisma-zod types.
 * Both the NestJS backend and React frontend import from this single entry point.
 *
 * Usage:
 *   import { appContract, InvoiceSchema, type Invoice } from '@ovds/contracts';
 *
 * NOTE: prisma-zod is NOT re-exported here in source — it is injected into the
 * compiled dist/index.js by the build script (build-cjs.ts) to keep tsc fast.
 * Import prisma-zod directly via: import { ... } from '@ovds/contracts/prisma-zod'
 */ // ── Router contract (oRPC) ────────────────────────────────────────────────────
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
_export_star(require("./router/index"), exports);
_export_star(require("./schemas/index"), exports);
function _export_star(from, to) {
    Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
            Object.defineProperty(to, k, {
                enumerable: true,
                get: function() {
                    return from[k];
                }
            });
        }
    });
    return from;
}

// Auto-injected by build-cjs.ts
const _pz = require('./prisma-zod/index.js'); Object.assign(exports, _pz);
