var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsNumber, IsInt, IsEnum, Min, Max, MaxLength, } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus } from '@ovds/shared/types';
export class CreateProjectDto {
}
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsEnum(ProjectStatus),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateProjectDto.prototype, "budget", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateProjectDto.prototype, "spent", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], CreateProjectDto.prototype, "progress", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "startDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "endDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "manager", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], CreateProjectDto.prototype, "teamSize", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateProjectDto.prototype, "customFields", void 0);
export class UpdateProjectDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateProjectDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsEnum(ProjectStatus),
    __metadata("design:type", String)
], UpdateProjectDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateProjectDto.prototype, "budget", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateProjectDto.prototype, "spent", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], UpdateProjectDto.prototype, "progress", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectDto.prototype, "startDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectDto.prototype, "endDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateProjectDto.prototype, "manager", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], UpdateProjectDto.prototype, "teamSize", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], UpdateProjectDto.prototype, "customFields", void 0);
