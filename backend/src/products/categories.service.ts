import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper to slugify category name
   */
  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  /**
   * Get entire category tree (hierarchical)
   */
  async getCategoryTree(includeInactive = true) {
    const where: any = { parentId: null };
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prisma.category.findMany({
      where,
      include: {
        children: {
          include: {
            children: true,
            _count: { select: { products: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { products: true, children: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get all categories flat list
   */
  async getAllCategories() {
    return this.prisma.category.findMany({
      include: {
        parent: true,
        children: {
          include: {
            _count: { select: { products: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { products: true, children: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: true,
        parent: true,
        products: {
          where: { status: 'ACTIVE' },
          include: {
            seller: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
            images: { where: { isMain: true }, take: 1 },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category ${slug} not found`);
    }

    return category;
  }

  /**
   * Admin: Create Category (Rule 10)
   */
  async createCategory(dto: CreateCategoryDto) {
    let slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);
    if (!slug) {
      slug = `cat-${Date.now()}`;
    }

    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    return this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        slug,
        parentId: dto.parentId && dto.parentId.trim() ? dto.parentId.trim() : null,
        icon: dto.icon || null,
        bannerUrl: dto.bannerUrl || null,
        commissionRate: dto.commissionRate !== undefined && dto.commissionRate !== null ? Number(dto.commissionRate) : null,
        commissionFlat: dto.commissionFlat !== undefined && dto.commissionFlat !== null ? Number(dto.commissionFlat) : null,
        isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
        sortOrder: dto.sortOrder ? Number(dto.sortOrder) : 0,
        metaTitle: dto.metaTitle || null,
        metaDescription: dto.metaDescription || null,
        metaKeywords: dto.metaKeywords || null,
      },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  /**
   * Admin: Update Category
   */
  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    let slug = dto.slug ? this.slugify(dto.slug) : undefined;
    if (slug && slug !== category.slug) {
      const existing = await this.prisma.category.findUnique({ where: { slug } });
      if (existing) {
        slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
      }
    }

    // Prevent category from being its own parent
    if (dto.parentId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(slug && { slug }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId && dto.parentId.trim() ? dto.parentId.trim() : null }),
        ...(dto.icon !== undefined && { icon: dto.icon || null }),
        ...(dto.bannerUrl !== undefined && { bannerUrl: dto.bannerUrl || null }),
        ...(dto.commissionRate !== undefined && {
          commissionRate: dto.commissionRate !== null ? Number(dto.commissionRate) : null,
        }),
        ...(dto.commissionFlat !== undefined && {
          commissionFlat: dto.commissionFlat !== null ? Number(dto.commissionFlat) : null,
        }),
        ...(dto.isActive !== undefined && { isActive: Boolean(dto.isActive) }),
        ...(dto.sortOrder !== undefined && { sortOrder: Number(dto.sortOrder) }),
        ...(dto.metaTitle !== undefined && { metaTitle: dto.metaTitle || null }),
        ...(dto.metaDescription !== undefined && { metaDescription: dto.metaDescription || null }),
      },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  /**
   * Admin: Delete Category & Subcategories
   */
  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const categoryIds = [id, ...category.children.map((c) => c.id)];
    const productsCount = await this.prisma.product.count({
      where: { categoryId: { in: categoryIds } },
    });

    if (productsCount > 0) {
      throw new BadRequestException(
        `Cannot delete category: ${productsCount} product(s) are linked to this category or its subcategories.`,
      );
    }

    // Delete translations and children if any, then category
    await this.prisma.$transaction([
      this.prisma.categoryTranslation.deleteMany({
        where: { categoryId: { in: categoryIds } },
      }),
      this.prisma.category.deleteMany({
        where: { parentId: id },
      }),
      this.prisma.category.delete({
        where: { id },
      }),
    ]);

    return { message: 'Category deleted successfully' };
  }
}

