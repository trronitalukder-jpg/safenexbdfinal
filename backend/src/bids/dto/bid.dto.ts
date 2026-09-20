import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BidTypeEnum {
  PRODUCT = 'PRODUCT',
  USER_ID = 'USER_ID',
}

export enum BidScopeEnum {
  CATEGORY = 'CATEGORY',
  HOME_PAGE = 'HOME_PAGE',
  SHOP = 'SHOP',
  DIGITAL_PRODUCTS = 'DIGITAL_PRODUCTS',
  PHYSICAL_PRODUCTS = 'PHYSICAL_PRODUCTS',
  MONEY_EXCHANGE = 'MONEY_EXCHANGE',
}

export class PlaceBidDto {
  @IsOptional()
  @IsEnum(BidTypeEnum)
  bidType?: BidTypeEnum = BidTypeEnum.PRODUCT;

  @IsOptional()
  @IsEnum(BidScopeEnum)
  scope?: BidScopeEnum = BidScopeEnum.CATEGORY;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  targetPosition: number; // e.g. 1, 2, 5

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  bidAmount: number;
}

export class ComboBidItemDto {
  @IsEnum(BidScopeEnum)
  scope: BidScopeEnum;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  targetPosition: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  bidAmount: number;
}

export class PlaceComboBidDto {
  @IsOptional()
  @IsEnum(BidTypeEnum)
  bidType?: BidTypeEnum = BidTypeEnum.PRODUCT;

  @IsOptional()
  @IsString()
  productId?: string;

  bids: ComboBidItemDto[];
}


export class UpdateBidSettingsDto {
  // Rate parity
  @IsOptional()
  @IsBoolean()
  isSameBidRateForHomeAndShop?: boolean;

  // Base product rates
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  productMinBid?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  productExtraIncrement?: number;

  // User ID rates
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  userMinBid?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  userExtraIncrement?: number;

  // Home Page rates
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  homePageMinBid?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  homePageExtraIncrement?: number;

  // Shop Page rates
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  shopMinBid?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  shopExtraIncrement?: number;

  // Digital Products Page rates
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  digitalMinBid?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  digitalExtraIncrement?: number;

  // Physical Products Page rates
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  physicalMinBid?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  physicalExtraIncrement?: number;

  // Money Exchange Page rates
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  moneyExchangeMinBid?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  moneyExchangeExtraIncrement?: number;

  // Notification toggle
  @IsOptional()
  @IsBoolean()
  enableOutbidNotification?: boolean;

  // Home Page display limits & toggles
  @IsOptional()
  @IsBoolean()
  showShopProducts?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  shopProductsCount?: number;

  @IsOptional()
  @IsBoolean()
  showDigitalProducts?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  digitalProductsCount?: number;

  @IsOptional()
  @IsBoolean()
  showPhysicalProducts?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  physicalProductsCount?: number;

  @IsOptional()
  @IsBoolean()
  showMoneyExchange?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  moneyExchangeCount?: number;

  @IsOptional()
  @IsBoolean()
  showUsers?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  usersCount?: number;

  // New Base & Extra rate fields
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  homeBaseRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  homeExtraRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  shopBaseRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  shopExtraRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  categoryBaseRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  categoryExtraRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  userHomeBaseRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  userHomeExtraRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  userDirBaseRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  userDirExtraRate?: number;



  // Sequence order & styling
  @IsOptional()
  sectionOrder?: string[];

  @IsOptional()
  layoutStyles?: Record<string, string>;

  @IsOptional()
  sectionTitles?: Record<string, any>;
}
