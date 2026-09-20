import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CmsService {
  constructor(private prisma: PrismaService) {}

  // ---------------- Sliders ----------------
  async getActiveSliders() {
    return this.prisma.slider.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getAllSliders() {
    return this.prisma.slider.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async saveSlider(data: any) {
    if (data.id) {
      return this.prisma.slider.update({
        where: { id: data.id },
        data: {
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          imageUrl: data.imageUrl,
          buttonText: data.buttonText,
          buttonLink: data.buttonLink,
          sortOrder: data.sortOrder || 0,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      });
    }

    return this.prisma.slider.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        imageUrl: data.imageUrl,
        buttonText: data.buttonText,
        buttonLink: data.buttonLink,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async deleteSlider(id: string) {
    return this.prisma.slider.delete({ where: { id } });
  }

  // ---------------- Homepage Sections ----------------
  async getHomepageSections() {
    return this.prisma.cmsSection.findMany({
      where: { isEnabled: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getAllSections() {
    return this.prisma.cmsSection.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updateSection(id: string, data: any) {
    return this.prisma.cmsSection.update({
      where: { id },
      data: {
        title: data.title,
        subtitle: data.subtitle,
        content: data.content,
        sortOrder: data.sortOrder,
        isEnabled: data.isEnabled,
      },
    });
  }

  // ---------------- Menus ----------------
  async getMenu(location: any) {
    const loc = (location || 'HEADER').toUpperCase();
    let menu = await this.prisma.menu.findUnique({
      where: { location: loc as any },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            children: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!menu) {
      menu = await this.prisma.menu.create({
        data: {
          location: loc as any,
          name: loc === 'HEADER' ? 'Main Navigation' : `${loc} Menu`,
        },
        include: {
          items: {
            include: {
              children: true,
            },
          },
        },
      });
    }

    // Auto seed default items for HEADER if empty
    if (loc === 'HEADER' && (!menu.items || menu.items.length === 0)) {
      await this.seedDefaultHeaderMenu(menu.id);
      menu = await this.prisma.menu.findUnique({
        where: { location: loc as any },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              children: {
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      }) as any;
    }

    // Filter top-level items (parentId === null) with their children
    const topItems = (menu?.items || []).filter((item: any) => !item.parentId);
    return {
      ...menu,
      items: topItems,
    };
  }

  async seedDefaultHeaderMenu(menuId: string) {
    // 1. Home
    await this.prisma.menuItem.create({
      data: { menuId, title: 'Home', url: '/', sortOrder: 0, isActive: true },
    });

    // 2. Products (with sub-items)
    const productsMenu = await this.prisma.menuItem.create({
      data: { menuId, title: 'Products', url: '/products', sortOrder: 1, isActive: true },
    });

    await this.prisma.menuItem.create({
      data: {
        menuId,
        parentId: productsMenu.id,
        title: 'Digital Products',
        url: '/digital-products',
        sortOrder: 0,
        isActive: true,
      },
    });

    await this.prisma.menuItem.create({
      data: {
        menuId,
        parentId: productsMenu.id,
        title: 'Physical Products',
        url: '/physical-products',
        sortOrder: 1,
        isActive: true,
      },
    });

    // 3. Money Exchange
    await this.prisma.menuItem.create({
      data: { menuId, title: 'Money Exchange', url: '/money-exchange', sortOrder: 2, isActive: true },
    });

    // 4. Safe Transactions
    await this.prisma.menuItem.create({
      data: { menuId, title: 'Safe Transactions', url: '/transactions', sortOrder: 3, isActive: true },
    });

    // 5. Users
    await this.prisma.menuItem.create({
      data: { menuId, title: 'Users', url: '/users', sortOrder: 4, isActive: true },
    });
  }

  async resetDefaultHeaderMenu() {
    let menu = await this.prisma.menu.findUnique({
      where: { location: 'HEADER' },
    });
    if (!menu) {
      menu = await this.prisma.menu.create({
        data: { location: 'HEADER', name: 'Main Navigation' },
      });
    }

    await this.prisma.menuItem.deleteMany({
      where: { menuId: menu.id },
    });

    await this.seedDefaultHeaderMenu(menu.id);
    return this.getMenu('HEADER');
  }

  async createMenuItem(data: {
    menuId?: string;
    location?: any;
    parentId?: string | null;
    title: string;
    url: string;
    icon?: string;
    sortOrder?: number;
    isExternal?: boolean;
    isActive?: boolean;
  }) {
    let targetMenuId = data.menuId;
    if (!targetMenuId) {
      const loc = (data.location || 'HEADER').toUpperCase();
      let menu = await this.prisma.menu.findUnique({ where: { location: loc as any } });
      if (!menu) {
        menu = await this.prisma.menu.create({
          data: { location: loc as any, name: `${loc} Menu` },
        });
      }
      targetMenuId = menu.id;
    }

    return this.prisma.menuItem.create({
      data: {
        menuId: targetMenuId,
        parentId: data.parentId || null,
        title: data.title,
        url: data.url,
        icon: data.icon || null,
        sortOrder: Number(data.sortOrder) || 0,
        isExternal: Boolean(data.isExternal),
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
      include: {
        children: true,
      },
    });
  }

  async updateMenuItem(id: string, data: any) {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.sortOrder !== undefined) updateData.sortOrder = Number(data.sortOrder);
    if (data.isExternal !== undefined) updateData.isExternal = Boolean(data.isExternal);
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
    if (data.parentId !== undefined) updateData.parentId = data.parentId || null;

    return this.prisma.menuItem.update({
      where: { id },
      data: updateData,
      include: {
        children: true,
      },
    });
  }

  async deleteMenuItem(id: string) {
    // Delete any children first
    await this.prisma.menuItem.deleteMany({
      where: { parentId: id },
    });
    return this.prisma.menuItem.delete({
      where: { id },
    });
  }

  // ---------------- Static CMS Pages ----------------
  async getPageBySlug(slug: string) {
    const normalizedSlug = (slug || '').toLowerCase().trim();
    let page = await this.prisma.cmsPage.findUnique({
      where: { slug: normalizedSlug, isPublished: true },
    });

    if (!page) {
      const aliasMap: Record<string, string[]> = {
        terms: ['terms-conditions', 'terms-and-conditions'],
        'terms-conditions': ['terms'],
        privacy: ['privacy-policy'],
        'privacy-policy': ['privacy'],
        contact: ['contact-us', 'contact-support'],
        'contact-us': ['contact'],
        'dispute-policy': ['dispute', 'disputes'],
        dispute: ['dispute-policy'],
        'escrow-rules': ['escrow-policy', 'terms-conditions', 'terms'],
        faq: ['faqs', 'help'],
      };

      const fallbackSlugs = aliasMap[normalizedSlug] || [];
      for (const altSlug of fallbackSlugs) {
        page = await this.prisma.cmsPage.findUnique({
          where: { slug: altSlug, isPublished: true },
        });
        if (page) break;
      }
    }

    if (!page) {
      throw new NotFoundException('Page not found');
    }
    return page;
  }

  async getAllPages() {
    return this.prisma.cmsPage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async savePage(data: any) {
    if (data.id) {
      return this.prisma.cmsPage.update({
        where: { id: data.id },
        data: {
          title: data.title,
          contentHtml: data.contentHtml,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          isPublished: data.isPublished,
        },
      });
    }

    return this.prisma.cmsPage.create({
      data: {
        title: data.title,
        slug: data.slug,
        contentHtml: data.contentHtml,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
      },
    });
  }

  async deletePage(id: string) {
    return this.prisma.cmsPage.delete({
      where: { id },
    });
  }
}

