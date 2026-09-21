var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
export class CreateHolidayDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateHolidayDto.prototype, "name", void 0);
__decorate([
    Type(() => Date),
    IsDate(),
    IsNotEmpty(),
    __metadata("design:type", Date)
], CreateHolidayDto.prototype, "date", void 0);
__decorate([
    IsBoolean(),
    IsOptional(),
    __metadata("design:type", Boolean)
], CreateHolidayDto.prototype, "isAnnual", void 0);
export class UpdateHolidayDto {
}
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateHolidayDto.prototype, "name", void 0);
__decorate([
    Type(() => Date),
    IsDate(),
    IsOptional(),
    __metadata("design:type", Date)
], UpdateHolidayDto.prototype, "date", void 0);
__decorate([
    IsBoolean(),
    IsOptional(),
    __metadata("design:type", Boolean)
], UpdateHolidayDto.prototype, "isAnnual", void 0);
