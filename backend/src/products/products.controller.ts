import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Public()
  @Get()
  async getProducts(
    @Query('category') categorySlug?: string,
    @Query('type') type?: any,
    @Query('productType') pType?: any,
    @Query('search') search?: string,
    @Query('sellerId') sellerId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: any,
    @Query('canonicalUrl') canonicalUrl?: string,
    @Query('scope') scope?: string,
  ) {
    const productType = pType || type;
    return this.productsService.getProducts({
      categorySlug,
      productType,
      search,
      sellerId,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      sortBy,
      canonicalUrl,
      scope,
    } as any);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-products')
  async getMyProducts(
    @CurrentUser('id') sellerId: string,
    @CurrentUser('roles') roles: string[],
  ) {
    const isAdmin = Array.isArray(roles) && roles.some((r) => ['ADMIN', 'SUPER_ADMIN'].includes(r));
    return this.productsService.getMyProducts(sellerId, isAdmin);
  }

  @Public()
  @Get('home-feed')
  async getHomeFeed() {
    return this.productsService.getHomeFeed();
  }

  @Public()
  @Get(':slug')
  async getProductBySlug(@Param('slug') slug: string) {
    return this.productsService.getProductBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createProduct(
    @CurrentUser('id') sellerId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.createProduct(sellerId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateProduct(
    @Param('id') productId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('roles') roles: string[],
    @Body() dto: UpdateProductDto,
  ) {
    const isAdmin = roles && (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN'));
    return this.productsService.updateProduct(productId, userId, isAdmin, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteProduct(
    @Param('id') productId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('roles') roles: string[],
  ) {
    const isAdmin = roles && (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN'));
    return this.productsService.deleteProduct(productId, userId, isAdmin);
  }
}

