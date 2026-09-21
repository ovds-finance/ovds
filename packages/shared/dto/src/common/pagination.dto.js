var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';
export class PaginationQueryDto {
    constructor() {
        this.page = 1;
        this.take = 10;
        this.sortOrder = 'desc';
    }
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], PaginationQueryDto.prototype, "page", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(500),
    __metadata("design:type", Number)
], PaginationQueryDto.prototype, "take", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(500),
    Transform(({ value, obj }) => {
        if ((obj.take == null || obj.take === undefined) && value != null) {
            obj.take = Number(value);
        }
        return value;
    }),
    __metadata("design:type", Number)
], PaginationQueryDto.prototype, "limit", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "search", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "sortBy", void 0);
__decorate([
    IsOptional(),
    IsIn(['asc', 'desc']),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "sortOrder", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "date", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "employeeId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "departmentId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "startDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "endDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "vendorId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "customerId", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    __metadata("design:type", Number)
], PaginationQueryDto.prototype, "year", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    __metadata("design:type", Number)
], PaginationQueryDto.prototype, "month", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "subsidiary", void 0);
export class AuditLogQueryDto extends PaginationQueryDto {
}
