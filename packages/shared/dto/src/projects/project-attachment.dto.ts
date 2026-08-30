import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateProjectAttachmentDto {
  @IsString()
  taskId!: string;

  @IsString()
  @MaxLength(300)
  filename!: string;

  @IsString()
  @MaxLength(500)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

  @IsOptional()
  @IsString()
  uploadedBy?: string;
}

export class UpdateProjectAttachmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  filename?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;
}
