import { IsArray, IsOptional, IsString } from 'class-validator';

export class SubmitMicroJobDto {
  @IsOptional()
  @IsString()
  proofText?: string;

  @IsOptional()
  @IsArray()
  proofScreenshots?: string[];
}
