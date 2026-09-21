"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VatPluginConfig = exports.taxPaymentRefApi = exports.taxFilingsApi = exports.taxVaultApi = exports.etaxApi = exports.taxDashboardApi = exports.universalTaxConfigApi = exports.propertyTaxApi = exports.stampDutyApi = exports.exciseTaxApi = exports.pensionApi = exports.payeApi = exports.drrfApi = exports.whtApi = exports.scheduleD = exports.bitApi = exports.totApi = exports.vatApi = exports.resolveTaxesForTransaction = exports.updateCompanyTaxProfile = exports.calculateERCAPenalty = exports.syncBankTransactions = exports.submitToETax = exports.exportETaxJson = exports.generateETaxPayload = exports.recordWHTRemittance = exports.recordDRRFRemittance = exports.recordBITFiling = exports.recordTaxFiling = exports.triggerAutoComputeTot = exports.calculateTot = void 0;
// Named exports for all tax API functions and objects — explicit for bundler static analysis
var taxApi_1 = require("./services/taxApi");
Object.defineProperty(exports, "calculateTot", { enumerable: true, get: function () { return taxApi_1.calculateTot; } });
Object.defineProperty(exports, "triggerAutoComputeTot", { enumerable: true, get: function () { return taxApi_1.triggerAutoComputeTot; } });
Object.defineProperty(exports, "recordTaxFiling", { enumerable: true, get: function () { return taxApi_1.recordTaxFiling; } });
Object.defineProperty(exports, "recordBITFiling", { enumerable: true, get: function () { return taxApi_1.recordBITFiling; } });
Object.defineProperty(exports, "recordDRRFRemittance", { enumerable: true, get: function () { return taxApi_1.recordDRRFRemittance; } });
Object.defineProperty(exports, "recordWHTRemittance", { enumerable: true, get: function () { return taxApi_1.recordWHTRemittance; } });
Object.defineProperty(exports, "generateETaxPayload", { enumerable: true, get: function () { return taxApi_1.generateETaxPayload; } });
Object.defineProperty(exports, "exportETaxJson", { enumerable: true, get: function () { return taxApi_1.exportETaxJson; } });
Object.defineProperty(exports, "submitToETax", { enumerable: true, get: function () { return taxApi_1.submitToETax; } });
Object.defineProperty(exports, "syncBankTransactions", { enumerable: true, get: function () { return taxApi_1.syncBankTransactions; } });
Object.defineProperty(exports, "calculateERCAPenalty", { enumerable: true, get: function () { return taxApi_1.calculateERCAPenalty; } });
Object.defineProperty(exports, "updateCompanyTaxProfile", { enumerable: true, get: function () { return taxApi_1.updateCompanyTaxProfile; } });
Object.defineProperty(exports, "resolveTaxesForTransaction", { enumerable: true, get: function () { return taxApi_1.resolveTaxesForTransaction; } });
Object.defineProperty(exports, "vatApi", { enumerable: true, get: function () { return taxApi_1.vatApi; } });
Object.defineProperty(exports, "totApi", { enumerable: true, get: function () { return taxApi_1.totApi; } });
Object.defineProperty(exports, "bitApi", { enumerable: true, get: function () { return taxApi_1.bitApi; } });
Object.defineProperty(exports, "scheduleD", { enumerable: true, get: function () { return taxApi_1.scheduleD; } });
Object.defineProperty(exports, "whtApi", { enumerable: true, get: function () { return taxApi_1.whtApi; } });
Object.defineProperty(exports, "drrfApi", { enumerable: true, get: function () { return taxApi_1.drrfApi; } });
Object.defineProperty(exports, "payeApi", { enumerable: true, get: function () { return taxApi_1.payeApi; } });
Object.defineProperty(exports, "pensionApi", { enumerable: true, get: function () { return taxApi_1.pensionApi; } });
Object.defineProperty(exports, "exciseTaxApi", { enumerable: true, get: function () { return taxApi_1.exciseTaxApi; } });
Object.defineProperty(exports, "stampDutyApi", { enumerable: true, get: function () { return taxApi_1.stampDutyApi; } });
Object.defineProperty(exports, "propertyTaxApi", { enumerable: true, get: function () { return taxApi_1.propertyTaxApi; } });
Object.defineProperty(exports, "universalTaxConfigApi", { enumerable: true, get: function () { return taxApi_1.universalTaxConfigApi; } });
Object.defineProperty(exports, "taxDashboardApi", { enumerable: true, get: function () { return taxApi_1.taxDashboardApi; } });
Object.defineProperty(exports, "etaxApi", { enumerable: true, get: function () { return taxApi_1.etaxApi; } });
Object.defineProperty(exports, "taxVaultApi", { enumerable: true, get: function () { return taxApi_1.taxVaultApi; } });
Object.defineProperty(exports, "taxFilingsApi", { enumerable: true, get: function () { return taxApi_1.taxFilingsApi; } });
Object.defineProperty(exports, "taxPaymentRefApi", { enumerable: true, get: function () { return taxApi_1.taxPaymentRefApi; } });
__exportStar(require("./types/index"), exports);
// ── Frontend module plugin ─────────────────────────────────────────────────────
var plugin_1 = require("./plugin");
Object.defineProperty(exports, "VatPluginConfig", { enumerable: true, get: function () { return plugin_1.VatPluginConfig; } });
//# sourceMappingURL=index.js.map