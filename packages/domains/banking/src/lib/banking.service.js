"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankingService = void 0;
class BankingService {
    constructor(repo) {
        this.repo = repo;
    }
    async list(companyId) { return []; }
    async get(id) { return null; }
    async create(data) { return data; }
    async update(id, data) { return data; }
    async remove(id) { }
}
exports.BankingService = BankingService;
//# sourceMappingURL=banking.service.js.map