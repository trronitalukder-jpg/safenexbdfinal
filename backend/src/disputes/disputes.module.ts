import { Module, forwardRef } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { ChatModule } from '../chat/chat.module';
import { OperationsModule } from '../operations/operations.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [ChatModule, OperationsModule, forwardRef(() => TelegramModule)],
  controllers: [DisputesController],
  providers: [DisputesService],
  exports: [DisputesService],
})
export class DisputesModule {}

