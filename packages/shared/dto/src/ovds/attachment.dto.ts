import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateAttachmentDto {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsNumber()
  fileSize!: number;

  @IsOptional()
  @IsString()
  fileData?: string;

  @IsString()
  @IsNotEmpty()
  attachableId!: string;

  @IsString()
  @IsNotEmpty()
  attachableType!: 'TaxRate' | 'Invoice' | 'Bill' | 'JournalEntry';

  @IsOptional()
  @IsString()
  description?: string;
}
