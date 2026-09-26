import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ScammerCategory, ScammerReportStatus } from '@prisma/client';

export class UpdateScammerReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  facebookLink?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  scammerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  scammerPhotoUrl?: string;

  @IsOptional()
  @IsEnum(ScammerCategory)
  category?: ScammerCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  amountLost?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  proofImages?: string[];

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsEnum(ScammerReportStatus)
  status?: ScammerReportStatus;

  @IsOptional()
  @IsString()
  adminNotes?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
