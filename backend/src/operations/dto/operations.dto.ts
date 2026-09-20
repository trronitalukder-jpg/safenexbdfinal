import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateDutyStatusDto {
  @IsEnum(['ON_DUTY', 'ON_BREAK', 'OFF_DUTY'])
  dutyStatus: 'ON_DUTY' | 'ON_BREAK' | 'OFF_DUTY';

  @IsOptional()
  @IsString()
  department?: string; // FINANCE_WITHDRAWAL, FINANCE_RECHARGE, DISPUTE, GENERAL
}

export class ClaimTaskDto {
  @IsEnum(['WITHDRAWAL', 'RECHARGE', 'DISPUTE'])
  taskType: 'WITHDRAWAL' | 'RECHARGE' | 'DISPUTE';

  @IsOptional()
  @IsString()
  taskId?: string;
}

export class ReassignTaskDto {
  @IsEnum(['WITHDRAWAL', 'RECHARGE', 'DISPUTE'])
  taskType: 'WITHDRAWAL' | 'RECHARGE' | 'DISPUTE';

  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsOptional()
  @IsString()
  toStaffId?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class EscalateTaskDto {
  @IsEnum(['WITHDRAWAL', 'RECHARGE', 'DISPUTE'])
  taskType: 'WITHDRAWAL' | 'RECHARGE' | 'DISPUTE';

  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ReleaseTaskDto {
  @IsEnum(['WITHDRAWAL', 'RECHARGE', 'DISPUTE'])
  taskType: 'WITHDRAWAL' | 'RECHARGE' | 'DISPUTE';

  @IsString()
  @IsNotEmpty()
  taskId: string;
}

