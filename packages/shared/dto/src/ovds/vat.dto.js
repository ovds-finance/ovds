var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsNotEmpty, Matches, IsNumber, IsPositive, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
export class TransactionItemDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], TransactionItemDto.prototype, "invoiceNumber", void 0);
__decorate([
    IsNumber(),
    IsPositive(),
    __metadata("design:type", Number)
], TransactionItemDto.prototype, "itemTotalCents", void 0);
export class DeclareVatDto {
}
__decorate([
    IsString(),
    Matches(/^[0-9]{10}$/, { message: 'TIN must be exactly 10 digits.' }),
    __metadata("design:type", String)
], DeclareVatDto.prototype, "taxpayerTin", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], DeclareVatDto.prototype, "declarationPeriod", void 0);
__decorate([
    IsArray(),
    ValidateNested({ each: true }),
    Type(() => TransactionItemDto),
    __metadata("design:type", Array)
], DeclareVatDto.prototype, "salesItems", void 0);
__decorate([
    IsArray(),
    ValidateNested({ each: true }),
    Type(() => TransactionItemDto),
    __metadata("design:type", Array)
], DeclareVatDto.prototype, "purchaseItems", void 0);
