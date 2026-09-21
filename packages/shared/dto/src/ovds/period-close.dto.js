var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsInt, Min, Max, IsOptional, IsString, Length, } from 'class-validator';
export class LockPeriodDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], LockPeriodDto.prototype, "companyId", void 0);
__decorate([
    IsInt(),
    Min(2000),
    Max(2099),
    __metadata("design:type", Number)
], LockPeriodDto.prototype, "year", void 0);
__decorate([
    IsInt(),
    Min(1),
    Max(12),
    __metadata("design:type", Number)
], LockPeriodDto.prototype, "month", void 0);
__decorate([
    IsOptional(),
    IsString(),
    Length(1, 500),
    __metadata("design:type", String)
], LockPeriodDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Boolean)
], LockPeriodDto.prototype, "force", void 0);
export class UnlockPeriodDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UnlockPeriodDto.prototype, "companyId", void 0);
__decorate([
    IsInt(),
    Min(2000),
    Max(2099),
    __metadata("design:type", Number)
], UnlockPeriodDto.prototype, "year", void 0);
__decorate([
    IsInt(),
    Min(1),
    Max(12),
    __metadata("design:type", Number)
], UnlockPeriodDto.prototype, "month", void 0);
export class ListPeriodsDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ListPeriodsDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    __metadata("design:type", Number)
], ListPeriodsDto.prototype, "year", void 0);
