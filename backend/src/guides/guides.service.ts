import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuideDto, UpdateGuideDto } from './dto/guide.dto';

@Injectable()
export class GuidesService {
  constructor(private prisma: PrismaService) {}

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    const baseSlug = this.slugify(title) || 'guide';
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.guide.findUnique({
        where: { slug: candidate },
      });
      if (!existing || (excludeId && existing.id === excludeId)) {
        return candidate;
      }
      candidate = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * Public: List all active guides ordered by sortOrder then createdAt
   */
  async getAllPublic() {
    return this.prisma.guide.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Public: Get single guide by slug or ID, and increment viewsCount
   */
  async getBySlug(slugOrId: string) {
    let guide = await this.prisma.guide.findUnique({
      where: { slug: slugOrId },
    });

    if (!guide) {
      guide = await this.prisma.guide.findUnique({
        where: { id: slugOrId },
      });
    }

    if (!guide) {
      throw new NotFoundException('Guide not found');
    }

    // Increment views asynchronously
    await this.prisma.guide.update({
      where: { id: guide.id },
      data: { viewsCount: { increment: 1 } },
    });

    return { ...guide, viewsCount: guide.viewsCount + 1 };
  }

  /**
   * Admin: List all guides (both active and inactive)
   */
  async getAllAdmin() {
    return this.prisma.guide.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Admin: Create a new guide
   */
  async create(dto: CreateGuideDto) {
    const slug = dto.slug?.trim()
      ? await this.generateUniqueSlug(dto.slug.trim())
      : await this.generateUniqueSlug(dto.title);

    return this.prisma.guide.create({
      data: {
        title: dto.title.trim(),
        slug,
        coverImage: dto.coverImage?.trim() || null,
        youtubeUrl: dto.youtubeUrl?.trim() || null,
        description: dto.description,
        sortOrder: dto.sortOrder !== undefined ? Number(dto.sortOrder) : 0,
        isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
      },
    });
  }

  /**
   * Admin: Update an existing guide
   */
  async update(id: string, dto: UpdateGuideDto) {
    const existing = await this.prisma.guide.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Guide not found');
    }

    let slug = existing.slug;
    if (dto.slug && dto.slug.trim() !== existing.slug) {
      slug = await this.generateUniqueSlug(dto.slug.trim(), id);
    } else if (dto.title && dto.title.trim() !== existing.title && !dto.slug) {
      slug = await this.generateUniqueSlug(dto.title.trim(), id);
    }

    return this.prisma.guide.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        slug,
        ...(dto.coverImage !== undefined && { coverImage: dto.coverImage?.trim() || null }),
        ...(dto.youtubeUrl !== undefined && { youtubeUrl: dto.youtubeUrl?.trim() || null }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sortOrder !== undefined && { sortOrder: Number(dto.sortOrder) }),
        ...(dto.isActive !== undefined && { isActive: Boolean(dto.isActive) }),
      },
    });
  }

  /**
   * Admin: Toggle Active/Inactive status
   */
  async toggleActive(id: string) {
    const existing = await this.prisma.guide.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Guide not found');
    }

    return this.prisma.guide.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
  }

  /**
   * Admin: Delete a guide
   */
  async delete(id: string) {
    const existing = await this.prisma.guide.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Guide not found');
    }

    await this.prisma.guide.delete({ where: { id } });
    return { success: true, message: 'Guide deleted successfully' };
  }
}

