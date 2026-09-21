/**
 * DTOs for the ABAC security-policy endpoints.
 *
 * Uses class-validator so per-field errors are returned to the client
 * instead of silently accepting malformed payloads (e.g. garbage CIDR
 * strings, invalid time formats, unknown timezones).
 */
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
  ArrayMaxSize,
  ValidateIf,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

// ── Custom validator: IPv4, IPv4 CIDR, or basic IPv6 ─────────────────────────
function IsIpOrCidr(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isIpOrCidr',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          const v = value.trim();
          // IPv4 CIDR
          if (v.includes('/')) {
            const [ip, bits] = v.split('/');
            const prefix = parseInt(bits ?? '', 10);
            if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;
            const octets = (ip ?? '').split('.');
            return octets.length === 4 && octets.every(o => {
              const n = parseInt(o, 10);
              return !isNaN(n) && n >= 0 && n <= 255 && String(n) === o;
            });
          }
          // IPv4 exact
          const octets = v.split('.');
          if (octets.length === 4 && octets.every(o => {
            const n = parseInt(o, 10);
            return !isNaN(n) && n >= 0 && n <= 255 && String(n) === o;
          })) return true;
          // Basic IPv6 (contains colon)
          if (v.includes(':')) return true;
          return false;
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} entry "${args.value}" is not a valid IPv4, IPv4/CIDR, or IPv6 address.`;
        },
      },
    });
  };
}

// ── AllowedHours nested DTO ───────────────────────────────────────────────────
export class AllowedHoursDto {
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'start must be in HH:mm format' })
  start!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'end must be in HH:mm format' })
  end!: string;

  @IsString()
  @MaxLength(64)
  timezone!: string;
}

// ── Save / PATCH DTO ──────────────────────────────────────────────────────────
export class SaveSecurityPolicyDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100, { message: 'ipWhitelist cannot exceed 100 entries' })
  @IsIpOrCidr({ each: true })
  ipWhitelist?: string[];

  @IsOptional()
  @ValidateIf(o => o.allowedHours !== null)
  @IsObject()
  @ValidateNested()
  @Type(() => AllowedHoursDto)
  allowedHours?: AllowedHoursDto | null;

  @IsOptional()
  @IsBoolean()
  mfaRequired?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  @MaxLength(100, { each: true, message: 'Each sensitivePerms entry must be ≤ 100 chars' })
  sensitivePerms?: string[];
}

// ── Policy Test / Simulate DTO ────────────────────────────────────────────────
export class TestSecurityPolicyDto {
  /** The company whose saved policy to test against. */
  @IsOptional()
  @IsString()
  companyId?: string;

  /** Simulate the request coming from this IP. */
  @IsOptional()
  @IsIpOrCidr()
  ipAddress?: string;

  /**
   * Simulate the request arriving at this ISO-8601 datetime.
   * Defaults to "now" if omitted.
   */
  @IsOptional()
  @IsString()
  requestTime?: string;

  /** Simulate the user having completed MFA. */
  @IsOptional()
  @IsBoolean()
  mfaVerified?: boolean;

  /**
   * One or more permissions to test against the policy.
   * If any of these is "sensitive", the ABAC checks will fire.
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  permissions?: string[];
}
