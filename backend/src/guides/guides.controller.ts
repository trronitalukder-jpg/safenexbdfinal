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
import { GuidesService } from './guides.service';
import { CreateGuideDto, UpdateGuideDto } from './dto/guide.dto';
import { Public, Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller()
export class GuidesController {
  constructor(private guidesService: GuidesService) {}

  // ---------------- Public Endpoints ----------------

  @Public()
  @Get('guides')
  async getAllPublic() {
    return this.guidesService.getAllPublic();
  }

  @Public()
  @Get('guides/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.guidesService.getBySlug(slug);
  }

  // ---------------- Admin Endpoints ----------------

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')
  @Get('admin/guides')
  async getAllAdmin() {
    return this.guidesService.getAllAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')
  @Post('admin/guides')
  async create(@Body() dto: CreateGuideDto) {
    return this.guidesService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')
  @Patch('admin/guides/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateGuideDto) {
    return this.guidesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')
  @Patch('admin/guides/:id/toggle')
  async toggleActive(@Param('id') id: string) {
    return this.guidesService.toggleActive(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')
  @Delete('admin/guides/:id')
  async delete(@Param('id') id: string) {
    return this.guidesService.delete(id);
  }
}

