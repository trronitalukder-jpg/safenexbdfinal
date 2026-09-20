import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { CommissionModule } from '../commission/commission.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [CommissionModule, ChatModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}

