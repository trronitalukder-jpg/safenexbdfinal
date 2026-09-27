import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  Min,
  Matches,
} from 'class-validator';
import { PromotionCommissionType } from '@prisma/client';

export class CreatePromotionDto {
  @IsString()
  name: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{2,50}$/, {
    message: 'কোডটি অবশ্যই ২ থেকে ৫০ অক্ষরের বর্ণ, সংখ্যা, হাইফেন বা আন্ডারস্কোর হতে হবে',
  })
  code: string;

  @IsOptional()
  @IsString()
  promoterName?: string;

  @IsOptional()
  @IsString()
  promoterPhone?: string;

  @IsOptional()
  @IsString()
  promoterChannel?: string;

  @IsOptional()
  @IsEnum(PromotionCommissionType)
  commissionType?: PromotionCommissionType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  flatBudget?: number;

  @IsOptional()
  @IsString()
  commissionNote?: string;

  @IsOptional()
  @IsString()
  targetUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{2,50}$/, {
    message: 'কোডটি অবশ্যই ২ থেকে ৫০ অক্ষরের বর্ণ, সংখ্যা, হাইফেন বা আন্ডারস্কোর হতে হবে',
  })
  code?: string;

  @IsOptional()
  @IsString()
  promoterName?: string;

  @IsOptional()
  @IsString()
  promoterPhone?: string;

  @IsOptional()
  @IsString()
  promoterChannel?: string;

  @IsOptional()
  @IsEnum(PromotionCommissionType)
  commissionType?: PromotionCommissionType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  flatBudget?: number;

  @IsOptional()
  @IsString()
  commissionNote?: string;

  @IsOptional()
  @IsString()
  targetUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class RecordPayoutDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdatePromotionSettingsDto {
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  allowSelfPortal?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  attributionDays?: number;

  @IsOptional()
  @IsString()
  defaultTargetUrl?: string;
}

export class TrackClickDto {
  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  device?: string;
}
