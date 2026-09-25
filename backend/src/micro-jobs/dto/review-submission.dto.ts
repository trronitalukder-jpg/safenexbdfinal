import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReviewSubmissionDto {
  @IsNotEmpty()
  @IsIn(['APPROVE', 'REJECT'])
  action: 'APPROVE' | 'REJECT';

  @IsOptional()
  @IsString()
  rejectReason?: string;
}
