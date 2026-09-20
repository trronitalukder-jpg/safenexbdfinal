import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'safnexbd_super_secret_jwt_access_key_2026_production_grade',
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}

