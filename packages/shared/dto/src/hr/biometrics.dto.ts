import { IsNotEmpty, IsString, IsEnum, IsUUID } from 'class-validator';
import { BiometricType } from '@ovds/shared/types';

export class RegisterBiometricDto {
  @IsUUID() @IsNotEmpty() employeeId: string;
  @IsEnum(BiometricType) @IsNotEmpty() type: BiometricType;
  @IsString() @IsNotEmpty() template: string;
}

export class VerifyBiometricDto {
  @IsUUID() @IsNotEmpty() employeeId: string;
  @IsEnum(BiometricType) @IsNotEmpty() type: BiometricType;
  @IsString() @IsNotEmpty() template: string;
}
