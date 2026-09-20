import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CommissionCalculationParams {
  amount: number | Prisma.Decimal;
  type?: 'TRANSACTION' | 'RECHARGE' | 'WITHDRAW';
  categorySlug?: string;
  productType?: 'PHYSICAL' | 'DIGITAL_DOWNLOAD';
  transactionType?: 'PHYSICAL_PRODUCT' | 'DIGITAL_PRODUCT' | 'SERVICE' | 'MONEY_EXCHANGE' | 'GENERAL_TRANSACTION';
}

@Injectable()
export class CommissionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get 3 core platform commission settings: Recharge, Withdraw, and Transaction
   */
  async getCoreSettings() {
    const settings = await this.prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['COMMISSION_RECHARGE', 'COMMISSION_WITHDRAW', 'COMMISSION_TRANSACTION'],
        },
      },
    });

    const map = new Map<string, any>();
    for (const s of settings) {
      map.set(s.key, s.value);
    }

    // Default fallback values
    const defaultRecharge = {
      rateType: 'PERCENTAGE',
      value: 0,
      isActive: true,
      minFee: 0,
      maxFee: 0,
    };
    const defaultWithdraw = {
      rateType: 'PERCENTAGE',
      value: 1.5,
      isActive: true,
      minFee: 5,
      maxFee: 100,
    };
    const defaultTransaction = {
      rateType: 'PERCENTAGE',
      value: 5,
      isActive: true,
      minFee: 0,
      maxFee: 0,
    };

    return {
      recharge: map.get('COMMISSION_RECHARGE') || defaultRecharge,
      withdraw: map.get('COMMISSION_WITHDRAW') || defaultWithdraw,
      transaction: map.get('COMMISSION_TRANSACTION') || defaultTransaction,
    };
  }

  /**
   * Save or update core platform commission settings (Recharge, Withdraw, Transaction)
   */
  async saveCoreSettings(
    dto: {
      recharge?: { rateType: 'PERCENTAGE' | 'FLAT'; value: number; isActive?: boolean; minFee?: number; maxFee?: number };
      withdraw?: { rateType: 'PERCENTAGE' | 'FLAT'; value: number; isActive?: boolean; minFee?: number; maxFee?: number };
      transaction?: { rateType: 'PERCENTAGE' | 'FLAT'; value: number; isActive?: boolean; minFee?: number; maxFee?: number };
    },
    adminId?: string,
  ) {
    const updates: Promise<any>[] = [];

    if (dto.recharge) {
      const recPayload = {
        rateType: dto.recharge.rateType || 'PERCENTAGE',
        value: Number(dto.recharge.value || 0),
        isActive: dto.recharge.isActive !== undefined ? dto.recharge.isActive : true,
        minFee: Number(dto.recharge.minFee || 0),
        maxFee: Number(dto.recharge.maxFee || 0),
      };
      updates.push(
        this.prisma.systemSetting.upsert({
          where: { key: 'COMMISSION_RECHARGE' },
          create: {
            key: 'COMMISSION_RECHARGE',
            category: 'COMMISSION',
            isPublic: true,
            description: 'Platform recharge charge setting (Flat or Percentage)',
            value: recPayload,
          },
          update: { value: recPayload },
        }),
      );
    }

    if (dto.withdraw) {
      const withPayload = {
        rateType: dto.withdraw.rateType || 'PERCENTAGE',
        value: Number(dto.withdraw.value || 0),
        isActive: dto.withdraw.isActive !== undefined ? dto.withdraw.isActive : true,
        minFee: Number(dto.withdraw.minFee || 0),
        maxFee: Number(dto.withdraw.maxFee || 0),
      };
      updates.push(
        this.prisma.systemSetting.upsert({
          where: { key: 'COMMISSION_WITHDRAW' },
          create: {
            key: 'COMMISSION_WITHDRAW',
            category: 'COMMISSION',
            isPublic: true,
            description: 'Platform withdraw commission setting (Flat or Percentage)',
            value: withPayload,
          },
          update: { value: withPayload },
        }),
      );
    }

    if (dto.transaction) {
      const txPayload = {
        rateType: dto.transaction.rateType || 'PERCENTAGE',
        value: Number(dto.transaction.value || 0),
        isActive: dto.transaction.isActive !== undefined ? dto.transaction.isActive : true,
        minFee: Number(dto.transaction.minFee || 0),
        maxFee: Number(dto.transaction.maxFee || 0),
      };
      updates.push(
        this.prisma.systemSetting.upsert({
          where: { key: 'COMMISSION_TRANSACTION' },
          create: {
            key: 'COMMISSION_TRANSACTION',
            category: 'COMMISSION',
            isPublic: true,
            description: 'Platform transaction/escrow commission setting (Flat or Percentage)',
            value: txPayload,
          },
          update: { value: txPayload },
        }),
      );

      // Keep commission_rules table with scope: 'GLOBAL' in sync!
      const globalRule = await this.prisma.commissionRule.findFirst({
        where: { scope: 'GLOBAL' },
      });
      if (globalRule) {
        updates.push(
          this.prisma.commissionRule.update({
            where: { id: globalRule.id },
            data: {
              rateType: dto.transaction.rateType === 'FLAT' ? 'FLAT' : 'PERCENTAGE',
              value: new Prisma.Decimal(dto.transaction.value || 0),
              isActive: dto.transaction.isActive !== undefined ? dto.transaction.isActive : true,
            },
          }),
        );
      }
    }

    await Promise.all(updates);

    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          actorType: 'ADMIN',
          action: 'COMMISSION_SETTINGS_UPDATE',
          targetEntity: 'SystemSetting',
          targetId: 'COMMISSION_CORE',
          afterState: dto,
          reason: 'Updated core platform commission parameters (Recharge, Withdraw, Transaction)',
        },
      }).catch((err) => console.error('Failed to log commission settings update:', err));
    }

    return this.getCoreSettings();
  }

  /**
   * Calculate applicable commission according to priority rule or core settings
   */
  async calculateCommission(params: CommissionCalculationParams) {
    const amount = new Prisma.Decimal(params.amount || 0);

    // 1. RECHARGE FEE CALCULATION
    if (params.type === 'RECHARGE') {
      const recSetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'COMMISSION_RECHARGE' },
      });
      const setting = (recSetting?.value as any) || { rateType: 'PERCENTAGE', value: 0, isActive: true };
      let fee = new Prisma.Decimal(0);

      if (setting.isActive && Number(setting.value) > 0) {
        if (setting.rateType === 'PERCENTAGE') {
          fee = amount.mul(setting.value).div(100);
        } else {
          fee = new Prisma.Decimal(setting.value);
        }
        if (setting.minFee && fee.lessThan(setting.minFee)) {
          fee = new Prisma.Decimal(setting.minFee);
        }
        if (setting.maxFee && Number(setting.maxFee) > 0 && fee.greaterThan(setting.maxFee)) {
          fee = new Prisma.Decimal(setting.maxFee);
        }
      }

      const netAmount = amount.sub(fee);
      return {
        amount,
        commissionAmount: fee,
        netAmount: netAmount.lessThan(0) ? new Prisma.Decimal(0) : netAmount,
        totalRequired: amount,
        ruleApplied: {
          name: 'Recharge Fee Setting',
          scope: 'RECHARGE',
          rateType: setting.rateType,
          value: setting.value,
        },
      };
    }

    // 2. WITHDRAW FEE CALCULATION
    if (params.type === 'WITHDRAW') {
      const withSetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'COMMISSION_WITHDRAW' },
      });
      const setting = (withSetting?.value as any) || { rateType: 'PERCENTAGE', value: 1.5, isActive: true };
      let fee = new Prisma.Decimal(0);

      if (setting.isActive && Number(setting.value) > 0) {
        if (setting.rateType === 'PERCENTAGE') {
          fee = amount.mul(setting.value).div(100);
        } else {
          fee = new Prisma.Decimal(setting.value);
        }
        if (setting.minFee && fee.lessThan(setting.minFee)) {
          fee = new Prisma.Decimal(setting.minFee);
        }
        if (setting.maxFee && Number(setting.maxFee) > 0 && fee.greaterThan(setting.maxFee)) {
          fee = new Prisma.Decimal(setting.maxFee);
        }
      }

      const netAmount = amount.sub(fee);
      return {
        amount,
        commissionAmount: fee,
        netAmount: netAmount.lessThan(0) ? new Prisma.Decimal(0) : netAmount,
        totalRequired: amount,
        ruleApplied: {
          name: 'Withdraw Fee Setting',
          scope: 'WITHDRAW',
          rateType: setting.rateType,
          value: setting.value,
        },
      };
    }

    // 3. TRANSACTION / DEAL COMMISSION CALCULATION
    // Fetch all active rules sorted by priority descending
    const rules = await this.prisma.commissionRule.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
    });

    let matchedRule: any = null;

    // A. Check category-specific rule
    if (params.categorySlug) {
      matchedRule = rules.find(
        (r) => r.scope === 'CATEGORY' && r.categorySlug === params.categorySlug,
      );
    }

    // B. Check product-type rule
    if (!matchedRule && params.productType) {
      const scope = params.productType === 'PHYSICAL' ? 'PHYSICAL_PRODUCT' : 'DIGITAL_PRODUCT';
      matchedRule = rules.find((r) => r.scope === scope);
    }

    // C. Check transaction-type rule
    if (!matchedRule && params.transactionType) {
      matchedRule = rules.find((r) => r.scope === 'TRANSACTION_TYPE');
    }

    // D. Global transaction commission setting / fallback
    if (!matchedRule) {
      const txSetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'COMMISSION_TRANSACTION' },
      });
      if (txSetting && txSetting.value) {
        const val = txSetting.value as any;
        matchedRule = {
          name: 'Global Transaction Commission',
          scope: 'GLOBAL',
          rateType: val.rateType || 'PERCENTAGE',
          value: new Prisma.Decimal(val.value !== undefined ? val.value : 5),
          minFee: val.minFee,
          maxFee: val.maxFee,
        };
      } else {
        matchedRule = rules.find((r) => r.scope === 'GLOBAL') || {
          name: 'Default Commission',
          scope: 'GLOBAL',
          rateType: 'PERCENTAGE',
          value: new Prisma.Decimal(5),
        };
      }
    }

    let commissionAmount = new Prisma.Decimal(0);
    if (matchedRule.rateType === 'PERCENTAGE') {
      commissionAmount = amount.mul(matchedRule.value).div(100);
    } else {
      commissionAmount = new Prisma.Decimal(matchedRule.value);
    }

    if (matchedRule.minFee && commissionAmount.lessThan(matchedRule.minFee)) {
      commissionAmount = new Prisma.Decimal(matchedRule.minFee);
    }
    if (matchedRule.maxFee && Number(matchedRule.maxFee) > 0 && commissionAmount.greaterThan(matchedRule.maxFee)) {
      commissionAmount = new Prisma.Decimal(matchedRule.maxFee);
    }

    const totalRequired = amount.add(commissionAmount);

    return {
      amount,
      commissionAmount,
      netAmount: amount,
      totalRequired,
      ruleApplied: {
        name: matchedRule.name || 'Transaction Commission',
        scope: matchedRule.scope || 'GLOBAL',
        rateType: matchedRule.rateType,
        value: matchedRule.value,
      },
    };
  }

  async getAllRules() {
    return this.prisma.commissionRule.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createOrUpdateRule(
    dto: {
      id?: string;
      name: string;
      scope: any;
      categorySlug?: string;
      rateType: any;
      value: number;
      priority?: number;
      isActive?: boolean;
    },
    adminId?: string,
  ) {
    if (dto.id) {
      const before = await this.prisma.commissionRule.findUnique({ where: { id: dto.id } });
      const updated = await this.prisma.commissionRule.update({
        where: { id: dto.id },
        data: {
          name: dto.name,
          scope: dto.scope,
          categorySlug: dto.categorySlug,
          rateType: dto.rateType,
          value: new Prisma.Decimal(dto.value),
          priority: dto.priority || 0,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
        },
      });

      if (adminId) {
        await this.prisma.auditLog.create({
          data: {
            actorId: adminId,
            actorType: 'ADMIN',
            action: 'COMMISSION_RULE_UPDATE',
            targetEntity: 'CommissionRule',
            targetId: dto.id,
            beforeState: before ? (JSON.parse(JSON.stringify(before)) as any) : undefined,
            afterState: updated ? (JSON.parse(JSON.stringify(updated)) as any) : undefined,
            reason: `Updated commission rule: ${dto.name}`,
          },
        }).catch((err) => console.error('Failed to log commission rule update:', err));
      }

      return updated;
    }

    const created = await this.prisma.commissionRule.create({
      data: {
        name: dto.name,
        scope: dto.scope,
        categorySlug: dto.categorySlug,
        rateType: dto.rateType,
        value: new Prisma.Decimal(dto.value),
        priority: dto.priority || 0,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          actorType: 'ADMIN',
          action: 'COMMISSION_RULE_CREATE',
          targetEntity: 'CommissionRule',
          targetId: created.id,
          afterState: created ? (JSON.parse(JSON.stringify(created)) as any) : undefined,
          reason: `Created commission rule: ${dto.name}`,
        },
      }).catch((err) => console.error('Failed to log commission rule create:', err));
    }

    return created;
  }

  async deleteRule(id: string, adminId?: string) {
    const before = await this.prisma.commissionRule.findUnique({ where: { id } });
    const deleted = await this.prisma.commissionRule.delete({
      where: { id },
    });

    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          actorType: 'ADMIN',
          action: 'COMMISSION_RULE_DELETE',
          targetEntity: 'CommissionRule',
          targetId: id,
          beforeState: before ? (JSON.parse(JSON.stringify(before)) as any) : undefined,
          reason: `Deleted commission rule ${before?.name || id}`,
        },
      }).catch((err) => console.error('Failed to log commission rule delete:', err));
    }

    return deleted;
  }
}

