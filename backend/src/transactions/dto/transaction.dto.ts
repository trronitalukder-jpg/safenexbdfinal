import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  receiverId: string; // The seller/receiver

  @IsNumber()
  @IsPositive()
  @Min(10)
  amount: number;

  @IsEnum(TransactionType)
  @IsOptional()
  transactionType?: TransactionType;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isMoneyRequest?: boolean;

  @IsString()
  @IsOptional()
  payerId?: string;

  @IsString()
  @IsOptional()
  expectedDuration?: string;
}

export class SetWorkTimeDto {
  @IsString()
  @IsOptional()
  workStartTime?: string;

  @IsString()
  @IsOptional()
  workEndTime?: string;

  @IsString()
  @IsOptional()
  expectedDuration?: string; // e.g. "24 hours"
}

export class SubmitWorkDoneDto {
  @IsString()
  @IsNotEmpty()
  workDescription: string;

  @IsOptional()
  proofUrls?: string[];
}

export class ReviewWorkDoneDto {
  @IsString()
  @IsNotEmpty()
  action: 'APPROVE' | 'REJECT';

  @IsString()
  @IsOptional()
  feedback?: string;
}

export class RejectTransactionDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

