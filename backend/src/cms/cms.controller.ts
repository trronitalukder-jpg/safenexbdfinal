import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CmsService } from './cms.service';
import { Public, Roles, Permissions } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';

@Controller('cms')
export class CmsController {
  constructor(private cmsService: CmsService) {}

  @Public()
  @Get('sliders')
  async getActiveSliders() {
    return this.cmsService.getActiveSliders();
  }

  @Public()
  @Get('sections')
  async getSections() {
    return this.cmsService.getHomepageSections();
  }

  @Public()
  @Get('pages')
  async getPublicPages() {
    return this.cmsService.getAllPages();
  }

  @Public()
  @Get('pages/:slug')
  async getPage(@Param('slug') slug: string) {
    return this.cmsService.getPageBySlug(slug);
  }

  @Public()
  @Get('menus/:location')
  async getMenu(@Param('location') location: string) {
    return this.cmsService.getMenu(location);
  }

  // ---------------- Admin Endpoints ----------------

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')
  @Permissions('CMS_EDIT')
  @Get('admin/sliders')
  async getAllSliders() {
    return this.cmsService.getAllSliders();
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')
  @Permissions('CMS_EDIT')
  @Post('admin/sliders')
  async saveSlider(@Body() data: any) {
    return this.cmsService.saveSlider(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')
  @Permissions('CMS_EDIT')
  @Delete('admin/sliders/:id')
  async deleteSlider(@Param('id') id: string) {
    return this.cmsService.deleteSlider(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')
  @Permissions('CMS_EDIT')
  @Get('admin/sections')
  async getAllSections() {
    return this.cmsService.getAllSections();
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')
  @Permissions('CMS_EDIT')
  @Patch('admin/sections/:id')
  async updateSection(@Param('id') id: string, @Body() data: any) {
    return this.cmsService.updateSection(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')
  @Permissions('CMS_EDIT')
  @Get('admin/pages')
  async getAllPages() {
    return this.cmsService.getAllPages();
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')
  @Permissions('CMS_EDIT')
  @Post('admin/pages')
  async savePage(@Body() data: any) {
    return this.cmsService.savePage(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')
  @Permissions('CMS_EDIT')
  @Delete('admin/pages/:id')
  async deletePage(@Param('id') id: string) {
    return this.cmsService.deletePage(id);
  }

  // ---------------- Admin Menus ----------------

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')
  @Permissions('CMS_EDIT')
  @Get('admin/menus/:location')
  async getAdminMenu(@Param('location') location: string) {
    return this.cmsService.getMenu(location);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')
  @Permissions('CMS_EDIT')
  @Post('admin/menu-items')
  async createMenuItem(@Body() data: any) {
    return this.cmsService.createMenuItem(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')
  @Permissions('CMS_EDIT')
  @Patch('admin/menu-items/:id')
  async updateMenuItem(@Param('id') id: string, @Body() data: any) {
    return this.cmsService.updateMenuItem(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')
  @Permissions('CMS_EDIT')
  @Delete('admin/menu-items/:id')
  async deleteMenuItem(@Param('id') id: string) {
    return this.cmsService.deleteMenuItem(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')
  @Permissions('CMS_EDIT')
  @Post('admin/menus/:location/reset')
  async resetMenu(@Param('location') location: string) {
    return this.cmsService.resetDefaultHeaderMenu();
  }
}

