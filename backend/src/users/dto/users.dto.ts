import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AccountOwnerType, PaymentMethodType } from '@prisma/client';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  businessName?: string;

  @IsString()
  @IsOptional()
  businessType?: string;
}

export class CreatePaymentAccountDto {
  @IsEnum(PaymentMethodType)
  @IsNotEmpty()
  methodType: PaymentMethodType;

  @IsEnum(AccountOwnerType)
  @IsOptional()
  accountType?: AccountOwnerType;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  branchName?: string;

  @IsString()
  @IsOptional()
  routingNumber?: string;

  @IsOptional()
  isDefault?: boolean;

  @IsString()
  @IsOptional()
  password?: string;
}

export class UpdatePaymentAccountDto {
  @IsEnum(PaymentMethodType)
  @IsOptional()
  methodType?: PaymentMethodType;

  @IsEnum(AccountOwnerType)
  @IsOptional()
  accountType?: AccountOwnerType;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  accountName?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  branchName?: string;

  @IsString()
  @IsOptional()
  routingNumber?: string;

  @IsOptional()
  isDefault?: boolean;

  @IsString()
  @IsOptional()
  password?: string;
}

export class DeletePaymentAccountDto {
  @IsString()
  @IsOptional()
  password?: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}

export class SearchUserQueryDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsString()
  @IsOptional()
  isVerified?: string;

  @IsOptional()
  limit?: any;

  @IsOptional()
  scope?: string;
}

