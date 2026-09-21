var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
export class StartProjectTimerDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], StartProjectTimerDto.prototype, "projectId", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], StartProjectTimerDto.prototype, "taskId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], StartProjectTimerDto.prototype, "employeeName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], StartProjectTimerDto.prototype, "notes", void 0);
export class StopProjectTimerDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], StopProjectTimerDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0.25),
    __metadata("design:type", Number)
], StopProjectTimerDto.prototype, "hours", void 0);
export class CreateProjectTimerDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateProjectTimerDto.prototype, "projectId", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateProjectTimerDto.prototype, "taskId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectTimerDto.prototype, "employeeName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectTimerDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0.25),
    __metadata("design:type", Number)
], CreateProjectTimerDto.prototype, "hours", void 0);
export class UpdateProjectTimerDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectTimerDto.prototype, "employeeName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectTimerDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0.25),
    __metadata("design:type", Number)
], UpdateProjectTimerDto.prototype, "hours", void 0);
