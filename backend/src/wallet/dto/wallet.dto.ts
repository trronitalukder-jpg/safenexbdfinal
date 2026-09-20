import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateRechargeRequestDto {
  @IsString()
  @IsNotEmpty()
  methodId: string;

  @IsNumber()
  @IsPositive()
  @Min(10)
  amount: number;

  @IsString()
  @IsNotEmpty()
  senderAccount: string;

  @IsString()
  @IsNotEmpty()
  transactionNumber: string;

  @IsString()
  @IsOptional()
  proofUrl?: string;
}

export class ReviewRechargeDto {
  @IsString()
  @IsNotEmpty()
  action: 'APPROVE' | 'REJECT';

  @IsNumber()
  @IsOptional()
  @IsPositive()
  approvedAmount?: number; // Option 2: custom verified amount

  @IsString()
  @IsOptional()
  adminNotes?: string;

  @IsString()
  @IsOptional()
  proofUrl?: string;
}

export class CreateWithdrawalRequestDto {
  @IsString()
  @IsNotEmpty()
  methodId: string;

  @IsNumber()
  @IsPositive()
  @Min(50)
  amount: number;

  @IsString()
  @IsNotEmpty()
  destinationAccount: string;

  @IsString()
  @IsOptional()
  accountType?: string; // 'PERSONAL' | 'AGENT'

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  accountHolderName?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  routingNumber?: string;

  @IsString()
  @IsOptional()
  branchName?: string;

  @IsString()
  @IsOptional()
  otpCode?: string;

  @IsString()
  @IsOptional()
  password?: string;
}

export class ReviewWithdrawalDto {
  @IsString()
  @IsNotEmpty()
  action: 'APPROVE' | 'REJECT';

  @IsString()
  @IsOptional()
  adminNotes?: string;
}

export class AdminWalletAdjustmentDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  availableAdjustment: number; // positive or negative

  @IsNumber()
  @IsOptional()
  holdAdjustment?: number; // positive or negative

  @IsString()
  @IsNotEmpty()
  reason: string; // Mandatory per Rule 7 & Spec #49
}

export class HoldResolutionDto {
  @IsString()
  @IsNotEmpty()
  action: 'RELEASE' | 'REFUND'; // RELEASE to receiver or REFUND to sender

  @IsString()
  @IsOptional()
  warningDate?: string;

  @IsString()
  @IsOptional()
  warningTime?: string;

  @IsString()
  @IsNotEmpty()
  notes: string;
}

export class CreateRechargeMethodDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  type: 'PERSONAL' | 'MERCHANT' | 'BANK' | 'API';

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsOptional()
  accountName?: string;

  @IsString()
  @IsOptional()
  bankDetails?: string;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsNumber()
  @IsOptional()
  minAmount?: number;

  @IsNumber()
  @IsOptional()
  maxAmount?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateRechargeMethodDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  type?: 'PERSONAL' | 'MERCHANT' | 'BANK' | 'API';

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  accountName?: string;

  @IsString()
  @IsOptional()
  bankDetails?: string;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsNumber()
  @IsOptional()
  minAmount?: number;

  @IsNumber()
  @IsOptional()
  maxAmount?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class GatewayConfigDto {
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  isLive?: boolean;

  @IsString()
  @IsOptional()
  appKey?: string;

  @IsString()
  @IsOptional()
  appSecret?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  storeId?: string;

  @IsString()
  @IsOptional()
  storePassword?: string;

  @IsString()
  @IsOptional()
  chargeType?: 'PERCENTAGE' | 'FLAT';

  @IsNumber()
  @IsOptional()
  chargeValue?: number;

  @IsNumber()
  @IsOptional()
  minAmount?: number;

  @IsNumber()
  @IsOptional()
  maxAmount?: number;

  @IsString()
  @IsOptional()
  instructions?: string;
}

export class SaveGatewaySettingsDto {
  @IsOptional()
  bkash?: GatewayConfigDto;

  @IsOptional()
  sslcommerz?: GatewayConfigDto;
}

export class InitiateGatewayPaymentDto {
  @IsString()
  @IsNotEmpty()
  gateway: 'BKASH' | 'SSLCOMMERZ';

  @IsNumber()
  @IsPositive()
  @Min(10)
  amount: number;
}

export class ExecuteGatewayPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsString()
  @IsOptional()
  trxId?: string;

  @IsBoolean()
  @IsOptional()
  simulated?: boolean;
}



