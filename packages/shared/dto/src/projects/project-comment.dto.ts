import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateProjectCommentDto {
  @IsString()
  taskId!: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsOptional()
  @IsString()
  authorId?: string;
}

export class UpdateProjectCommentDto {
  @IsOptional()
  @IsString()
  body!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
