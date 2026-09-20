import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import {
  BidScopeEnum,
  BidTypeEnum,
  PlaceBidDto,
  UpdateBidSettingsDto,
} from './dto/bid.dto';

@Injectable()
export class BidsService {
  constructor(
    private prisma: PrismaService,
    @Optional() private chatGateway?: ChatGateway,
  ) {}

  /**
   * Get all active bid settings and home page display limit settings
   */
  async getSettings() {
    const [bidSetting, homeSetting] = await Promise.all([
      this.prisma.systemSetting.findUnique({ where: { key: 'BID_SETTINGS' } }),
      this.prisma.systemSetting.findUnique({ where: { key: 'HOME_PAGE_SETTINGS' } }),
    ]);

    const defaultBidSettings = {
      isSameBidRateForHomeAndShop: true,
      // Base + Extra rates
      homeBaseRate: 200,
      homeExtraRate: 50,
      shopBaseRate: 150,
      shopExtraRate: 30,
      categoryBaseRate: 50,
      categoryExtraRate: 10,
      userHomeBaseRate: 100,
      userHomeExtraRate: 20,
      userDirBaseRate: 50,
      userDirExtraRate: 10,

      // Legacy support
      productMinBid: 50,
      productExtraIncrement: 10,
      userMinBid: 100,
      userExtraIncrement: 20,
      homePageMinBid: 200,
      homePageExtraIncrement: 50,
      shopMinBid: 150,
      shopExtraIncrement: 30,
      digitalMinBid: 80,
      digitalExtraIncrement: 15,
      physicalMinBid: 80,
      physicalExtraIncrement: 15,
      moneyExchangeMinBid: 100,
      moneyExchangeExtraIncrement: 25,
      enableOutbidNotification: true,
    };

    const savedHome = (homeSetting?.value as any) || {};

    const defaultHomeSettings = {
      showShopProducts: true,
      shopProductsCount: 12,
      showDigitalProducts: true,
      digitalProductsCount: 8,
      showPhysicalProducts: true,
      physicalProductsCount: 8,
      showMoneyExchange: true,
      moneyExchangeCount: 6,
      showUsers: true,
      usersCount: 6,
      sectionOrder: [
        'shopProducts',
        'digitalProducts',
        'physicalProducts',
        'moneyExchange',
        'users',
      ],
      layoutStyles: {
        shopProducts: 'grid',
        digitalProducts: 'grid',
        physicalProducts: 'grid',
        moneyExchange: 'grid',
        users: 'grid',
      },
      sectionTitles: {
        shopProducts: { bn: 'শপ প্রোডাক্টস', en: 'Shop Products', sub: 'জনপ্রিয় ও শীর্ষস্থানীয় পণ্যসমূহ' },
        digitalProducts: { bn: 'ডিজিটাল প্রোডাক্টস', en: 'Digital Products', sub: 'সরাসরি ডাউনলোডযোগ্য প্রোডাক্ট' },
        physicalProducts: { bn: 'ফিজিক্যাল প্রোডাক্টস', en: 'Physical Products', sub: 'হোম ডেলিভারি সহ বাস্তব পণ্য' },
        moneyExchange: { bn: 'মানি এক্সচেঞ্জ', en: 'Money Exchange', sub: 'নিরাপদ ও বিশ্বস্ত লেনদেন সার্ভিস' },
        users: { bn: 'টপ ইউজার ও সেলার', en: 'Top Users & Sellers', sub: 'আমাদের শীর্ষ ভেরিফাইড প্রোফাইল' },
      },
    };

    return {
      bidSettings: bidSetting ? { ...defaultBidSettings, ...(bidSetting.value as any) } : defaultBidSettings,
      homePageSettings: homeSetting
        ? { ...defaultHomeSettings, ...savedHome }
        : defaultHomeSettings,
    };
  }

  /**
   * Admin updates bid rates and home page display limits
   */
  async updateSettings(dto: UpdateBidSettingsDto, adminId?: string) {
    const current = await this.getSettings();

    const updatedBidSettings = {
      ...current.bidSettings,
      ...(dto.isSameBidRateForHomeAndShop !== undefined && { isSameBidRateForHomeAndShop: Boolean(dto.isSameBidRateForHomeAndShop) }),
      // Base + Extra rates
      ...(dto.homeBaseRate !== undefined && { homeBaseRate: Number(dto.homeBaseRate), homePageMinBid: Number(dto.homeBaseRate) }),
      ...(dto.homeExtraRate !== undefined && { homeExtraRate: Number(dto.homeExtraRate), homePageExtraIncrement: Number(dto.homeExtraRate) }),
      ...(dto.shopBaseRate !== undefined && { shopBaseRate: Number(dto.shopBaseRate), shopMinBid: Number(dto.shopBaseRate) }),
      ...(dto.shopExtraRate !== undefined && { shopExtraRate: Number(dto.shopExtraRate), shopExtraIncrement: Number(dto.shopExtraRate) }),
      ...(dto.categoryBaseRate !== undefined && { categoryBaseRate: Number(dto.categoryBaseRate), productMinBid: Number(dto.categoryBaseRate) }),
      ...(dto.categoryExtraRate !== undefined && { categoryExtraRate: Number(dto.categoryExtraRate), productExtraIncrement: Number(dto.categoryExtraRate) }),
      ...(dto.userHomeBaseRate !== undefined && { userHomeBaseRate: Number(dto.userHomeBaseRate), userMinBid: Number(dto.userHomeBaseRate) }),
      ...(dto.userHomeExtraRate !== undefined && { userHomeExtraRate: Number(dto.userHomeExtraRate), userExtraIncrement: Number(dto.userHomeExtraRate) }),
      ...(dto.userDirBaseRate !== undefined && { userDirBaseRate: Number(dto.userDirBaseRate) }),
      ...(dto.userDirExtraRate !== undefined && { userDirExtraRate: Number(dto.userDirExtraRate) }),
      // Legacy compatibility
      ...(dto.productMinBid !== undefined && { productMinBid: Number(dto.productMinBid) }),
      ...(dto.productExtraIncrement !== undefined && { productExtraIncrement: Number(dto.productExtraIncrement) }),
      ...(dto.userMinBid !== undefined && { userMinBid: Number(dto.userMinBid) }),
      ...(dto.userExtraIncrement !== undefined && { userExtraIncrement: Number(dto.userExtraIncrement) }),
      ...(dto.homePageMinBid !== undefined && { homePageMinBid: Number(dto.homePageMinBid) }),
      ...(dto.homePageExtraIncrement !== undefined && { homePageExtraIncrement: Number(dto.homePageExtraIncrement) }),
      ...(dto.shopMinBid !== undefined && { shopMinBid: Number(dto.shopMinBid) }),
      ...(dto.shopExtraIncrement !== undefined && { shopExtraIncrement: Number(dto.shopExtraIncrement) }),
      ...(dto.digitalMinBid !== undefined && { digitalMinBid: Number(dto.digitalMinBid) }),
      ...(dto.digitalExtraIncrement !== undefined && { digitalExtraIncrement: Number(dto.digitalExtraIncrement) }),
      ...(dto.physicalMinBid !== undefined && { physicalMinBid: Number(dto.physicalMinBid) }),
      ...(dto.physicalExtraIncrement !== undefined && { physicalExtraIncrement: Number(dto.physicalExtraIncrement) }),
      ...(dto.moneyExchangeMinBid !== undefined && { moneyExchangeMinBid: Number(dto.moneyExchangeMinBid) }),
      ...(dto.moneyExchangeExtraIncrement !== undefined && { moneyExchangeExtraIncrement: Number(dto.moneyExchangeExtraIncrement) }),
      ...(dto.enableOutbidNotification !== undefined && { enableOutbidNotification: Boolean(dto.enableOutbidNotification) }),
    };

    const updatedHomeSettings = {
      ...current.homePageSettings,
      ...(dto.showShopProducts !== undefined && { showShopProducts: Boolean(dto.showShopProducts) }),
      ...(dto.shopProductsCount !== undefined && { shopProductsCount: Number(dto.shopProductsCount) }),
      ...(dto.showDigitalProducts !== undefined && { showDigitalProducts: Boolean(dto.showDigitalProducts) }),
      ...(dto.digitalProductsCount !== undefined && { digitalProductsCount: Number(dto.digitalProductsCount) }),
      ...(dto.showPhysicalProducts !== undefined && { showPhysicalProducts: Boolean(dto.showPhysicalProducts) }),
      ...(dto.physicalProductsCount !== undefined && { physicalProductsCount: Number(dto.physicalProductsCount) }),
      ...(dto.showMoneyExchange !== undefined && { showMoneyExchange: Boolean(dto.showMoneyExchange) }),
      ...(dto.moneyExchangeCount !== undefined && { moneyExchangeCount: Number(dto.moneyExchangeCount) }),
      ...(dto.showUsers !== undefined && { showUsers: Boolean(dto.showUsers) }),
      ...(dto.usersCount !== undefined && { usersCount: Number(dto.usersCount) }),
      ...(dto.sectionOrder !== undefined && { sectionOrder: dto.sectionOrder }),
      ...(dto.layoutStyles !== undefined && { layoutStyles: dto.layoutStyles }),
      ...(dto.sectionTitles !== undefined && { sectionTitles: dto.sectionTitles }),
    };

    await Promise.all([
      this.prisma.systemSetting.upsert({
        where: { key: 'BID_SETTINGS' },
        create: {
          key: 'BID_SETTINGS',
          category: 'BIDDING',
          isPublic: true,
          value: updatedBidSettings,
          description: 'Minimum bid rates and extra balance increment steps',
        },
        update: {
          value: updatedBidSettings,
        },
      }),
      this.prisma.systemSetting.upsert({
        where: { key: 'HOME_PAGE_SETTINGS' },
        create: {
          key: 'HOME_PAGE_SETTINGS',
          category: 'HOME_PAGE',
          isPublic: true,
          value: updatedHomeSettings,
          description: 'Home page section display limits and customization',
        },
        update: {
          value: updatedHomeSettings,
        },
      }),
    ]);

    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          actorType: 'ADMIN',
          action: 'BID_SETTINGS_UPDATE',
          targetEntity: 'SystemSetting',
          targetId: 'BID_SETTINGS',
          afterState: { bidSettings: updatedBidSettings, homePageSettings: updatedHomeSettings },
          reason: 'Updated bid rates and homepage limits',
        },
      }).catch((err) => console.error('Failed to log bid settings update:', err));
    }

    return {
      message: 'Bid and home page settings updated successfully',
      bidSettings: updatedBidSettings,
      homePageSettings: updatedHomeSettings,
    };
  }

  /**
   * Calculate required bid for a target position
   * Logic:
   * 1. If someone already occupies targetPosition in that scope/category:
   *    required = existingBid.bidAmount + extraRate
   * 2. If nobody has active bid at targetPosition:
   *    required = baseRate
   */
  async calculateRequiredBid(params: {
    bidType?: string;
    scope?: string;
    productId?: string;
    targetUserId?: string;
    categoryId?: string;
    targetPosition: number;
  }) {
    const { bidSettings } = await this.getSettings();
    const bidType = params.bidType === 'USER_ID' ? 'USER_ID' : 'PRODUCT';
    const scope = (params.scope as any) || 'CATEGORY';
    const targetPosition = Number(params.targetPosition) || 1;

    let baseMinBid = 50;
    let extraIncrement = 10;

    if (bidType === 'USER_ID') {
      if (scope === 'HOME_PAGE') {
        baseMinBid = Number(bidSettings.userHomeBaseRate ?? bidSettings.userMinBid ?? 100);
        extraIncrement = Number(bidSettings.userHomeExtraRate ?? bidSettings.userExtraIncrement ?? 20);
      } else {
        baseMinBid = Number(bidSettings.userDirBaseRate ?? bidSettings.userMinBid ?? 50);
        extraIncrement = Number(bidSettings.userDirExtraRate ?? bidSettings.userExtraIncrement ?? 10);
      }
    } else {
      if (scope === 'HOME_PAGE') {
        baseMinBid = Number(bidSettings.homeBaseRate ?? bidSettings.homePageMinBid ?? 200);
        extraIncrement = Number(bidSettings.homeExtraRate ?? bidSettings.homePageExtraIncrement ?? 50);
      } else if (scope === 'SHOP') {
        if (bidSettings.isSameBidRateForHomeAndShop) {
          baseMinBid = Number(bidSettings.homeBaseRate ?? bidSettings.homePageMinBid ?? 200);
          extraIncrement = Number(bidSettings.homeExtraRate ?? bidSettings.homePageExtraIncrement ?? 50);
        } else {
          baseMinBid = Number(bidSettings.shopBaseRate ?? bidSettings.shopMinBid ?? 150);
          extraIncrement = Number(bidSettings.shopExtraRate ?? bidSettings.shopExtraIncrement ?? 30);
        }
      } else if (scope === 'DIGITAL_PRODUCTS') {
        baseMinBid = Number(bidSettings.digitalMinBid ?? bidSettings.categoryBaseRate ?? 80);
        extraIncrement = Number(bidSettings.digitalExtraIncrement ?? bidSettings.categoryExtraRate ?? 15);
      } else if (scope === 'PHYSICAL_PRODUCTS') {
        baseMinBid = Number(bidSettings.physicalMinBid ?? bidSettings.categoryBaseRate ?? 80);
        extraIncrement = Number(bidSettings.physicalExtraIncrement ?? bidSettings.categoryExtraRate ?? 15);
      } else if (scope === 'MONEY_EXCHANGE') {
        baseMinBid = Number(bidSettings.moneyExchangeMinBid ?? bidSettings.categoryBaseRate ?? 100);
        extraIncrement = Number(bidSettings.moneyExchangeExtraIncrement ?? bidSettings.categoryExtraRate ?? 25);
      } else {
        // CATEGORY or default
        baseMinBid = Number(bidSettings.categoryBaseRate ?? bidSettings.productMinBid ?? 50);
        extraIncrement = Number(bidSettings.categoryExtraRate ?? bidSettings.productExtraIncrement ?? 10);
      }
    }

    // Find if an active bid currently holds this spot
    const where: any = {
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
      targetPosition,
      scope,
      bidType,
    };

    if (scope === 'CATEGORY' && params.categoryId) {
      where.categoryId = params.categoryId;
    }

    const existingBid = await this.prisma.bid.findFirst({
      where,
      include: {
        product: { select: { id: true, title: true } },
        targetUser: { select: { id: true, uniqueUserId: true, firstName: true } },
      },
      orderBy: { bidAmount: 'desc' },
    });

    if (!existingBid) {
      return {
        targetPosition,
        currentHighestBid: 0,
        extraIncrement,
        baseMinBid,
        minimumRequiredBid: baseMinBid,
        hasActiveBid: false,
        currentHolder: null,
      };
    }

    const currentAmount = Number(existingBid.bidAmount);
    const minimumRequiredBid = currentAmount + extraIncrement;

    const holderName = existingBid.bidType === 'USER_ID'
      ? existingBid.targetUser?.uniqueUserId || 'User'
      : existingBid.product?.title || 'Product';

    return {
      targetPosition,
      currentHighestBid: currentAmount,
      extraIncrement,
      baseMinBid,
      minimumRequiredBid,
      hasActiveBid: true,
      currentHolder: holderName,
      currentBidId: existingBid.id,
    };
  }

  /**
   * Place a smart position bid (Products or User ID)
   * Position shift logic:
   * When user bids for position P, all active bids with targetPosition >= P
   * in the same scope/category are shifted down by 1 (P -> P+1, P+1 -> P+2, etc.)
   */
  async placeBid(userId: string, dto: PlaceBidDto) {
    const bidType = dto.bidType === BidTypeEnum.USER_ID ? 'USER_ID' : 'PRODUCT';
    const scope = (dto.scope as any) || 'CATEGORY';
    const targetPosition = Number(dto.targetPosition) || 1;
    const { homePageSettings } = await this.getSettings();

    const { newBid, directlyDisplaced } = await this.prisma.$transaction(async (tx) => {
      let categoryId: string | null = null;
      let targetTitle = '';

      if (bidType === 'PRODUCT') {
        if (!dto.productId) {
          throw new BadRequestException('Product ID is required for Product bidding');
        }

        const product = await tx.product.findUnique({
          where: { id: dto.productId },
          include: { category: true },
        });

        if (!product) {
          throw new NotFoundException('Product not found');
        }

        if (product.sellerId !== userId) {
          // Check if admin
          const userRoles = await tx.userRole.findMany({
            where: { userId },
            include: { role: true },
          });
          const isAdmin = userRoles.some((ur) => ['ADMIN', 'SUPER_ADMIN'].includes(ur.role.name));
          if (!isAdmin) {
            throw new ForbiddenException('You can only bid for position promotion on your own products');
          }
        }

        categoryId = product.categoryId;
        targetTitle = product.title;

        // 1. Validate Admin Home Page Settings for Product
        const isMoneyExchange = product.canonicalUrl === '/money-exchange' || product.canonicalUrl === 'money-exchange';
        if (scope === 'HOME_PAGE') {
          if (isMoneyExchange) {
            if (!homePageSettings.showMoneyExchange || Number(homePageSettings.moneyExchangeCount) <= 0) {
              throw new BadRequestException('অ্যাডমিন হোম পেজে মানি এক্সচেঞ্জ সেকশন বন্ধ বা লিমিট ০ রেখেছেন, তাই হোম পেজে বিড করা যাবে না।');
            }
          } else if (product.productType === 'DIGITAL_DOWNLOAD') {
            if (!homePageSettings.showDigitalProducts || Number(homePageSettings.digitalProductsCount) <= 0) {
              throw new BadRequestException('অ্যাডমিন হোম পেজে ডিজিটাল প্রোডাক্ট সেকশন বন্ধ বা লিমিট ০ রেখেছেন, তাই হোম পেজে বিড করা যাবে না।');
            }
          } else if (product.productType === 'PHYSICAL') {
            if (!homePageSettings.showPhysicalProducts || Number(homePageSettings.physicalProductsCount) <= 0) {
              throw new BadRequestException('অ্যাডমিন হোম পেজে ফিজিক্যাল প্রোডাক্ট সেকশন বন্ধ বা লিমিট ০ রেখেছেন, তাই হোম পেজে বিড করা যাবে না।');
            }
          }
        }

        // 2. Validate Shop Scope
        if (scope === 'SHOP') {
          if (!homePageSettings.showShopProducts || Number(homePageSettings.shopProductsCount) <= 0) {
            throw new BadRequestException('অ্যাডমিন শপ প্রোডাক্ট সেকশন বন্ধ বা লিমিট ০ রেখেছেন।');
          }
        }

        // 3. Validate Product Type vs Scope
        if (scope === 'DIGITAL_PRODUCTS' && product.productType !== 'DIGITAL_DOWNLOAD') {
          throw new BadRequestException('ফিজিক্যাল প্রোডাক্ট দিয়ে ডিজিটাল প্রোডাক্টস পেজে বিড করা যাবে না (Only digital products can bid on DIGITAL_PRODUCTS).');
        }
        if (scope === 'PHYSICAL_PRODUCTS' && product.productType !== 'PHYSICAL') {
          throw new BadRequestException('ডিজিটাল প্রোডাক্ট দিয়ে ফিজিক্যাল প্রোডাক্টস পেজে বিড করা যাবে না (Only physical products can bid on PHYSICAL_PRODUCTS).');
        }
        if (scope === 'MONEY_EXCHANGE' && !isMoneyExchange) {
          throw new BadRequestException('শুধুমাত্র মানি এক্সচেঞ্জ প্রোডাক্ট দিয়ে মানি এক্সচেঞ্জ পেজে বিড করা যাবে (Only money exchange products can bid on MONEY_EXCHANGE).');
        }
        if (isMoneyExchange && (scope === 'DIGITAL_PRODUCTS' || scope === 'PHYSICAL_PRODUCTS')) {
          throw new BadRequestException('মানি এক্সচেঞ্জ প্রোডাক্ট দিয়ে ডিজিটাল বা ফিজিক্যাল পেজে বিড করা যাবে না।');
        }
      } else {
        // USER_ID bidding
        if (!['HOME_PAGE', 'CATEGORY'].includes(scope)) {
          throw new BadRequestException('ইউজার আইডির জন্য শুধুমাত্র হোম পেজ অথবা ইউজার ডিরেক্টরি স্কোপ প্রযোজ্য।');
        }

        if (scope === 'HOME_PAGE') {
          if (!homePageSettings.showUsers || Number(homePageSettings.usersCount) <= 0) {
            throw new BadRequestException('অ্যাডমিন হোম পেজে ইউজার সেকশন বন্ধ বা লিমিট ০ রেখেছেন, তাই হোম পেজে বিড করা যাবে না।');
          }
        }

        const targetUser = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!targetUser) {
          throw new NotFoundException('User profile not found');
        }

        targetTitle = targetUser.uniqueUserId;
      }

      // Calculate required bid
      const calculation = await this.calculateRequiredBid({
        bidType,
        scope,
        productId: dto.productId,
        targetUserId: userId,
        categoryId: categoryId || undefined,
        targetPosition,
      });

      const proposedBid = new Prisma.Decimal(dto.bidAmount);
      const minRequiredDecimal = new Prisma.Decimal(calculation.minimumRequiredBid);

      if (proposedBid.lessThan(minRequiredDecimal)) {
        throw new BadRequestException(
          `Bid amount ৳${proposedBid} is too low. Minimum required: ৳${calculation.minimumRequiredBid}`,
        );
      }

      // Verify wallet available balance
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        throw new NotFoundException('Wallet not found for user');
      }

      // 1. Check if user/product already has an active bid in this scope
      const sameItemWhere: any = {
        bidType,
        scope,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      };
      if (bidType === 'PRODUCT') {
        sameItemWhere.productId = dto.productId;
      } else {
        sameItemWhere.targetUserId = userId;
      }
      if (scope === 'CATEGORY' && categoryId) {
        sameItemWhere.categoryId = categoryId;
      }

      const existingSameItemBids = await tx.bid.findMany({
        where: sameItemWhere,
        include: { reservation: true },
        orderBy: { targetPosition: 'asc' },
      });

      let oldPosition: number | undefined;
      if (existingSameItemBids.length > 0) {
        oldPosition = existingSameItemBids[0].targetPosition;

        // Cancel existing bids and refund their reserved balance
        for (const oldBid of existingSameItemBids) {
          if (oldBid.reservation && oldBid.reservation.status === 'RESERVED') {
            const availBeforeRefund = wallet.availableBalance;
            const availAfterRefund = availBeforeRefund.add(oldBid.reservation.reservedAmount);
            wallet.availableBalance = availAfterRefund;

            await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                availableBalance: availAfterRefund,
                version: { increment: 1 },
              },
            });

            await tx.bidReservation.update({
              where: { id: oldBid.reservation.id },
              data: { status: 'RELEASED' },
            });

            await tx.walletLedger.create({
              data: {
                walletId: wallet.id,
                userId,
                type: 'BID_RELEASE',
                amount: oldBid.reservation.reservedAmount,
                balanceBefore: availBeforeRefund,
                balanceAfter: availAfterRefund,
                holdBefore: wallet.holdBalance,
                holdAfter: wallet.holdBalance,
                referenceId: oldBid.id,
                referenceType: 'BID_RESERVATION',
                notes: `Refunded ৳${oldBid.reservation.reservedAmount} from superseded bid #${oldBid.targetPosition} on ${bidType === 'USER_ID' ? `User ID @${targetTitle}` : `"${targetTitle}"`} (${scope})`,
                status: 'COMPLETED',
                createdBy: userId,
              },
            });
          }

          await tx.bid.update({
            where: { id: oldBid.id },
            data: { status: 'CANCELLED' },
          });
        }
      }

      // Verify wallet balance is sufficient for the proposed bid
      if (wallet.availableBalance.lessThan(proposedBid)) {
        throw new BadRequestException({
          message: 'insufficient balance please recharge',
          code: 'INSUFFICIENT_BALANCE',
          required: Number(proposedBid),
          available: Number(wallet.availableBalance),
        });
      }

      // 2. Position shift logic:
      let bidsToShift: any[] = [];
      let directlyDisplaced: any = null;

      if (oldPosition === undefined) {
        // Case A: New bid in this scope. Shift all bids with targetPosition >= targetPosition down (+1)
        const shiftWhere: any = {
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
          scope,
          bidType,
          targetPosition: { gte: targetPosition },
        };
        if (scope === 'CATEGORY' && categoryId) {
          shiftWhere.categoryId = categoryId;
        }

        bidsToShift = await tx.bid.findMany({
          where: shiftWhere,
          orderBy: { targetPosition: 'desc' },
        });

        directlyDisplaced = bidsToShift.find(
          (b) => b.targetPosition === targetPosition && b.sellerId !== userId,
        );

        for (const b of bidsToShift) {
          await tx.bid.update({
            where: { id: b.id },
            data: { targetPosition: b.targetPosition + 1 },
          });
        }
      } else if (targetPosition < oldPosition) {
        // Case B1: Upgrading position (e.g. from 4 to 2). Shift bids in [targetPosition, oldPosition - 1] down (+1)
        const shiftWhere: any = {
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
          scope,
          bidType,
          targetPosition: { gte: targetPosition, lt: oldPosition },
        };
        if (scope === 'CATEGORY' && categoryId) {
          shiftWhere.categoryId = categoryId;
        }

        bidsToShift = await tx.bid.findMany({
          where: shiftWhere,
          orderBy: { targetPosition: 'desc' },
        });

        directlyDisplaced = bidsToShift.find(
          (b) => b.targetPosition === targetPosition && b.sellerId !== userId,
        );

        for (const b of bidsToShift) {
          await tx.bid.update({
            where: { id: b.id },
            data: { targetPosition: b.targetPosition + 1 },
          });
        }
      } else if (targetPosition > oldPosition) {
        // Case B2: Downgrading position (e.g. from 2 to 4). Shift bids in [oldPosition + 1, targetPosition] up (-1)
        const shiftWhere: any = {
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
          scope,
          bidType,
          targetPosition: { gt: oldPosition, lte: targetPosition },
        };
        if (scope === 'CATEGORY' && categoryId) {
          shiftWhere.categoryId = categoryId;
        }

        bidsToShift = await tx.bid.findMany({
          where: shiftWhere,
          orderBy: { targetPosition: 'asc' },
        });

        for (const b of bidsToShift) {
          await tx.bid.update({
            where: { id: b.id },
            data: { targetPosition: b.targetPosition - 1 },
          });
        }
      }
      // Case B3: targetPosition === oldPosition: No position shift needed, user simply increased bid amount.

      // 3. Deduct funds from current user's available balance
      const availBefore = wallet.availableBalance;
      const availAfter = availBefore.sub(proposedBid);

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: availAfter,
          version: { increment: 1 },
        },
      });

      // Perpetual expiry for bid (no countdown timer, stays active until displaced or cancelled)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 100);

      // 4. Create the new Bid record
      const newBid = await tx.bid.create({
        data: {
          bidType: bidType as any,
          scope: scope as any,
          productId: bidType === 'PRODUCT' ? dto.productId : null,
          targetUserId: bidType === 'USER_ID' ? userId : null,
          sellerId: userId,
          categoryId: categoryId,
          targetPosition,
          bidAmount: proposedBid,
          status: 'ACTIVE',
          expiresAt,
          reservation: {
            create: {
              walletId: wallet.id,
              reservedAmount: proposedBid,
              status: 'RESERVED',
            },
          },
        },
      });

      // 5. Wallet ledger entry
      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'BID_RESERVE',
          amount: proposedBid,
          balanceBefore: availBefore,
          balanceAfter: availAfter,
          holdBefore: wallet.holdBalance,
          holdAfter: wallet.holdBalance,
          referenceId: newBid.id,
          referenceType: 'BID_RESERVATION',
          notes: `Placed bid ৳${proposedBid} for Position #${targetPosition} on ${bidType === 'USER_ID' ? `User ID @${targetTitle}` : `"${targetTitle}"`} (${scope})`,
          status: 'COMPLETED',
          createdBy: userId,
        },
      });

      // 6. Bid history log
      await tx.bidHistory.create({
        data: {
          bidType: bidType as any,
          scope: scope as any,
          productId: bidType === 'PRODUCT' ? dto.productId : null,
          targetUserId: bidType === 'USER_ID' ? userId : null,
          userId,
          position: targetPosition,
          amount: proposedBid,
          action: 'PLACED',
        },
      });

      return { newBid, directlyDisplaced };
    });

    if (this.chatGateway && directlyDisplaced) {
      this.chatGateway.notifyUser(directlyDisplaced.sellerId, 'notification:outbid', {
        type: 'OUTBID',
        bidId: directlyDisplaced.id,
        newPosition: directlyDisplaced.targetPosition + 1,
        previousPosition: targetPosition,
        scope,
        message: `আপনার পজিশন #${targetPosition} থেকে #${targetPosition + 1}-এ নেমে গেছে। পুনরায় শীর্ষে যেতে এখনই আউটবিড করুন!`,
        data: {
          bidId: directlyDisplaced.id,
          newPosition: directlyDisplaced.targetPosition + 1,
          scope,
        },
        createdAt: new Date().toISOString(),
      });
    }

    if (this.chatGateway && newBid) {
      const bidAmt = Number(newBid.bidAmount || dto.bidAmount || 0);
      this.chatGateway.notifyAdmins('notification:admin', {
        type: 'BID_PLACED',
        title: 'নতুন বিড জমা পড়েছে',
        message: `ব্যবহারকারী ৳${bidAmt.toLocaleString()} টাকার বিড দিয়েছেন (পজিশন #${targetPosition})।`,
        targetUrl: '/admin/bids',
        data: {
          bidId: newBid.id,
          amount: bidAmt,
          position: targetPosition,
        },
        createdAt: new Date().toISOString(),
      });
    }

    return newBid;
  }

  /**
   * Place Combo Bids across multiple scopes at once
   */
  async placeComboBid(userId: string, dto: { bidType?: any; productId?: string; bids: { scope: any; targetPosition: number; bidAmount: number }[] }) {
    if (!dto.bids || dto.bids.length === 0) {
      throw new BadRequestException('কম্বো বিডের জন্য অন্তত একটি স্কোপ নির্বাচন করুন।');
    }

    const results: any[] = [];
    for (const item of dto.bids) {
      const bid = await this.placeBid(userId, {
        bidType: dto.bidType,
        productId: dto.productId,
        scope: item.scope,
        targetPosition: item.targetPosition,
        bidAmount: item.bidAmount,
      });
      results.push(bid);
    }

    return {
      message: `${results.length}টি সফল কম্বো বিড কার্যকর হয়েছে।`,
      bids: results,
    };
  }

  /**
   * Return user's own items with their exact current sorting positions across Home, Shop, and Category
   * 1. User ID position (Home Page + Users Directory)
   * 2. Each uploaded product position (Home Page + Shop + Category)
   */
  async getMyItemsWithPositions(userId: string) {
    const [user, myProducts] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          uniqueUserId: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          createdAt: true,
        },
      }),
      this.prisma.product.findMany({
        where: { sellerId: userId, deletedAt: null },
        include: {
          images: { where: { isMain: true }, select: { imageUrl: true }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 1. User ID Positions
    const activeUserBids = await this.prisma.bid.findMany({
      where: {
        bidType: 'USER_ID',
        targetUserId: userId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      orderBy: { targetPosition: 'asc' },
    });

    const homeUserBid = activeUserBids.find((b) => b.scope === 'HOME_PAGE');
    const usersListBid = activeUserBids.find((b) => b.scope === 'CATEGORY');

    const usersAheadCount = await this.prisma.user.count({
      where: {
        createdAt: { gt: user.createdAt },
        deletedAt: null,
        isActive: true,
      },
    });

    let homeUserPosition = 1;
    if (homeUserBid) {
      homeUserPosition = homeUserBid.targetPosition;
    } else {
      const activeHomeUsersBids = await this.prisma.bid.count({
        where: { bidType: 'USER_ID', scope: 'HOME_PAGE', status: 'ACTIVE', expiresAt: { gt: new Date() } },
      });
      homeUserPosition = activeHomeUsersBids + usersAheadCount + 1;
    }

    let usersListPosition = 1;
    if (usersListBid) {
      usersListPosition = usersListBid.targetPosition;
    } else {
      const activeDirUsersBids = await this.prisma.bid.count({
        where: { bidType: 'USER_ID', scope: 'CATEGORY', status: 'ACTIVE', expiresAt: { gt: new Date() } },
      });
      usersListPosition = activeDirUsersBids + usersAheadCount + 1;
    }

    // 2. Each Product Positions (Home, Shop, Category/Route)
    const productsWithPositions = await Promise.all(
      myProducts.map(async (p) => {
        const activeProductBids = await this.prisma.bid.findMany({
          where: {
            productId: p.id,
            status: 'ACTIVE',
            expiresAt: { gt: new Date() },
          },
          orderBy: { targetPosition: 'asc' },
        });

        const homeBid = activeProductBids.find((b) => b.scope === 'HOME_PAGE');
        const shopBid = activeProductBids.find((b) => b.scope === 'SHOP');
        const categoryBid = activeProductBids.find(
          (b) =>
            b.scope === 'CATEGORY' ||
            b.scope === 'DIGITAL_PRODUCTS' ||
            b.scope === 'PHYSICAL_PRODUCTS' ||
            b.scope === 'MONEY_EXCHANGE',
        );

        // Shop position
        let shopPosition = 1;
        if (shopBid) {
          shopPosition = shopBid.targetPosition;
        } else {
          const activeShopBidsCount = await this.prisma.bid.count({
            where: { scope: 'SHOP', status: 'ACTIVE', expiresAt: { gt: new Date() } },
          });
          const allProductsAhead = await this.prisma.product.count({
            where: { status: 'ACTIVE', deletedAt: null, createdAt: { gt: p.createdAt } },
          });
          shopPosition = activeShopBidsCount + allProductsAhead + 1;
        }

        // Home position
        let homePosition = 1;
        if (homeBid) {
          homePosition = homeBid.targetPosition;
        } else {
          const activeHomeBidsCount = await this.prisma.bid.count({
            where: { scope: 'HOME_PAGE', status: 'ACTIVE', expiresAt: { gt: new Date() } },
          });
          const typeProductsAhead = await this.prisma.product.count({
            where: {
              status: 'ACTIVE',
              deletedAt: null,
              productType: p.productType,
              createdAt: { gt: p.createdAt },
            },
          });
          homePosition = activeHomeBidsCount + typeProductsAhead + 1;
        }

        // Category/Route position
        let categoryPosition = 1;
        if (categoryBid) {
          categoryPosition = categoryBid.targetPosition;
        } else {
          const activeCatBidsCount = await this.prisma.bid.count({
            where: {
              categoryId: p.categoryId,
              status: 'ACTIVE',
              expiresAt: { gt: new Date() },
            },
          });
          const catProductsAhead = await this.prisma.product.count({
            where: {
              categoryId: p.categoryId,
              status: 'ACTIVE',
              deletedAt: null,
              createdAt: { gt: p.createdAt },
            },
          });
          categoryPosition = activeCatBidsCount + catProductsAhead + 1;
        }

        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          price: Number(p.price),
          productType: p.productType,
          canonicalUrl: p.canonicalUrl,
          status: p.status,
          imageUrl: p.images?.[0]?.imageUrl || null,
          categoryName: p.category?.name || 'General',
          categoryId: p.categoryId,
          currentPosition: homeBid?.targetPosition || shopBid?.targetPosition || categoryBid?.targetPosition || categoryPosition,
          homePosition,
          shopPosition,
          categoryPosition,
          homeBid: homeBid ? { id: homeBid.id, position: homeBid.targetPosition, amount: Number(homeBid.bidAmount), scope: homeBid.scope, expiresAt: homeBid.expiresAt } : null,
          shopBid: shopBid ? { id: shopBid.id, position: shopBid.targetPosition, amount: Number(shopBid.bidAmount), scope: shopBid.scope, expiresAt: shopBid.expiresAt } : null,
          categoryBid: categoryBid ? { id: categoryBid.id, position: categoryBid.targetPosition, amount: Number(categoryBid.bidAmount), scope: categoryBid.scope, expiresAt: categoryBid.expiresAt } : null,
          activeBid: activeProductBids[0]
            ? {
                id: activeProductBids[0].id,
                position: activeProductBids[0].targetPosition,
                amount: Number(activeProductBids[0].bidAmount),
                scope: activeProductBids[0].scope,
                expiresAt: activeProductBids[0].expiresAt,
              }
            : null,
          activeBids: activeProductBids.map((b) => ({
            id: b.id,
            position: b.targetPosition,
            amount: Number(b.bidAmount),
            scope: b.scope,
            expiresAt: b.expiresAt,
          })),
        };
      }),
    );

    return {
      user: {
        id: user.id,
        uniqueUserId: user.uniqueUserId,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        avatarUrl: user.avatarUrl,
        currentPosition: homeUserBid?.targetPosition || usersListBid?.targetPosition || usersListPosition,
        homePosition: homeUserPosition,
        usersPosition: usersListPosition,
        homeBid: homeUserBid ? { id: homeUserBid.id, position: homeUserBid.targetPosition, amount: Number(homeUserBid.bidAmount), scope: homeUserBid.scope, expiresAt: homeUserBid.expiresAt } : null,
        usersBid: usersListBid ? { id: usersListBid.id, position: usersListBid.targetPosition, amount: Number(usersListBid.bidAmount), scope: usersListBid.scope, expiresAt: usersListBid.expiresAt } : null,
        activeBid: activeUserBids[0]
          ? {
              id: activeUserBids[0].id,
              position: activeUserBids[0].targetPosition,
              amount: Number(activeUserBids[0].bidAmount),
              scope: activeUserBids[0].scope,
              expiresAt: activeUserBids[0].expiresAt,
            }
          : null,
        activeBids: activeUserBids.map((b) => ({
          id: b.id,
          position: b.targetPosition,
          amount: Number(b.bidAmount),
          scope: b.scope,
          expiresAt: b.expiresAt,
        })),
      },
      products: productsWithPositions,
    };
  }

  /**
   * Fetch current user's bids
   */
  async getMyBids(userId: string) {
    return this.prisma.bid.findMany({
      where: { sellerId: userId },
      include: {
        product: { select: { id: true, title: true, slug: true, price: true } },
        targetUser: { select: { id: true, uniqueUserId: true, firstName: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Admin: Get all bids across products and user IDs
   */
  async getAllBidsAdmin() {
    return this.prisma.bid.findMany({
      include: {
        product: { select: { id: true, title: true, slug: true, price: true } },
        targetUser: { select: { id: true, uniqueUserId: true, firstName: true, phone: true } },
        seller: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, phone: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ status: 'asc' }, { targetPosition: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Admin: Cancel a bid
   */
  async cancelBidAdmin(bidId: string, adminId?: string, reason?: string) {
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: { reservation: true, seller: { include: { wallet: true } } },
    });

    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    if (bid.status !== 'ACTIVE') {
      throw new BadRequestException(`Bid is already ${bid.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Refund reservation if present
      if (bid.reservation && bid.seller?.wallet) {
        const wallet = bid.seller.wallet;
        const availBefore = wallet.availableBalance;
        const availAfter = availBefore.add(bid.reservation.reservedAmount);

        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            availableBalance: availAfter,
            version: { increment: 1 },
          },
        });

        await tx.bidReservation.update({
          where: { id: bid.reservation.id },
          data: { status: 'RELEASED' },
        });

        await tx.walletLedger.create({
          data: {
            walletId: wallet.id,
            userId: bid.sellerId,
            type: 'BID_RELEASE',
            amount: bid.reservation.reservedAmount,
            balanceBefore: availBefore,
            balanceAfter: availAfter,
            holdBefore: wallet.holdBalance,
            holdAfter: wallet.holdBalance,
            notes: `Admin cancelled bid for Position #${bid.targetPosition}. Refunded ৳${bid.reservation.reservedAmount} to Available Balance`,
            status: 'COMPLETED',
            createdBy: adminId || 'ADMIN',
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: adminId || 'ADMIN',
          actorType: 'ADMIN',
          action: 'BID_CANCEL',
          targetEntity: 'Bid',
          targetId: bidId,
          beforeState: {
            status: bid.status,
            targetPosition: bid.targetPosition,
            bidAmount: bid.bidAmount.toString(),
            targetType: bid.productId ? 'PRODUCT' : 'USER_ID',
            productId: bid.productId,
            sellerId: bid.sellerId,
          },
          afterState: { status: 'CANCELLED' },
          reason: reason || `Admin cancelled bid for Position #${bid.targetPosition}`,
        },
      });

      // Shift remaining active bids above this position up by 1 (-1)
      const shiftWhere: any = {
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
        scope: bid.scope,
        bidType: bid.bidType,
        targetPosition: { gt: bid.targetPosition },
      };
      if (bid.scope === 'CATEGORY' && bid.categoryId) {
        shiftWhere.categoryId = bid.categoryId;
      }

      const bidsToShift = await tx.bid.findMany({
        where: shiftWhere,
        orderBy: { targetPosition: 'asc' },
      });

      for (const b of bidsToShift) {
        await tx.bid.update({
          where: { id: b.id },
          data: { targetPosition: b.targetPosition - 1 },
        });
      }

      return tx.bid.update({
        where: { id: bidId },
        data: { status: 'CANCELLED' },
      });
    });
  }
}
