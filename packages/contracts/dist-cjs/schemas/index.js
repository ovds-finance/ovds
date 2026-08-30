/**
 * @ovds/contracts/schemas — Barrel export for all Zod schemas.
 *
 * Import from here in the router definitions and in application code:
 *   import { InvoiceSchema, CreateInvoiceSchema } from '@ovds/contracts/schemas';
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
_export_star(require("./common"), exports);
_export_star(require("./auth"), exports);
_export_star(require("./ovds"), exports);
_export_star(require("./banking"), exports);
_export_star(require("./hr"), exports);
_export_star(require("./inventory"), exports);
_export_star(require("./nav"), exports);
_export_star(require("./tax"), exports);
_export_star(require("./settings"), exports);
_export_star(require("./monetization"), exports);
_export_star(require("./sync"), exports);
_export_star(require("./custom-fields"), exports);
_export_star(require("./accounting"), exports);
_export_star(require("./consolidation"), exports);
_export_star(require("./compliance"), exports);
_export_star(require("./crm"), exports);
_export_star(require("./sales"), exports);
_export_star(require("./purchases"), exports);
_export_star(require("./eims"), exports);
_export_star(require("./cyber-audit"), exports);
_export_star(require("./ifrs"), exports);
_export_star(require("./sub-ledger"), exports);
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
