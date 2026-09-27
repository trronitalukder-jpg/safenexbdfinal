import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';

import { getJwtSecret } from '../common/config/jwt.config';

@Module({
  imports: [
    JwtModule.register({
      secret: getJwtSecret(),
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}

