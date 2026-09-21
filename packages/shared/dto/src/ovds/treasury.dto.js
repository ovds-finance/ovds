var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsDateString, IsNumber, Min, Max, IsEnum, } from 'class-validator';
import { PaymentType, BatchStatus } from '@ovds/shared/types';
export { PaymentType, BatchStatus };
export class CreateCashForecastDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateCashForecastDto.prototype, "period", void 0);
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], CreateCashForecastDto.prototype, "projected", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateCashForecastDto.prototype, "low", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateCashForecastDto.prototype, "high", void 0);
__decorate([
    IsOptional(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], CreateCashForecastDto.prototype, "confidence", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateCashForecastDto.prototype, "notes", void 0);
export class CreatePaymentBatchDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreatePaymentBatchDto.prototype, "name", void 0);
__decorate([
    IsEnum(PaymentType),
    __metadata("design:type", String)
], CreatePaymentBatchDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreatePaymentBatchDto.prototype, "paymentDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreatePaymentBatchDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Array)
], CreatePaymentBatchDto.prototype, "items", void 0);
export class UpdatePaymentBatchDto {
}
__decorate([
    IsOptional(),
    IsEnum(BatchStatus),
    __metadata("design:type", String)
], UpdatePaymentBatchDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdatePaymentBatchDto.prototype, "paymentDate", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdatePaymentBatchDto.prototype, "exportedAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePaymentBatchDto.prototype, "exportFormat", void 0);
