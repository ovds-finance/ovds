var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsIn, IsInt, Max, MaxLength, Min, } from 'class-validator';
import { Type } from 'class-transformer';
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["TODO"] = "TODO";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["REVIEW"] = "REVIEW";
    TaskStatus["DONE"] = "DONE";
    TaskStatus["CANCELLED"] = "CANCELLED";
})(TaskStatus || (TaskStatus = {}));
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "LOW";
    TaskPriority["MEDIUM"] = "MEDIUM";
    TaskPriority["HIGH"] = "HIGH";
    TaskPriority["URGENT"] = "URGENT";
})(TaskPriority || (TaskPriority = {}));
export var BillingStyle;
(function (BillingStyle) {
    BillingStyle["FIXED_PER_HOUR"] = "FIXED_PER_HOUR";
    BillingStyle["FIXED_PRICE"] = "FIXED_PRICE";
    BillingStyle["FIXED_PER_TASK"] = "FIXED_PER_TASK";
})(BillingStyle || (BillingStyle = {}));
// -- Project Task DTOs ---------------------------------------------------------
export class CreateProjectTaskDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateProjectTaskDto.prototype, "projectId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectTaskDto.prototype, "milestoneId", void 0);
__decorate([
    IsString(),
    MaxLength(300),
    __metadata("design:type", String)
], CreateProjectTaskDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectTaskDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsEnum(TaskStatus),
    __metadata("design:type", String)
], CreateProjectTaskDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsEnum(TaskPriority),
    __metadata("design:type", String)
], CreateProjectTaskDto.prototype, "priority", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateProjectTaskDto.prototype, "assignedTo", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectTaskDto.prototype, "dueDate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateProjectTaskDto.prototype, "estimatedHours", void 0);
__decorate([
    IsOptional(),
    IsEnum(BillingStyle),
    __metadata("design:type", String)
], CreateProjectTaskDto.prototype, "billingStyle", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateProjectTaskDto.prototype, "fixedRate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], CreateProjectTaskDto.prototype, "profitMargin", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectTaskDto.prototype, "companyId", void 0);
export class UpdateProjectTaskDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(300),
    __metadata("design:type", String)
], UpdateProjectTaskDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectTaskDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsEnum(TaskStatus),
    __metadata("design:type", String)
], UpdateProjectTaskDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsEnum(TaskPriority),
    __metadata("design:type", String)
], UpdateProjectTaskDto.prototype, "priority", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateProjectTaskDto.prototype, "assignedTo", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectTaskDto.prototype, "dueDate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateProjectTaskDto.prototype, "estimatedHours", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateProjectTaskDto.prototype, "actualHours", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectTaskDto.prototype, "milestoneId", void 0);
__decorate([
    IsOptional(),
    IsEnum(BillingStyle),
    __metadata("design:type", String)
], UpdateProjectTaskDto.prototype, "billingStyle", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateProjectTaskDto.prototype, "fixedRate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], UpdateProjectTaskDto.prototype, "profitMargin", void 0);
// -- Project Milestone DTOs -----------------------------------------------------
export class CreateProjectMilestoneDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateProjectMilestoneDto.prototype, "projectId", void 0);
__decorate([
    IsString(),
    MaxLength(300),
    __metadata("design:type", String)
], CreateProjectMilestoneDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectMilestoneDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectMilestoneDto.prototype, "dueDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['PENDING', 'COMPLETED', 'MISSED']),
    __metadata("design:type", String)
], CreateProjectMilestoneDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], CreateProjectMilestoneDto.prototype, "progress", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateProjectMilestoneDto.prototype, "budget", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateProjectMilestoneDto.prototype, "spent", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectMilestoneDto.prototype, "companyId", void 0);
export class UpdateProjectMilestoneDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(300),
    __metadata("design:type", String)
], UpdateProjectMilestoneDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectMilestoneDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectMilestoneDto.prototype, "dueDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['PENDING', 'COMPLETED', 'MISSED']),
    __metadata("design:type", String)
], UpdateProjectMilestoneDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], UpdateProjectMilestoneDto.prototype, "progress", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateProjectMilestoneDto.prototype, "budget", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateProjectMilestoneDto.prototype, "spent", void 0);
// -- Project Timesheet DTOs -----------------------------------------------------
export class CreateProjectTimesheetDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateProjectTimesheetDto.prototype, "projectId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectTimesheetDto.prototype, "taskId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateProjectTimesheetDto.prototype, "employeeName", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateProjectTimesheetDto.prototype, "date", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0.25),
    __metadata("design:type", Number)
], CreateProjectTimesheetDto.prototype, "hours", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectTimesheetDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateProjectTimesheetDto.prototype, "billable", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateProjectTimesheetDto.prototype, "hourlyRate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectTimesheetDto.prototype, "companyId", void 0);
export class UpdateProjectTimesheetDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectTimesheetDto.prototype, "taskId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateProjectTimesheetDto.prototype, "employeeName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectTimesheetDto.prototype, "date", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0.25),
    __metadata("design:type", Number)
], UpdateProjectTimesheetDto.prototype, "hours", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectTimesheetDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateProjectTimesheetDto.prototype, "billable", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateProjectTimesheetDto.prototype, "hourlyRate", void 0);
