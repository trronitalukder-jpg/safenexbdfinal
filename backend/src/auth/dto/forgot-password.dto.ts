import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  uniqueUserId: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

