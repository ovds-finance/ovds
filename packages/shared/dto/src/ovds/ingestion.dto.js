var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
/**
 * @ovds/shared — Data Ingestion (Import/Export) DTOs
 * Shared between NestJS backend and React frontend.
 */
import { IsString, IsOptional, IsIn, IsInt, Min, Max, MaxLength, } from 'class-validator';
import { Type } from 'class-transformer';
// -- Supported entity types ----------------------------------------------------
export const INGESTION_ENTITY_TYPES = [
    'CUSTOMERS',
    'VENDORS',
    'ITEMS',
    'EMPLOYEES',
    'BANK_TRANSACTIONS',
    'CHART_OF_ACCOUNTS',
    'JOURNAL_ENTRIES',
    'PRODUCT_VARIANTS',
];
// -- Supported source formats --------------------------------------------------
export const INGESTION_SOURCE_TYPES = ['CSV', 'XLSX', 'XLS', 'JSON'];
// -- Job statuses --------------------------------------------------------------
export const INGESTION_STATUSES = [
    'RECEIVED',
    'PARSING',
    'REVIEW',
    'COMMITTING',
    'COMPLETED',
    'FAILED',
];
// -- DTOs ----------------------------------------------------------------------
/** Query params for listing ingestion jobs */
export class ListIngestionJobsDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ListIngestionJobsDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsIn(INGESTION_ENTITY_TYPES),
    __metadata("design:type", String)
], ListIngestionJobsDto.prototype, "entityType", void 0);
__decorate([
    IsOptional(),
    IsIn(INGESTION_STATUSES),
    __metadata("design:type", String)
], ListIngestionJobsDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], ListIngestionJobsDto.prototype, "page", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(200),
    __metadata("design:type", Number)
], ListIngestionJobsDto.prototype, "limit", void 0);
/** Export request body */
export class ExportRequestDto {
}
__decorate([
    IsString(),
    IsIn(INGESTION_ENTITY_TYPES),
    __metadata("design:type", String)
], ExportRequestDto.prototype, "entityType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ExportRequestDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['CSV', 'JSON']),
    __metadata("design:type", String)
], ExportRequestDto.prototype, "format", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], ExportRequestDto.prototype, "dateFrom", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], ExportRequestDto.prototype, "dateTo", void 0);
