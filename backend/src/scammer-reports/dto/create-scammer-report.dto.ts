import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ScammerCategory } from '@prisma/client';

export class CreateScammerReportDto {
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

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  amountLost?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  proofImages?: string[];
}
