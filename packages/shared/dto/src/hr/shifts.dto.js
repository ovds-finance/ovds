var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsNotEmpty, IsOptional, IsUUID, Matches, MaxLength, IsBoolean, } from 'class-validator';
export class CreateShiftDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateShiftDto.prototype, "name", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, {
        message: 'startTime must be in HH:mm format',
    }),
    __metadata("design:type", String)
], CreateShiftDto.prototype, "startTime", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, {
        message: 'endTime must be in HH:mm format',
    }),
    __metadata("design:type", String)
], CreateShiftDto.prototype, "endTime", void 0);
__decorate([
    IsUUID(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateShiftDto.prototype, "departmentId", void 0);
__decorate([
    IsUUID(),
    IsOptional(),
    __metadata("design:type", String)
], CreateShiftDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateShiftDto.prototype, "isActive", void 0);
export class UpdateShiftDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateShiftDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, {
        message: 'startTime must be in HH:mm format',
    }),
    __metadata("design:type", String)
], UpdateShiftDto.prototype, "startTime", void 0);
__decorate([
    IsOptional(),
    IsString(),
    Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, {
        message: 'endTime must be in HH:mm format',
    }),
    __metadata("design:type", String)
], UpdateShiftDto.prototype, "endTime", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], UpdateShiftDto.prototype, "departmentId", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateShiftDto.prototype, "isActive", void 0);
