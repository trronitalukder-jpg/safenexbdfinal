import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { GatewayService } from './gateway.service';
import { ChatModule } from '../chat/chat.module';
import { SettingsModule } from '../settings/settings.module';
import { OperationsModule } from '../operations/operations.module';

@Module({
  imports: [ChatModule, SettingsModule, OperationsModule],
  controllers: [WalletController],
  providers: [WalletService, GatewayService],
  exports: [WalletService, GatewayService],
})
export class WalletModule {}
