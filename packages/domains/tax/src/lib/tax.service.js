"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxService = void 0;
class TaxService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async list(companyId) { return []; }
    async get(id) { return null; }
    async create(data) { return data; }
    async update(id, data) { return data; }
    async remove(id) { }
}
exports.TaxService = TaxService;
//# sourceMappingURL=tax.service.js.map