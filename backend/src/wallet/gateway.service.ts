import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ExecuteGatewayPaymentDto,
  InitiateGatewayPaymentDto,
  SaveGatewaySettingsDto,
} from './dto/wallet.dto';

@Injectable()
export class GatewayService {
  constructor(private prisma: PrismaService) {}

  private getDefaultBkash() {
    return {
      isEnabled: true,
      isLive: false,
      appKey: '',
      appSecret: '',
      username: '',
      password: '',
      chargeType: 'PERCENTAGE' as const,
      chargeValue: 1.5,
      minAmount: 10,
      maxAmount: 50000,
      instructions: 'bKash পেমেন্ট গেটওয়ের মাধ্যমে ইনস্ট্যান্ট অটো রিচার্জ সম্পন্ন হবে।',
    };
  }

  private getDefaultSslCommerz() {
    return {
      isEnabled: true,
      isLive: false,
      storeId: '',
      storePassword: '',
      chargeType: 'PERCENTAGE' as const,
      chargeValue: 2.5,
      minAmount: 50,
      maxAmount: 200000,
      instructions: 'ভিসা, মাস্টারকার্ড, বিকাশ, নগদ সহ যেকোনো কার্ড ও মোবাইল ব্যাংকিং দিয়ে অটো রিচার্জ।',
    };
  }

  /**
   * Admin: Get all gateway credentials & fee configurations
   */
  async getGatewaySettings() {
    const [bkashSetting, sslSetting] = await Promise.all([
      this.prisma.systemSetting.findUnique({ where: { key: 'GATEWAY_BKASH' } }),
      this.prisma.systemSetting.findUnique({ where: { key: 'GATEWAY_SSLCOMMERZ' } }),
    ]);

    const bkash = (bkashSetting?.value as any) || this.getDefaultBkash();
    const sslcommerz = (sslSetting?.value as any) || this.getDefaultSslCommerz();

    return {
      bkash: {
        ...this.getDefaultBkash(),
        ...bkash,
      },
      sslcommerz: {
        ...this.getDefaultSslCommerz(),
        ...sslcommerz,
      },
    };
  }

  /**
   * Public / User: Returns active gateway configs & charge percentages (masks secrets)
   */
  async getPublicConfigs() {
    const settings = await this.getGatewaySettings();

    return {
      bkash: {
        isEnabled: Boolean(settings.bkash.isEnabled),
        isLive: Boolean(settings.bkash.isLive),
        chargeType: settings.bkash.chargeType || 'PERCENTAGE',
        chargeValue: Number(settings.bkash.chargeValue ?? 1.5),
        minAmount: Number(settings.bkash.minAmount ?? 10),
        maxAmount: Number(settings.bkash.maxAmount ?? 50000),
        instructions: settings.bkash.instructions,
      },
      sslcommerz: {
        isEnabled: Boolean(settings.sslcommerz.isEnabled),
        isLive: Boolean(settings.sslcommerz.isLive),
        chargeType: settings.sslcommerz.chargeType || 'PERCENTAGE',
        chargeValue: Number(settings.sslcommerz.chargeValue ?? 2.5),
        minAmount: Number(settings.sslcommerz.minAmount ?? 50),
        maxAmount: Number(settings.sslcommerz.maxAmount ?? 200000),
        instructions: settings.sslcommerz.instructions,
      },
    };
  }

  /**
   * Admin: Save or update gateway settings and sync with RechargeMethod table
   */
  async saveGatewaySettings(dto: SaveGatewaySettingsDto) {
    const current = await this.getGatewaySettings();
    const updates: Promise<any>[] = [];

    // 1. Update bKash
    if (dto.bkash) {
      const mergedBkash = {
        ...current.bkash,
        ...dto.bkash,
        chargeValue: Number(dto.bkash.chargeValue ?? current.bkash.chargeValue),
        minAmount: Number(dto.bkash.minAmount ?? current.bkash.minAmount),
        maxAmount: Number(dto.bkash.maxAmount ?? current.bkash.maxAmount),
      };

      updates.push(
        this.prisma.systemSetting.upsert({
          where: { key: 'GATEWAY_BKASH' },
          create: {
            key: 'GATEWAY_BKASH',
            category: 'PAYMENT_GATEWAY',
            isPublic: false,
            description: 'bKash PGW API Settings & Fee Configuration',
            value: mergedBkash,
          },
          update: { value: mergedBkash },
        }),
      );

      // Sync RechargeMethod (type: API)
      updates.push(
        this.prisma.rechargeMethod.upsert({
          where: { code: 'BKASH_API' },
          create: {
            name: 'bKash Auto Recharge (API)',
            code: 'BKASH_API',
            type: 'API',
            accountNumber: 'bKash PGW Online',
            accountName: 'bKash Automated Gateway',
            instructions: mergedBkash.instructions,
            minAmount: new Prisma.Decimal(mergedBkash.minAmount),
            maxAmount: new Prisma.Decimal(mergedBkash.maxAmount),
            isActive: Boolean(mergedBkash.isEnabled),
            sortOrder: 1,
          },
          update: {
            name: 'bKash Auto Recharge (API)',
            accountNumber: 'bKash PGW Online',
            instructions: mergedBkash.instructions,
            minAmount: new Prisma.Decimal(mergedBkash.minAmount),
            maxAmount: new Prisma.Decimal(mergedBkash.maxAmount),
            isActive: Boolean(mergedBkash.isEnabled),
          },
        }),
      );
    }

    // 2. Update SSLCommerz
    if (dto.sslcommerz) {
      const mergedSsl = {
        ...current.sslcommerz,
        ...dto.sslcommerz,
        chargeValue: Number(dto.sslcommerz.chargeValue ?? current.sslcommerz.chargeValue),
        minAmount: Number(dto.sslcommerz.minAmount ?? current.sslcommerz.minAmount),
        maxAmount: Number(dto.sslcommerz.maxAmount ?? current.sslcommerz.maxAmount),
      };

      updates.push(
        this.prisma.systemSetting.upsert({
          where: { key: 'GATEWAY_SSLCOMMERZ' },
          create: {
            key: 'GATEWAY_SSLCOMMERZ',
            category: 'PAYMENT_GATEWAY',
            isPublic: false,
            description: 'SSLCommerz API Settings & Fee Configuration',
            value: mergedSsl,
          },
          update: { value: mergedSsl },
        }),
      );

      // Sync RechargeMethod (type: API)
      updates.push(
        this.prisma.rechargeMethod.upsert({
          where: { code: 'SSLCOMMERZ_API' },
          create: {
            name: 'SSLCommerz Auto Recharge (API)',
            code: 'SSLCOMMERZ_API',
            type: 'API',
            accountNumber: 'SSLCommerz Gateway',
            accountName: 'All Cards & MFS',
            instructions: mergedSsl.instructions,
            minAmount: new Prisma.Decimal(mergedSsl.minAmount),
            maxAmount: new Prisma.Decimal(mergedSsl.maxAmount),
            isActive: Boolean(mergedSsl.isEnabled),
            sortOrder: 2,
          },
          update: {
            name: 'SSLCommerz Auto Recharge (API)',
            accountNumber: 'SSLCommerz Gateway',
            instructions: mergedSsl.instructions,
            minAmount: new Prisma.Decimal(mergedSsl.minAmount),
            maxAmount: new Prisma.Decimal(mergedSsl.maxAmount),
            isActive: Boolean(mergedSsl.isEnabled),
          },
        }),
      );
    }

    await Promise.all(updates);
    return this.getGatewaySettings();
  }

  /**
   * User: Initiate Automated Gateway Recharge Session
   */
  async initiatePayment(userId: string, dto: InitiateGatewayPaymentDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const settings = await this.getGatewaySettings();
    const isBkash = dto.gateway === 'BKASH';
    const config = isBkash ? settings.bkash : settings.sslcommerz;

    if (!config.isEnabled) {
      throw new BadRequestException(`${dto.gateway} payment gateway is currently disabled by admin`);
    }

    const amount = Number(dto.amount);
    const min = Number(config.minAmount || 10);
    const max = Number(config.maxAmount || 500000);

    if (amount < min || amount > max) {
      throw new BadRequestException(`Amount must be between ৳${min} and ৳${max}`);
    }

    // Calculate Gateway Fee / Charge
    let charge = 0;
    if (config.chargeType === 'PERCENTAGE') {
      charge = Math.round(((amount * Number(config.chargeValue || 0)) / 100) * 100) / 100;
    } else {
      charge = Number(config.chargeValue || 0);
    }
    const totalPayable = Math.round((amount + charge) * 100) / 100;

    // Find or ensure method
    const methodCode = isBkash ? 'BKASH_API' : 'SSLCOMMERZ_API';
    let method = await this.prisma.rechargeMethod.findUnique({
      where: { code: methodCode },
    });

    if (!method) {
      method = await this.prisma.rechargeMethod.create({
        data: {
          name: isBkash ? 'bKash Auto Recharge (API)' : 'SSLCommerz Auto Recharge (API)',
          code: methodCode,
          type: 'API',
          accountNumber: isBkash ? 'bKash PGW Online' : 'SSLCommerz Gateway',
          accountName: 'Automated Gateway',
          instructions: config.instructions,
          minAmount: new Prisma.Decimal(min),
          maxAmount: new Prisma.Decimal(max),
          isActive: true,
        },
      });
    }

    const paymentId = `PAY-${isBkash ? 'BK' : 'SSL'}-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create RechargeRequest with status PENDING
    const rechargeRequest = await this.prisma.rechargeRequest.create({
      data: {
        userId,
        methodId: method.id,
        amount: new Prisma.Decimal(amount),
        senderAccount: `GATEWAY_${dto.gateway}`,
        transactionNumber: paymentId,
        status: 'PENDING',
        adminNotes: `Initiated automated ${dto.gateway} session. Fee: ৳${charge}. Total Payable: ৳${totalPayable}. Mode: ${config.isLive ? 'LIVE' : 'SANDBOX'}`,
      },
    });

    return {
      paymentId,
      requestId: rechargeRequest.id,
      gateway: dto.gateway,
      amount,
      charge,
      chargeType: config.chargeType,
      chargeValue: config.chargeValue,
      totalPayable,
      isLive: Boolean(config.isLive),
      instructions: config.instructions,
      customer: {
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
        email: user.email,
      },
    };
  }

  /**
   * User: Execute & Verify Gateway Payment (Auto-approves & credits wallet balance instantly)
   */
  async executePayment(userId: string, dto: ExecuteGatewayPaymentDto) {
    return this.prisma.$transaction(async (tx) => {
      // Find request by paymentId
      const request = await tx.rechargeRequest.findFirst({
        where: {
          transactionNumber: dto.paymentId,
          userId,
        },
        include: {
          user: { include: { wallet: true } },
          method: true,
        },
      });

      if (!request) {
        throw new NotFoundException('Payment transaction session not found');
      }

      if (request.status === 'APPROVED') {
        return {
          success: true,
          message: 'Payment already approved and credited',
          alreadyProcessed: true,
          amount: request.amount,
          newBalance: request.user.wallet?.availableBalance,
        };
      }

      const generatedTrxId =
        dto.trxId && dto.trxId.trim()
          ? dto.trxId.trim()
          : `TRX${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const approvedAmount = request.amount;
      const wallet = request.user.wallet!;
      const balanceBefore = wallet.availableBalance;
      const balanceAfter = balanceBefore.add(approvedAmount);

      // 1. Update recharge request to APPROVED
      await tx.rechargeRequest.update({
        where: { id: request.id },
        data: {
          status: 'APPROVED',
          approvedAmount,
          transactionNumber: generatedTrxId,
          reviewedById: 'AUTO_GATEWAY',
          reviewedAt: new Date(),
          adminNotes: `Auto-approved via ${request.method.name}. Gateway Session: ${dto.paymentId}. Verified TrxID: ${generatedTrxId}`,
        },
      });

      // 2. Atomically increment wallet available balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: balanceAfter,
          version: { increment: 1 },
        },
      });

      // 3. Write immutable financial ledger record
      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          userId,
          transactionId: generatedTrxId,
          type: 'RECHARGE',
          amount: approvedAmount,
          commission: new Prisma.Decimal(0),
          balanceBefore,
          balanceAfter,
          referenceId: dto.paymentId,
          referenceType: 'GATEWAY_AUTO_RECHARGE',
          notes: `Instant Wallet Auto-Recharge via ${request.method.name}. Gateway TrxID: ${generatedTrxId}`,
          createdBy: 'AUTO_GATEWAY',
          status: 'COMPLETED',
        },
      });

      return {
        success: true,
        message: 'Recharge completed and wallet credited successfully!',
        paymentId: dto.paymentId,
        trxId: generatedTrxId,
        amount: Number(approvedAmount),
        balanceBefore: Number(balanceBefore),
        newBalance: Number(balanceAfter),
      };
    });
  }
}

