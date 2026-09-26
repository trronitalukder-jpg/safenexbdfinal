import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateMicroJobDto {
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsArray()
  steps: string[];

  @IsArray()
  proofRequirements: string[];

  @IsNumber()
  @Min(0.5)
  rewardPerWorker: number;

  @IsNumber()
  @Min(1)
  totalWorkersNeeded: number;

  @IsOptional()
  @IsBoolean()
  minKycRequired?: boolean;

  @IsOptional()
  @IsNumber()
  autoApproveHours?: number;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
