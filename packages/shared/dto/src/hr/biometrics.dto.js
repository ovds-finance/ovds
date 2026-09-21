var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsNotEmpty, IsString, IsEnum, IsUUID } from 'class-validator';
import { BiometricType } from '@ovds/shared/types';
export class RegisterBiometricDto {
}
__decorate([
    IsUUID(),
    IsNotEmpty(),
    __metadata("design:type", String)
], RegisterBiometricDto.prototype, "employeeId", void 0);
__decorate([
    IsEnum(BiometricType),
    IsNotEmpty(),
    __metadata("design:type", String)
], RegisterBiometricDto.prototype, "type", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], RegisterBiometricDto.prototype, "template", void 0);
export class VerifyBiometricDto {
}
__decorate([
    IsUUID(),
    IsNotEmpty(),
    __metadata("design:type", String)
], VerifyBiometricDto.prototype, "employeeId", void 0);
__decorate([
    IsEnum(BiometricType),
    IsNotEmpty(),
    __metadata("design:type", String)
], VerifyBiometricDto.prototype, "type", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], VerifyBiometricDto.prototype, "template", void 0);
