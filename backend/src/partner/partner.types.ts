import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePartnerAppDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  allowedDomains?: string;

  @IsString()
  @IsOptional()
  webhookUrl?: string;

  @IsBoolean()
  @IsOptional()
  isLiveMode?: boolean;
}

export class UpdatePartnerAppDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  allowedDomains?: string;

  @IsString()
  @IsOptional()
  webhookUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isLiveMode?: boolean;
}

export class PartnerAuthSessionDto {
  @IsString()
  @IsNotEmpty()
  partnerUserId!: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class PartnerRechargeDto {
  @IsString()
  @IsOptional()
  partnerUserId?: string;

  @IsNumber()
  amount!: number;

  @IsString()
  @IsOptional()
  method?: 'BKASH' | 'SSLCOMMERZ';

  @IsString()
  @IsOptional()
  callbackUrl?: string;
}

export class PartnerWithdrawDto {
  @IsString()
  @IsOptional()
  partnerUserId?: string;

  @IsNumber()
  amount!: number;

  @IsString()
  method!: string;

  @IsString()
  destinationAccount!: string;

  @IsString()
  @IsOptional()
  accountType?: 'PERSONAL' | 'AGENT' | 'BANK';

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
}

export class PartnerSendOtpDto {
  @IsString()
  @IsOptional()
  partnerUserId?: string;

  @IsNumber()
  amount!: number;

  @IsString()
  @IsOptional()
  destination?: string;
}

export class PartnerEscrowCreateDto {
  @IsString()
  @IsNotEmpty()
  buyerPartnerUserId!: string;

  @IsString()
  @IsNotEmpty()
  sellerPartnerUserId!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  terms?: string;
}

export class PartnerEscrowReleaseDto {
  @IsString()
  @IsNotEmpty()
  dealId!: string;

  @IsString()
  @IsOptional()
  partnerUserId?: string;
}

export class PartnerSendMessageDto {
  @IsString()
  @IsOptional()
  partnerUserId?: string;

  @IsString()
  @IsOptional()
  recipientPartnerUserId?: string;

  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}

export type WebhookEventType =
  | 'WALLET_RECHARGE_SUCCESS'
  | 'WITHDRAWAL_SUBMITTED'
  | 'WITHDRAWAL_APPROVED'
  | 'WITHDRAWAL_REJECTED'
  | 'ESCROW_DEAL_CREATED'
  | 'ESCROW_DEAL_COMPLETED'
  | 'CHAT_MESSAGE_RECEIVED';

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: number;
  appId: string;
  data: Record<string, any>;
}

export class PartnerApplyDto {
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @IsString()
  @IsNotEmpty()
  websiteUrl!: string;

  @IsString()
  @IsNotEmpty()
  applicantName!: string;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsOptional()
  techStack?: string;

  @IsString()
  @IsOptional()
  useCase?: string;

  @IsString()
  @IsOptional()
  monthlyVolume?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}


