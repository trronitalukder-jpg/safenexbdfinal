import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import * as path from 'path';
import { UploadsService } from './uploads.service';
import { Public } from '../common/decorators/roles.decorator';

@Controller('uploads')
export class UploadsController {
  constructor(
    private uploadsService: UploadsService,
    private jwtService: JwtService,
  ) {}

  @Public()
  @Post()
  async uploadFile(
    @Body() body: { base64Data: string; fileName: string; folder?: string },
    @Req() req: Request,
  ) {
    const rawFolder = body.folder || 'general';
    const safeFolder = path.basename(rawFolder).replace(/[^a-zA-Z0-9_-]/g, '') || 'general';

    // Allow anonymous uploads ONLY for avatars during user registration
    if (safeFolder !== 'avatars') {
      const authHeader = req.headers['authorization'];
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) {
        throw new UnauthorizedException('Authentication is required to upload files to this folder');
      }
      try {
        await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET || 'safnexbd_super_secret_jwt_access_key_2026_production_grade',
        });
      } catch {
        throw new UnauthorizedException('Invalid or expired authentication token');
      }
    }

    return this.uploadsService.saveBase64File(
      body.base64Data,
      body.fileName,
      safeFolder,
    );
  }
}

