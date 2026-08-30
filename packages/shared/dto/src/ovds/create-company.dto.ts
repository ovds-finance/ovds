import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { CompanyType, AppEnvironment } from '@ovds/shared/types';

export { CompanyType, AppEnvironment };

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsEnum(CompanyType)
  type: CompanyType;

  @IsOptional()
  @IsString()
  tin?: string;

  @IsOptional()
  @IsString()
  vatNumber?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  fiscalYearStart?: number;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  teamSize?: string;

  @IsOptional()
  @IsEnum(AppEnvironment)
  environment?: AppEnvironment;

  @IsOptional()
  @IsBoolean()
  autoUpdate?: boolean;

  @IsOptional()
  @IsObject()
  settings?: any;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(CompanyType)
  type?: CompanyType;

  @IsOptional()
  @IsString()
  tin?: string;

  @IsOptional()
  @IsString()
  vatNumber?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  fiscalYearStart?: number;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  teamSize?: string;

  @IsOptional()
  @IsEnum(AppEnvironment)
  environment?: AppEnvironment;

  @IsOptional()
  @IsBoolean()
  autoUpdate?: boolean;

  @IsOptional()
  @IsObject()
  settings?: any;
}
