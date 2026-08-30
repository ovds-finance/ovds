import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  IsEnum,
  IsEmail,
  Matches,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Role, CompanyType } from '@ovds/shared/types';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_COMPLEXITY_REGEX,
  PASSWORD_COMPLEXITY_MESSAGE,
} from '@ovds/shared';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_COMPLEXITY_REGEX, { message: PASSWORD_COMPLEXITY_MESSAGE })
  password!: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subsidiary?: string;

  @IsUUID()
  @IsOptional()
  employeeId?: string;
}

export class ChangePasswordDto {
  @IsOptional()
  @IsString()
  oldPassword?: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_COMPLEXITY_REGEX, { message: PASSWORD_COMPLEXITY_MESSAGE })
  newPassword!: string;
}

export class ChangeRoleDto {
  @IsEnum(Role)
  role!: Role;
}

export class PublicSignupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName!: string;

  @IsEmail()
  @MaxLength(100)
  email!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_COMPLEXITY_REGEX, { message: PASSWORD_COMPLEXITY_MESSAGE })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-()\u202F]{7,20}$/, {
    message:
      'phone must be a valid phone number (7–20 digits, optional +/spaces/dashes)',
  })
  phone?: string;

  @IsOptional()
  @IsEnum(CompanyType)
  businessType?: CompanyType;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  businessCurrency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @IsEnum(Role)
  @MaxLength(50)
  role?: Role;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  registrationMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  inviteToken?: string;
}

export class EnforceMfaDto {
  @IsBoolean()
  @IsNotEmpty()
  enforce!: boolean;

  @IsString()
  @IsOptional()
  mfaToken?: string;

  @IsString()
  @IsOptional()
  code?: string;
}

export class LinkAuth0Dto {
  @IsString()
  @IsNotEmpty()
  auth0Id!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}

export class SessionDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  countryCode?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  deviceType?: string;

  @IsString()
  @IsNotEmpty()
  lastActive!: string;

  @IsString()
  @IsOptional()
  lastSeenAt?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsNotEmpty()
  expiresAt!: string;

  @IsString()
  @IsOptional()
  createdAt?: string;
}

export class UserSessionsResponseDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsNotEmpty()
  sessionsCount!: number;

  @IsArray()
  sessions!: SessionDto[];
}

export class VerifyFaydaDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{12}$/, { message: 'Fayda ID must be exactly 12 digits' })
  faydaId!: string;
}

export class LookupTinDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'TIN must be exactly 10 digits' })
  tin!: string;
}

export class EkybVerifyDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{12}$/, { message: 'Fayda ID must be exactly 12 digits' })
  faydaId!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'TIN must be exactly 10 digits' })
  tin?: string;
}

export class EnterpriseRegistrationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName!: string;

  @IsEmail()
  @MaxLength(100)
  email!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_COMPLEXITY_REGEX, { message: PASSWORD_COMPLEXITY_MESSAGE })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{12}$/, { message: 'Fayda ID must be exactly 12 digits' })
  faydaId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'TIN must be exactly 10 digits' })
  tin?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-()\u202F]{7,20}$/)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  website?: string;

  @IsOptional()
  @IsEnum(CompanyType)
  businessType?: CompanyType;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  businessCurrency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  registrationMethod?: string;

  @IsOptional()
  @IsBoolean()
  ekybVerified?: boolean;
}
