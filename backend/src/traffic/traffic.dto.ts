import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class TrafficPingDto {
  @IsNotEmpty()
  @IsString()
  visitorId: string; // Persistent visitor ID

  @IsNotEmpty()
  @IsString()
  pagePath: string;

  @IsOptional()
  @IsString()
  pageTitle?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  utmSource?: string;

  @IsOptional()
  @IsString()
  utmMedium?: string;

  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @IsOptional()
  @IsNumber()
  dwellSeconds?: number;

  @IsOptional()
  @IsNumber()
  activeSeconds?: number;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsString()
  browser?: string;

  @IsOptional()
  @IsString()
  os?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class TrafficEventDto {
  @IsNotEmpty()
  @IsString()
  visitorId: string;

  @IsNotEmpty()
  @IsString()
  eventType: string;

  @IsNotEmpty()
  @IsString()
  eventName: string;

  @IsOptional()
  @IsString()
  pagePath?: string;

  @IsOptional()
  metadata?: any;
}

export class BlockIpDto {
  @IsNotEmpty()
  @IsString()
  ipAddress: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
