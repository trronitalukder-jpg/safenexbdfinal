import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class MicroJobsGuard implements CanActivate {
  constructor(private settingsService: SettingsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isEnabled = await this.settingsService.isMicroJobEnabled();
    if (!isEnabled) {
      throw new ForbiddenException(
        'মাইক্রো জব সার্ভিসটি বর্তমানে সাময়িকভাবে বন্ধ আছে। পরে আবার চেষ্টা করুন। (Micro Job service is currently disabled)',
      );
    }
    return true;
  }
}
