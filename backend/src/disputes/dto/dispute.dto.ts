import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { DisputeActionType, DisputeStatus } from '@prisma/client';

export class CreateDisputeDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  evidenceUrls?: string[];
}

export class AddEvidenceDto {
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsString()
  @IsNotEmpty()
  fileType: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class ResolveDisputeDto {
  @IsEnum(DisputeActionType)
  @IsNotEmpty()
  actionType: DisputeActionType;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  amount?: number; // For partial split or custom amount

  @IsString()
  @IsNotEmpty()
  notes: string; // Mandatory explanation for audit log
}

export class UpdateDisputeStatusDto {
  @IsEnum(DisputeStatus)
  @IsNotEmpty()
  status: DisputeStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

