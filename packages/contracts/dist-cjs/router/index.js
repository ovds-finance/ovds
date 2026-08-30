/**
 * @ovds/contracts — Root oRPC Router Contract
 *
 * This is the single source of truth for the entire API surface.
 *
 * Architecture:
 *   schema.prisma
 *     └─ zod-prisma-types → packages/contracts/src/prisma-zod/  (auto-generated)
 *                              └─ composed into schemas/ (hand-crafted request/response shapes)
 *                                   └─ used by router/ (oRPC contract definitions)
 *                                        ├─ Backend: implements via oc.implementer(appContract)
 *                                        └─ Frontend: calls via createORPCClient(appContract)
 *
 * Usage — Backend (NestJS):
 *   import { appContract } from '@ovds/contracts/router';
 *   const router = os.contract(appContract).router({ ... });
 *
 * Usage — Frontend (React):
 *   import { appContract } from '@ovds/contracts/router';
 *   const orpc = createORPCClient(appContract, { baseURL: '/api/rpc' });
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get accountingContract () {
        return _accounting.accountingContract;
    },
    get appContract () {
        return appContract;
    },
    get authContract () {
        return _auth.authContract;
    },
    get bankingContract () {
        return _banking.bankingContract;
    },
    get complianceContract () {
        return _compliance.complianceContract;
    },
    get consolidationContract () {
        return _consolidation.consolidationContract;
    },
    get crmContract () {
        return _crm.crmContract;
    },
    get customFieldsContract () {
        return _customfields.customFieldsContract;
    },
    get cyberAuditContract () {
        return _cyberaudit.cyberAuditContract;
    },
    get eimsContract () {
        return _eims.eimsContract;
    },
    get hrContract () {
        return _hr.hrContract;
    },
    get ifrsContract () {
        return _ifrs.ifrsContract;
    },
    get invoiceContract () {
        return _invoice.invoiceContract;
    },
    get masterComplianceContract () {
        return _mastercompliance.masterComplianceContract;
    },
    get monetizationContract () {
        return _monetization.monetizationContract;
    },
    get navContract () {
        return _nav.navContract;
    },
    get ovdsContract () {
        return _ovds.ovdsContract;
    },
    get purchasesContract () {
        return _purchases.purchasesContract;
    },
    get salesContract () {
        return _sales.salesContract;
    },
    get settingsContract () {
        return _settings.settingsContract;
    },
    get subLedgerContract () {
        return _subledger.subLedgerContract;
    },
    get syncContract () {
        return _sync.syncContract;
    },
    get taxContract () {
        return _tax.taxContract;
    }
});
const _contract = require("@orpc/contract");
const _auth = require("./auth");
const _ovds = require("./ovds");
const _banking = require("./banking");
const _hr = require("./hr");
const _inventory = require("./inventory");
const _nav = require("./nav");
const _tax = require("./tax");
const _settings = require("./settings");
const _monetization = require("./monetization");
const _sync = require("./sync");
const _customfields = require("./custom-fields");
const _accounting = require("./accounting");
const _consolidation = require("./consolidation");
const _compliance = require("./compliance");
const _crm = require("./crm");
const _sales = require("./sales");
const _purchases = require("./purchases");
const _eims = require("./eims");
const _invoice = require("./invoice");
const _ifrs = require("./ifrs");
const _subledger = require("./sub-ledger");
const _cyberaudit = require("./cyber-audit");
const _mastercompliance = require("./master-compliance");
const appContract = _contract.oc.router({
    auth: _auth.authContract,
    ovds: _ovds.ovdsContract,
    banking: _banking.bankingContract,
    hr: _hr.hrContract,
    inventory: _inventory.inventoryContract,
    nav: _nav.navContract,
    tax: _tax.taxContract,
    settings: _settings.settingsContract,
    monetization: _monetization.monetizationContract,
    sync: _sync.syncContract,
    customFields: _customfields.customFieldsContract,
    accounting: _accounting.accountingContract,
    consolidation: _consolidation.consolidationContract,
    compliance: _compliance.complianceContract,
    crm: _crm.crmContract,
    sales: _sales.salesContract,
    purchases: _purchases.purchasesContract,
    eims: _eims.eimsContract,
    invoice: _invoice.invoiceContract,
    ifrs: _ifrs.ifrsContract,
    subLedger: _subledger.subLedgerContract,
    cyberAudit: _cyberaudit.cyberAuditContract,
    masterCompliance: _mastercompliance.masterComplianceContract
});
