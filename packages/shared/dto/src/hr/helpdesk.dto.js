var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsArray, IsIn, MaxLength, ArrayMaxSize, ArrayMinSize, } from 'class-validator';
export class CreateTicketDto {
}
__decorate([
    IsString(),
    MaxLength(300),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(5000),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "priority", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "assignedTo", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "companyId", void 0);
export class UpdateTicketDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(300),
    __metadata("design:type", String)
], UpdateTicketDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(5000),
    __metadata("design:type", String)
], UpdateTicketDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'OPEN',
        'IN_PROGRESS',
        'RESOLVED',
        'CLOSED',
        'REOPENED',
    ]),
    __metadata("design:type", String)
], UpdateTicketDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    __metadata("design:type", String)
], UpdateTicketDto.prototype, "priority", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateTicketDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateTicketDto.prototype, "assignedTo", void 0);
export class AddTicketReplyDto {
}
__decorate([
    IsString(),
    MaxLength(5000),
    __metadata("design:type", String)
], AddTicketReplyDto.prototype, "content", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], AddTicketReplyDto.prototype, "attachmentUrl", void 0);
export class BulkUpdateTicketStatusDto {
}
__decorate([
    IsArray(),
    ArrayMinSize(1),
    ArrayMaxSize(500),
    IsString({ each: true }),
    __metadata("design:type", Array)
], BulkUpdateTicketStatusDto.prototype, "ids", void 0);
__decorate([
    IsString(),
    IsIn([
        'OPEN',
        'IN_PROGRESS',
        'RESOLVED',
        'CLOSED',
        'REOPENED',
    ]),
    __metadata("design:type", String)
], BulkUpdateTicketStatusDto.prototype, "status", void 0);
