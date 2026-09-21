import { Role, CompanyType } from '@ovds/shared/types';
export declare class LoginDto {
    username: string;
    password: string;
}
export declare class RegisterDto {
    username: string;
    password: string;
    email?: string;
    role?: Role;
    subsidiary?: string;
    employeeId?: string;
}
export declare class ChangePasswordDto {
    oldPassword?: string;
    newPassword: string;
}
export declare class ChangeRoleDto {
    role: Role;
}
export declare class PublicSignupDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    companyName?: string;
    phone?: string;
    businessType?: CompanyType;
    language?: string;
    businessCurrency?: string;
    location?: string;
    role?: Role;
    registrationMethod?: string;
    inviteToken?: string;
}
export declare class EnforceMfaDto {
    enforce: boolean;
    mfaToken?: string;
    code?: string;
}
export declare class LinkAuth0Dto {
    auth0Id: string;
    email: string;
    name: string;
}
export declare class SessionDto {
    id: string;
    ipAddress?: string;
    country?: string;
    countryCode?: string;
    userAgent?: string;
    deviceType?: string;
    lastActive: string;
    lastSeenAt?: string;
    location?: string;
    expiresAt: string;
    createdAt?: string;
}
export declare class UserSessionsResponseDto {
    userId: string;
    username: string;
    sessionsCount: number;
    sessions: SessionDto[];
}
export declare class VerifyFaydaDto {
    faydaId: string;
}
export declare class LookupTinDto {
    tin: string;
}
export declare class EkybVerifyDto {
    faydaId: string;
    tin?: string;
}
export declare class EnterpriseRegistrationDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    companyName?: string;
    faydaId?: string;
    tin?: string;
    phone?: string;
    website?: string;
    businessType?: CompanyType;
    language?: string;
    businessCurrency?: string;
    location?: string;
    role?: Role;
    registrationMethod?: string;
    ekybVerified?: boolean;
}
//# sourceMappingURL=auth.dto.d.ts.map