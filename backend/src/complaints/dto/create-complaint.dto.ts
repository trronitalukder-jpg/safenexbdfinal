import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus } from '@prisma/client';

export class CreateComplaintDto {
  @IsEnum(ComplaintCategory, { message: 'Invalid complaint category' })
  @IsNotEmpty()
  category: ComplaintCategory;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsOptional()
  evidenceUrls?: string[];

  @IsEnum(ComplaintPriority)
  @IsOptional()
  priority?: ComplaintPriority;
}

export class UpdateComplaintDto {
  @IsEnum(ComplaintStatus)
  @IsOptional()
  status?: ComplaintStatus;

  @IsString()
  @IsOptional()
  adminNotes?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;
}

