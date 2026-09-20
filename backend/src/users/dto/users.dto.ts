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
  phone?: string;

  @IsString()
  @IsOptional()
  additionalPhone?: string;

  @IsOptional()
  dateOfBirth?: string | Date;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  division?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  upazila?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  profession?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  institution?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  educationLevel?: string;

  @IsString()
  @IsOptional()
  graduationYear?: string;

  @IsString()
  @IsOptional()
  headline?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  skills?: string;

  @IsString()
  @IsOptional()
  interests?: string;

  @IsString()
  @IsOptional()
  languages?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsOptional()
  socialLinks?: any;

  @IsString()
  @IsOptional()
  businessName?: string;

  @IsString()
  @IsOptional()
  businessType?: string;

  @IsOptional()
  twoFactorEnabled?: boolean;

  @IsString()
  @IsOptional()
  profileVisibility?: string;

  @IsString()
  @IsOptional()
  whoCanMessage?: string;

  @IsOptional()
  showPhone?: boolean;

  @IsOptional()
  showEmail?: boolean;

  @IsOptional()
  showLocation?: boolean;

  @IsOptional()
  showProfession?: boolean;

  @IsOptional()
  showSkills?: boolean;

  @IsOptional()
  showSocialLinks?: boolean;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  nidNumber?: string;

  @IsString()
  @IsOptional()
  nidName?: string;

  @IsString()
  @IsOptional()
  nidFrontUrl?: string;

  @IsString()
  @IsOptional()
  nidBackUrl?: string;
}

export class CreateUserReviewDto {
  @IsNotEmpty()
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
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

