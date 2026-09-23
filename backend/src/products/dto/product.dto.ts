import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';
import { ProductType, PricingType } from '@prisma/client';

export class ProductImageDto {
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsBoolean()
  @IsOptional()
  isMain?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class DigitalFileDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsNumber()
  @IsOptional()
  downloadLimit?: number;
}

export class PhysicalMetaDto {
  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsString()
  @IsOptional()
  dimensions?: string;

  @IsString()
  @IsOptional()
  deliveryInfo?: string;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsEnum(ProductType)
  @IsNotEmpty()
  productType: ProductType;

  @IsEnum(PricingType)
  @IsOptional()
  pricingType?: PricingType;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsNotEmpty()
  descriptionHtml: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => DigitalFileDto)
  digitalFile?: DigitalFileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PhysicalMetaDto)
  physicalMeta?: PhysicalMetaDto;

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsString()
  @IsOptional()
  metaKeywords?: string;

  @IsString()
  @IsOptional()
  canonicalUrl?: string;


}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsString()
  @IsOptional()
  status?: any;
}

