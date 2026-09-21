import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus, ProductType } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private sanitizeDescription(html?: string): string | undefined {
    if (!html) return html;
    return sanitizeHtml(html, {
      allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
        'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
        'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'span', 'img', 'u', 's', 'sub', 'sup'
      ],
      allowedAttributes: {
        a: ['href', 'name', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
        '*': ['style', 'class', 'align'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      transformTags: {
        a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
      },
    });
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = this.slugify(title);
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.product.findUnique({
        where: { slug: candidate },
      });
      if (!existing) {
        return candidate;
      }
      candidate = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * User creates a product (Physical or Digital)
   */
  async createProduct(sellerId: string, dto: CreateProductDto) {
    const slug = await this.generateUniqueSlug(dto.title);

    // Fetch auto-approval setting
    const setting = await this.prisma.cmsSection.findUnique({
      where: { sectionKey: 'product_approval_settings' },
    });
    const autoApprove = setting ? setting.isEnabled : true;

    // Check if seller is admin/super_admin
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: sellerId },
      include: { role: true },
    });
    const isAdmin = userRoles.some((ur) => ['ADMIN', 'SUPER_ADMIN'].includes(ur.role.name));

    const initialStatus: ProductStatus = (isAdmin || autoApprove) ? 'ACTIVE' : 'PENDING';

    const product = await this.prisma.product.create({
      data: {
        sellerId,
        categoryId: dto.categoryId,
        title: dto.title.trim(),
        slug,
        productType: dto.productType,
        price: new Prisma.Decimal(dto.price),
        descriptionHtml: this.sanitizeDescription(dto.descriptionHtml) || '',
        status: initialStatus,
        metaTitle: dto.metaTitle || dto.title,
        metaDescription: dto.metaDescription,
        metaKeywords: dto.metaKeywords,
        canonicalUrl: dto.canonicalUrl || null,
        // Images
        ...(dto.images && dto.images.length > 0
          ? {
              images: {
                create: dto.images.map((img, index) => ({
                  imageUrl: img.imageUrl,
                  isMain: img.isMain !== undefined ? img.isMain : index === 0,
                  sortOrder: img.sortOrder || index,
                })),
              },
            }
          : {}),
        // Digital file metadata
        ...(dto.productType === 'DIGITAL_DOWNLOAD' && dto.digitalFile
          ? {
              files: {
                create: {
                  fileName: dto.digitalFile.fileName,
                  fileUrl: dto.digitalFile.fileUrl,
                  fileSize: BigInt(dto.digitalFile.fileSize || 0),
                  mimeType: dto.digitalFile.mimeType || 'application/octet-stream',
                  version: dto.digitalFile.version || '1.0',
                  downloadLimit: dto.digitalFile.downloadLimit || 0,
                },
              },
            }
          : {}),
        // Physical metadata
        ...(dto.productType === 'PHYSICAL' && dto.physicalMeta
          ? {
              physicalMeta: {
                create: {
                  stock: dto.physicalMeta.stock || 0,
                  sku: dto.physicalMeta.sku,
                  weight: dto.physicalMeta.weight ? new Prisma.Decimal(dto.physicalMeta.weight) : null,
                  dimensions: dto.physicalMeta.dimensions,
                  deliveryInfo: dto.physicalMeta.deliveryInfo,
                },
              },
            }
          : {}),
      },
      include: {
        images: true,
        files: true,
        physicalMeta: true,
        category: true,
      },
    });

    return JSON.parse(
      JSON.stringify(product, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }

  /**
   * Update product (Enforces Rule 11: only owner can edit)
   */
  async updateProduct(productId: string, userId: string, isAdmin: boolean, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!isAdmin && product.sellerId !== userId) {
      throw new ForbiddenException('You can only edit your own products');
    }

    // Update images if provided
    if (dto.images && Array.isArray(dto.images)) {
      await this.prisma.productImage.deleteMany({
        where: { productId },
      });
      if (dto.images.length > 0) {
        await this.prisma.productImage.createMany({
          data: dto.images.map((img, idx) => ({
            productId,
            imageUrl: img.imageUrl,
            isMain: img.isMain !== undefined ? img.isMain : idx === 0,
            sortOrder: img.sortOrder !== undefined ? img.sortOrder : idx,
          })),
        });
      }
    }

    // Update physical metadata if provided
    if (dto.physicalMeta) {
      await this.prisma.productPhysicalMeta.upsert({
        where: { productId },
        create: {
          productId,
          stock: dto.physicalMeta.stock || 0,
          sku: dto.physicalMeta.sku || null,
          deliveryInfo: dto.physicalMeta.deliveryInfo || null,
        },
        update: {
          ...(dto.physicalMeta.stock !== undefined ? { stock: dto.physicalMeta.stock } : {}),
          ...(dto.physicalMeta.sku !== undefined ? { sku: dto.physicalMeta.sku } : {}),
          ...(dto.physicalMeta.deliveryInfo !== undefined ? { deliveryInfo: dto.physicalMeta.deliveryInfo } : {}),
        },
      });
    }

    // Sync productType if canonicalUrl was changed or specified
    let targetProductType = dto.productType;
    if (!targetProductType && dto.canonicalUrl) {
      if (dto.canonicalUrl.startsWith('/physical-products')) {
        targetProductType = 'PHYSICAL';
      } else if (
        dto.canonicalUrl.startsWith('/digital-products') ||
        dto.canonicalUrl.startsWith('/money-exchange')
      ) {
        targetProductType = 'DIGITAL_DOWNLOAD';
      }
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...(dto.title && { title: dto.title.trim() }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.price !== undefined && { price: new Prisma.Decimal(dto.price) }),
        ...(dto.descriptionHtml && { descriptionHtml: this.sanitizeDescription(dto.descriptionHtml) }),
        ...(dto.status && (isAdmin || ['ACTIVE', 'INACTIVE'].includes(dto.status))
          ? { status: dto.status }
          : {}),
        ...(targetProductType && { productType: targetProductType }),
        ...(dto.metaTitle && { metaTitle: dto.metaTitle }),
        ...(dto.metaDescription && { metaDescription: dto.metaDescription }),
        ...(dto.metaKeywords && { metaKeywords: dto.metaKeywords }),
        ...(dto.canonicalUrl !== undefined && { canonicalUrl: dto.canonicalUrl }),
      },
      include: { images: true, category: true, physicalMeta: true, files: true },
    });

    return JSON.parse(
      JSON.stringify(updated, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }

  /**
   * Delete or deactivate product
   */
  async deleteProduct(productId: string, userId: string, isAdmin: boolean) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    if (!isAdmin && product.sellerId !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'INACTIVE', deletedAt: new Date() },
    });

    return { message: 'Product deleted/deactivated successfully' };
  }

  /**
   * Get product details by slug
   */
  async getProductBySlug(slug: string) {
    const sellerSelect = {
      id: true,
      uniqueUserId: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      isVerified: true,
      isActive: true,
      deletedAt: true,
      createdAt: true,
    };

    let product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        files: true,
        physicalMeta: true,
        category: true,
        seller: {
          select: sellerSelect,
        },
      },
    });

    // Fallback: If not found by slug, attempt lookup by product id
    if (!product) {
      product = await this.prisma.product.findUnique({
        where: { id: slug },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          files: true,
          physicalMeta: true,
          category: true,
          seller: {
            select: sellerSelect,
          },
        },
      });
    }

    if (
      !product ||
      product.deletedAt !== null ||
      product.status !== 'ACTIVE' ||
      !product.seller?.isActive ||
      product.seller?.deletedAt !== null
    ) {
      throw new NotFoundException('Product not found or seller is inactive');
    }

    // Increment views asynchronously
    await this.prisma.product.update({
      where: { id: product.id },
      data: { viewsCount: { increment: 1 } },
    });

    return JSON.parse(
      JSON.stringify(product, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }

  /**
   * Search and list products with smart bid position promotion (Spec #80, #81)
   */
  async getProducts(params: {
    categorySlug?: string;
    productType?: ProductType;
    search?: string;
    sellerId?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
    sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'views';
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'ACTIVE',
      deletedAt: null,
      seller: {
        isActive: true,
        deletedAt: null,
      },
    };

    if (params.categorySlug) {
      where.category = { slug: params.categorySlug };
    }

    if (params.sellerId) {
      where.sellerId = params.sellerId;
    }

    if (params.search) {
      const q = params.search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: q } },
            { metaTitle: { contains: q } },
            { metaKeywords: { contains: q } },
            { seller: { uniqueUserId: { contains: q } } },
            { seller: { firstName: { contains: q } } },
            { seller: { lastName: { contains: q } } },
          ],
        },
      ];
    }

    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      where.price = {};
      if (params.minPrice !== undefined) where.price.gte = new Prisma.Decimal(params.minPrice);
      if (params.maxPrice !== undefined) where.price.lte = new Prisma.Decimal(params.maxPrice);
    }

    if ((params as any).canonicalUrl) {
      const raw = String((params as any).canonicalUrl).trim();
      const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
      const withoutSlash = withSlash.replace(/^\//, '');
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { canonicalUrl: withSlash },
            { canonicalUrl: withoutSlash },
            { canonicalUrl: `/page${withSlash}` },
          ],
        },
      ];
    } else if (params.productType === 'PHYSICAL') {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { productType: 'PHYSICAL' },
            { canonicalUrl: '/physical-products' },
            { canonicalUrl: 'physical-products' },
          ],
        },
      ];
    } else if (params.productType === 'DIGITAL_DOWNLOAD') {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { productType: 'DIGITAL_DOWNLOAD' },
            { canonicalUrl: '/digital-products' },
            { canonicalUrl: 'digital-products' },
          ],
        },
        {
          NOT: [
            { canonicalUrl: '/money-exchange' },
            { canonicalUrl: 'money-exchange' },
            { canonicalUrl: '/physical-products' },
            { canonicalUrl: 'physical-products' },
          ],
        },
      ];
    } else if (params.productType) {
      where.productType = params.productType;
    }

    // Default sorting order: Newest uploaded product on top (Spec: newly uploaded appears on top)
    let orderBy: any = [{ createdAt: 'desc' }];
    if (params.sortBy === 'newest') orderBy = [{ createdAt: 'desc' }];
    if (params.sortBy === 'oldest') orderBy = [{ createdAt: 'asc' }];
    if (params.sortBy === 'price_asc') orderBy = [{ price: 'asc' }];
    if (params.sortBy === 'price_desc') orderBy = [{ price: 'desc' }];
    if (params.sortBy === 'views') orderBy = [{ viewsCount: 'desc' }];

    // Check active winning bids for boosted positioning
    const bidWhere: any = {
      bidType: 'PRODUCT',
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
      seller: {
        isActive: true,
        deletedAt: null,
      },
    };

    if ((params as any).scope) {
      bidWhere.scope = (params as any).scope;
      if ((params as any).scope === 'CATEGORY' && params.categorySlug) {
        bidWhere.category = { slug: params.categorySlug };
      }
    } else if ((params as any).canonicalUrl === '/money-exchange' || (params as any).canonicalUrl === 'money-exchange') {
      bidWhere.scope = 'MONEY_EXCHANGE';
    } else if (params.categorySlug) {
      bidWhere.scope = 'CATEGORY';
      bidWhere.category = { slug: params.categorySlug };
    } else if (params.productType === 'PHYSICAL') {
      bidWhere.scope = 'PHYSICAL_PRODUCTS';
    } else if (params.productType === 'DIGITAL_DOWNLOAD') {
      bidWhere.scope = 'DIGITAL_PRODUCTS';
    }

    const activeBids = await this.prisma.bid.findMany({
      where: bidWhere,
      orderBy: { targetPosition: 'asc' },
      select: {
        id: true,
        productId: true,
        targetPosition: true,
        bidAmount: true,
        expiresAt: true,
        scope: true,
      },
    });

    const activeBidMap = new Map<string, any>();
    const bidProductIds: string[] = [];
    for (const b of activeBids) {
      if (b.productId && !activeBidMap.has(b.productId)) {
        activeBidMap.set(b.productId, {
          id: b.id,
          targetPosition: b.targetPosition,
          bidAmount: Number(b.bidAmount),
          expiresAt: b.expiresAt,
          scope: b.scope,
        });
        bidProductIds.push(b.productId);
      }
    }

    let bidProducts: any[] = [];
    if (bidProductIds.length > 0) {
      bidProducts = await this.prisma.product.findMany({
        where: {
          ...where,
          id: { in: bidProductIds },
        },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          category: { select: { id: true, name: true, slug: true } },
          seller: {
            select: {
              id: true,
              uniqueUserId: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
      });

      // Sort bid products strictly by targetPosition asc
      bidProducts.sort((a, b) => {
        const posA = activeBidMap.get(a.id)?.targetPosition ?? 999;
        const posB = activeBidMap.get(b.id)?.targetPosition ?? 999;
        return posA - posB;
      });
    }

    const totalMatchingBidProducts = bidProducts.length;

    // Count non-bid products
    const nonBidWhere = {
      ...where,
      ...(bidProductIds.length > 0 ? { id: { notIn: bidProductIds } } : {}),
    };
    const totalNonBid = await this.prisma.product.count({ where: nonBidWhere });
    const total = totalMatchingBidProducts + totalNonBid;

    // Paginate combining bidProducts and nonBidProducts
    const pageItems: any[] = [];

    const bidSliceStart = Math.min(skip, totalMatchingBidProducts);
    const bidSliceEnd = Math.min(skip + limit, totalMatchingBidProducts);
    const bidItemsForPage = bidProducts.slice(bidSliceStart, bidSliceEnd);
    pageItems.push(...bidItemsForPage);

    const remainingNeeded = limit - bidItemsForPage.length;
    if (remainingNeeded > 0) {
      const nonBidSkip = Math.max(0, skip - totalMatchingBidProducts);
      const nonBidItems = await this.prisma.product.findMany({
        where: nonBidWhere,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          category: { select: { id: true, name: true, slug: true } },
          seller: {
            select: {
              id: true,
              uniqueUserId: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
        orderBy,
        skip: nonBidSkip,
        take: remainingNeeded,
      });
      pageItems.push(...nonBidItems);
    }

    // Attach activeBid metadata to each product
    const itemsWithBidInfo = pageItems.map((p) => ({
      ...p,
      activeBid: activeBidMap.get(p.id) || null,
    }));

    return {
      items: itemsWithBidInfo,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Fetch current user's uploaded products (or all products for admin)
   */
  async getMyProducts(sellerId: string, isAdmin: boolean = false) {
    const where: any = { deletedAt: null };
    if (!isAdmin) {
      where.sellerId = sellerId;
    }

    const items = await this.prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        physicalMeta: true,
        files: true,
        seller: {
          select: {
            id: true,
            uniqueUserId: true,
            firstName: true,
            lastName: true,
          },
        },
        bids: { where: { status: 'ACTIVE' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return JSON.parse(
      JSON.stringify(items, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }
}

