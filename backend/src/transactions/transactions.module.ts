import { Module, forwardRef } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { CommissionModule } from '../commission/commission.module';
import { ChatModule } from '../chat/chat.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [CommissionModule, ChatModule, forwardRef(() => TelegramModule)],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}

