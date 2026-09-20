import { Module } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { ChatModule } from '../chat/chat.module';
import { OperationsModule } from '../operations/operations.module';

@Module({
  imports: [ChatModule, OperationsModule],
  controllers: [DisputesController],
  providers: [DisputesService],
  exports: [DisputesService],
})
export class DisputesModule {}

