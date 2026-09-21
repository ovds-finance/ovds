var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength, } from 'class-validator';
export class CreateDepartmentDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateDepartmentDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateDepartmentDto.prototype, "code", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], CreateDepartmentDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateDepartmentDto.prototype, "parentId", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateDepartmentDto.prototype, "isActive", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateDepartmentDto.prototype, "companyId", void 0);
export class UpdateDepartmentDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateDepartmentDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateDepartmentDto.prototype, "code", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], UpdateDepartmentDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateDepartmentDto.prototype, "parentId", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateDepartmentDto.prototype, "isActive", void 0);
