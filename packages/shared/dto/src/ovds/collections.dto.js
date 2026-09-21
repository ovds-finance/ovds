var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsPositive, IsNotEmpty, } from 'class-validator';
import { CollectionStage, DeductionReason, DeductionStatus } from '@ovds/shared/types';
export { CollectionStage, DeductionReason, DeductionStatus };
export class CreateCollectionCaseDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateCollectionCaseDto.prototype, "invoiceId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateCollectionCaseDto.prototype, "assignedTo", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateCollectionCaseDto.prototype, "notes", void 0);
export class UpdateCollectionCaseDto {
}
__decorate([
    IsOptional(),
    IsEnum(CollectionStage),
    __metadata("design:type", String)
], UpdateCollectionCaseDto.prototype, "stage", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateCollectionCaseDto.prototype, "assignedTo", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdateCollectionCaseDto.prototype, "contactDate", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdateCollectionCaseDto.prototype, "promiseDate", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    IsPositive(),
    __metadata("design:type", Number)
], UpdateCollectionCaseDto.prototype, "partialPaid", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateCollectionCaseDto.prototype, "notes", void 0);
export class CreateDeductionDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateDeductionDto.prototype, "invoiceId", void 0);
__decorate([
    IsEnum(DeductionReason),
    __metadata("design:type", String)
], CreateDeductionDto.prototype, "reason", void 0);
__decorate([
    IsNumber(),
    IsPositive(),
    __metadata("design:type", Number)
], CreateDeductionDto.prototype, "amount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateDeductionDto.prototype, "notes", void 0);
export class UpdateDeductionDto {
}
__decorate([
    IsOptional(),
    IsEnum(DeductionStatus),
    __metadata("design:type", String)
], UpdateDeductionDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdateDeductionDto.prototype, "resolvedAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateDeductionDto.prototype, "resolution", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateDeductionDto.prototype, "notes", void 0);
