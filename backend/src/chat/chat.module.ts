import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { TelegramModule } from '../telegram/telegram.module';

import { getJwtSecret } from '../common/config/jwt.config';

@Module({
  imports: [
    JwtModule.register({
      secret: getJwtSecret(),
    }),
    forwardRef(() => TelegramModule),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}

