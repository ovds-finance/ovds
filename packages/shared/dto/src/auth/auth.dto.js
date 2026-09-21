var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength, IsEnum, IsEmail, Matches, IsArray, IsBoolean, } from 'class-validator';
import { Role, CompanyType } from '@ovds/shared/types';
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_COMPLEXITY_REGEX, PASSWORD_COMPLEXITY_MESSAGE, } from '@ovds/shared';
export class LoginDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    MaxLength(100),
    __metadata("design:type", String)
], LoginDto.prototype, "username", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    MinLength(8),
    MaxLength(128),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
export class RegisterDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    MaxLength(100),
    __metadata("design:type", String)
], RegisterDto.prototype, "username", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    MinLength(PASSWORD_MIN_LENGTH),
    MaxLength(PASSWORD_MAX_LENGTH),
    Matches(PASSWORD_COMPLEXITY_REGEX, { message: PASSWORD_COMPLEXITY_MESSAGE }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    IsEmail(),
    IsOptional(),
    MaxLength(100),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    IsEnum(Role),
    IsOptional(),
    __metadata("design:type", String)
], RegisterDto.prototype, "role", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], RegisterDto.prototype, "subsidiary", void 0);
__decorate([
    IsUUID(),
    IsOptional(),
    __metadata("design:type", String)
], RegisterDto.prototype, "employeeId", void 0);
export class ChangePasswordDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "oldPassword", void 0);
__decorate([
    IsString(),
    MinLength(PASSWORD_MIN_LENGTH),
    MaxLength(PASSWORD_MAX_LENGTH),
    Matches(PASSWORD_COMPLEXITY_REGEX, { message: PASSWORD_COMPLEXITY_MESSAGE }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);
export class ChangeRoleDto {
}
__decorate([
    IsEnum(Role),
    __metadata("design:type", String)
], ChangeRoleDto.prototype, "role", void 0);
export class PublicSignupDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    MaxLength(50),
    __metadata("design:type", String)
], PublicSignupDto.prototype, "firstName", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    MaxLength(50),
    __metadata("design:type", String)
], PublicSignupDto.prototype, "lastName", void 0);
__decorate([
    IsEmail(),
    MaxLength(100),
    __metadata("design:type", String)
], PublicSignupDto.prototype, "email", void 0);
__decorate([
    IsString(),
    MinLength(PASSWORD_MIN_LENGTH),
    MaxLength(PASSWORD_MAX_LENGTH),
    Matches(PASSWORD_COMPLEXITY_REGEX, { message: PASSWORD_COMPLEXITY_MESSAGE }),
    __metadata("design:type", String)
], PublicSignupDto.prototype, "password", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], PublicSignupDto.prototype, "companyName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    Matches(/^\+?[0-9\s\-()\u202F]{7,20}$/, {
        message: 'phone must be a valid phone number (7–20 digits, optional +/spaces/dashes)',
    }),
    __metadata("design:type", String)
], PublicSignupDto.prototype, "phone", void 0);
__decorate([
    IsOptional(),
    IsEnum(CompanyType),
    __metadata("design:type", String)
], PublicSignupDto.prototype, "businessType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(10),
    __metadata("design:type", String)
], PublicSignupDto.prototype, "language", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(3),
    __metadata("design:type", String)
], PublicSignupDto.prototype, "businessCurrency", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], PublicSignupDto.prototype, "location", void 0);
__decorate([
    IsOptional(),
    IsEnum(Role),
    MaxLength(50),
    __metadata("design:type", String)
], PublicSignupDto.prototype, "role", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], PublicSignupDto.prototype, "registrationMethod", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], PublicSignupDto.prototype, "inviteToken", void 0);
export class EnforceMfaDto {
}
__decorate([
    IsBoolean(),
    IsNotEmpty(),
    __metadata("design:type", Boolean)
], EnforceMfaDto.prototype, "enforce", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], EnforceMfaDto.prototype, "mfaToken", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], EnforceMfaDto.prototype, "code", void 0);
export class LinkAuth0Dto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], LinkAuth0Dto.prototype, "auth0Id", void 0);
__decorate([
    IsEmail(),
    IsNotEmpty(),
    __metadata("design:type", String)
], LinkAuth0Dto.prototype, "email", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    MaxLength(100),
    __metadata("design:type", String)
], LinkAuth0Dto.prototype, "name", void 0);
export class SessionDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], SessionDto.prototype, "id", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], SessionDto.prototype, "ipAddress", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], SessionDto.prototype, "country", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], SessionDto.prototype, "countryCode", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], SessionDto.prototype, "userAgent", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], SessionDto.prototype, "deviceType", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], SessionDto.prototype, "lastActive", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], SessionDto.prototype, "lastSeenAt", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], SessionDto.prototype, "location", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], SessionDto.prototype, "expiresAt", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], SessionDto.prototype, "createdAt", void 0);
export class UserSessionsResponseDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], UserSessionsResponseDto.prototype, "userId", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], UserSessionsResponseDto.prototype, "username", void 0);
__decorate([
    IsNotEmpty(),
    __metadata("design:type", Number)
], UserSessionsResponseDto.prototype, "sessionsCount", void 0);
__decorate([
    IsArray(),
    __metadata("design:type", Array)
], UserSessionsResponseDto.prototype, "sessions", void 0);
export class VerifyFaydaDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    Matches(/^\d{12}$/, { message: 'Fayda ID must be exactly 12 digits' }),
    __metadata("design:type", String)
], VerifyFaydaDto.prototype, "faydaId", void 0);
export class LookupTinDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    Matches(/^\d{10}$/, { message: 'TIN must be exactly 10 digits' }),
    __metadata("design:type", String)
], LookupTinDto.prototype, "tin", void 0);
export class EkybVerifyDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    Matches(/^\d{12}$/, { message: 'Fayda ID must be exactly 12 digits' }),
    __metadata("design:type", String)
], EkybVerifyDto.prototype, "faydaId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    Matches(/^\d{10}$/, { message: 'TIN must be exactly 10 digits' }),
    __metadata("design:type", String)
], EkybVerifyDto.prototype, "tin", void 0);
export class EnterpriseRegistrationDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    MaxLength(50),
    __metadata("design:type", String)
], EnterpriseRegistrationDto.prototype, "firstName", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    MaxLength(50),
    __metadata("design:type", String)
], EnterpriseRegistrationDto.prototype, "lastName", void 0);
__decorate([
    IsEmail(),
    MaxLength(100),
    __metadata("design:type", String)
], EnterpriseRegistrationDto.prototype, "email", void 0);
__decorate([
    IsString(),
    MinLength(PASSWORD_MIN_LENGTH),
    MaxLength(PASSWORD_MAX_LENGTH),
    Matches(PASSWORD_COMPLEXITY_REGEX, { message: PASSWORD_COMPLEXITY_MESSAGE }),
    __metadata("design:type", String)
], EnterpriseRegistrationDto.prototype, "password", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], EnterpriseRegistrationDto.prototype, "companyName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    Matches(/^\d{12}$/, { message: 'Fayda ID must be exactly 12 digits' }),
    __metadata("design:type", String)
], EnterpriseRegistrationDto.prototype, "faydaId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    Matches(/^\d{10}$/, { message: 'TIN must be exactly 10 digits' }),
    __metadata("design:type", String)
], EnterpriseRegistrationDto.prototype, "tin", void 0);
__decorate([
    IsOptional(),
    IsString(),
    Matches(/^\+?[0-9\s\-()\u202F]{7,20}$/),
    __metadata("design:type", String)
], EnterpriseRegistrationDto.prototype, "phone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], EnterpriseRegistrationDto.prototype, "website", void 0);
__decorate([
    IsOptional(),
    IsEnum(CompanyType),
    __metadata("design:type", String)
], EnterpriseRegistrationDto.prototype, "businessType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(10),
    __metadata("design:type", String)
], EnterpriseRegistrationDto.prototype, "language", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(3),
    __metadata("design:type", String)
], EnterpriseRegistrationDto.prototype, "businessCurrency", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], EnterpriseRegistrationDto.prototype, "location", void 0);
__decorate([
    IsOptional(),
    IsEnum(Role),
    __metadata("design:type", String)
], EnterpriseRegistrationDto.prototype, "role", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], EnterpriseRegistrationDto.prototype, "registrationMethod", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], EnterpriseRegistrationDto.prototype, "ekybVerified", void 0);
