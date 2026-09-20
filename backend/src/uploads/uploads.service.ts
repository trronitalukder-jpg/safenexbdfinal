import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.pdf',
  '.zip',
]);

const AVATAR_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const AVATAR_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
]);

@Injectable()
export class UploadsService {
  private uploadDir = path.resolve(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveBase64File(base64Data: string, originalName: string, folder = 'general') {
    if (!base64Data || typeof base64Data !== 'string') {
      throw new BadRequestException('Invalid base64 string format');
    }

    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/s);
    if (!matches || matches.length !== 3) {
      throw new BadRequestException('Invalid base64 string format');
    }

    const mimeType = matches[1].toLowerCase().trim();
    const buffer = Buffer.from(matches[2], 'base64');

    // Strict path traversal prevention: strip any directory components
    const safeFolder = path.basename(folder).replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
    const targetFolder = path.resolve(this.uploadDir, safeFolder);

    // Verify folder is strictly within uploadDir
    if (!targetFolder.startsWith(this.uploadDir)) {
      throw new BadRequestException('Invalid upload directory path');
    }

    // Determine and validate extension
    let ext = path.extname(originalName).toLowerCase();
    if (!ext) {
      if (mimeType === 'image/jpeg') ext = '.jpg';
      else if (mimeType === 'image/png') ext = '.png';
      else if (mimeType === 'image/webp') ext = '.webp';
      else if (mimeType === 'image/gif') ext = '.gif';
      else if (mimeType === 'application/pdf') ext = '.pdf';
      else if (mimeType.includes('zip')) ext = '.zip';
    }

    // Avatar folder has stricter checks
    if (safeFolder === 'avatars') {
      if (!AVATAR_MIME_TYPES.has(mimeType) || !AVATAR_EXTENSIONS.has(ext)) {
        throw new BadRequestException('Avatar must be a valid image file (JPEG, PNG, WebP)');
      }
      if (buffer.length > 5 * 1024 * 1024) {
        throw new BadRequestException('Avatar exceeds maximum allowed size (5MB)');
      }
    } else {
      // General upload check
      if (!ALLOWED_MIME_TYPES.has(mimeType) || !ALLOWED_EXTENSIONS.has(ext)) {
        throw new BadRequestException('File type not allowed. Supported: JPG, PNG, WebP, GIF, PDF, ZIP');
      }

      const maxBytes = (parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10)) * 1024 * 1024;
      if (buffer.length > maxBytes) {
        throw new BadRequestException(`File exceeds maximum allowed size (${process.env.MAX_FILE_SIZE_MB || '25'}MB)`);
      }
    }

    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    // Use cryptographically random filename
    const randomHex = crypto.randomBytes(12).toString('hex');
    const filename = `${Date.now()}-${randomHex}${ext}`;
    const filePath = path.join(targetFolder, filename);

    await fs.promises.writeFile(filePath, buffer);

    const relativeUrl = `/uploads/${safeFolder}/${filename}`;

    return {
      fileName: filename,
      fileUrl: relativeUrl,
      url: relativeUrl,
      fileSize: buffer.length,
      mimeType,
    };
  }
}

