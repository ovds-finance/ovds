var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsEnum, MaxLength, } from 'class-validator';
export var ProjectActivityType;
(function (ProjectActivityType) {
    ProjectActivityType["TASK_CREATED"] = "TASK_CREATED";
    ProjectActivityType["TASK_UPDATED"] = "TASK_UPDATED";
    ProjectActivityType["TIMER_STARTED"] = "TIMER_STARTED";
    ProjectActivityType["TIMER_STOPPED"] = "TIMER_STOPPED";
    ProjectActivityType["TIMESHEET_CREATED"] = "TIMESHEET_CREATED";
    ProjectActivityType["COMMENT_ADDED"] = "COMMENT_ADDED";
    ProjectActivityType["FILE_ATTACHED"] = "FILE_ATTACHED";
    ProjectActivityType["FINANCIAL_LINKED"] = "FINANCIAL_LINKED";
    ProjectActivityType["MILESTONE_UPDATED"] = "MILESTONE_UPDATED";
    ProjectActivityType["STATUS_CHANGED"] = "STATUS_CHANGED";
    ProjectActivityType["BILLING_UPDATED"] = "BILLING_UPDATED";
})(ProjectActivityType || (ProjectActivityType = {}));
export class CreateProjectActivityDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateProjectActivityDto.prototype, "projectId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectActivityDto.prototype, "taskId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectActivityDto.prototype, "milestoneId", void 0);
__decorate([
    IsEnum(ProjectActivityType),
    __metadata("design:type", String)
], CreateProjectActivityDto.prototype, "activityType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(300),
    __metadata("design:type", String)
], CreateProjectActivityDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectActivityDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectActivityDto.prototype, "delta", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectActivityDto.prototype, "companyId", void 0);
export class UpdateProjectActivityDto {
}
__decorate([
    IsOptional(),
    IsEnum(ProjectActivityType),
    __metadata("design:type", String)
], UpdateProjectActivityDto.prototype, "activityType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(300),
    __metadata("design:type", String)
], UpdateProjectActivityDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectActivityDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectActivityDto.prototype, "delta", void 0);
