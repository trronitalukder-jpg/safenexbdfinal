import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding rich production audit logs...');

  const admin = await prisma.user.findFirst({
    where: { uniqueUserId: 'Admin0000' },
  });

  if (!admin) {
    console.error('Admin user Admin0000 not found!');
    return;
  }

  const users = await prisma.user.findMany({
    where: { id: { not: admin.id } },
    take: 10,
    include: { wallet: true },
  });

  const now = Date.now();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  const logsToCreate = [
    {
      actorId: admin.id,
      actorType: 'ADMIN' as const,
      action: 'SYSTEM_SETTINGS_UPDATE',
      targetEntity: 'SystemSetting',
      targetId: 'COMMISSION_CORE',
      beforeState: {
        recharge: { rateType: 'PERCENTAGE', value: 0 },
        withdraw: { rateType: 'PERCENTAGE', value: 2.0, minFee: 10 },
        transaction: { rateType: 'PERCENTAGE', value: 6.0 },
      },
      afterState: {
        recharge: { rateType: 'PERCENTAGE', value: 0 },
        withdraw: { rateType: 'PERCENTAGE', value: 1.5, minFee: 5, maxFee: 100 },
        transaction: { rateType: 'PERCENTAGE', value: 5.0 },
      },
      reason: 'Optimized transaction & withdrawal fees to enhance user retention and merchant competitiveness.',
      ipAddress: '103.239.252.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
      createdAt: new Date(now - 3 * day - 4 * hour),
    },
    {
      actorId: admin.id,
      actorType: 'ADMIN' as const,
      action: 'BID_SETTINGS_UPDATE',
      targetEntity: 'SystemSetting',
      targetId: 'BID_SETTINGS',
      beforeState: { productMinBid: 5, userMinBid: 10 },
      afterState: {
        productMinBid: 10,
        productExtraIncrement: 5,
        userMinBid: 20,
        userExtraIncrement: 10,
        homePageMinBid: 50,
      },
      reason: 'Configured automated dynamic positioning & bidding thresholds per Q3 roadmap.',
      ipAddress: '103.239.252.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
      createdAt: new Date(now - 2 * day - 8 * hour),
    },
    {
      actorId: admin.id,
      actorType: 'ADMIN' as const,
      action: 'COMMISSION_RULE_CREATE',
      targetEntity: 'CommissionRule',
      targetId: 'rule-digital-software',
      beforeState: null,
      afterState: {
        name: 'Digital Software & Scripts Discount Rate',
        scope: 'CATEGORY',
        categorySlug: 'digital-services',
        rateType: 'PERCENTAGE',
        value: '3.5',
        priority: 10,
        isActive: true,
      },
      reason: 'Promotional low commission tier for certified digital script developers.',
      ipAddress: '103.239.252.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
      createdAt: new Date(now - 2 * day - 2 * hour),
    },
    {
      actorId: admin.id,
      actorType: 'ADMIN' as const,
      action: 'USER_STATUS_UPDATE',
      targetEntity: 'User',
      targetId: users[0]?.id || 'user-target-001',
      beforeState: { isActive: true, isVerified: false },
      afterState: { isActive: true, isVerified: true },
      reason: 'Manual NID & trade license verification completed after authentic documentation review.',
      ipAddress: '103.239.252.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
      createdAt: new Date(now - 1 * day - 14 * hour),
    },
    {
      actorId: admin.id,
      actorType: 'ADMIN' as const,
      action: 'RECHARGE_APPROVE',
      targetEntity: 'RechargeRequest',
      targetId: 'rec-bkash-882103',
      beforeState: {
        status: 'PENDING',
        claimedAmount: '5000.00',
        method: 'bKash Merchant',
        transactionNumber: 'BK928374102',
      },
      afterState: {
        status: 'APPROVED',
        approvedAmount: '5000.00',
        netCredited: '5000.00',
        charge: '0.00',
      },
      reason: 'bKash merchant settlement verified matching TrxID: BK928374102 via bKash Web Portal.',
      ipAddress: '103.239.252.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
      createdAt: new Date(now - 1 * day - 6 * hour),
    },
    {
      actorId: admin.id,
      actorType: 'ADMIN' as const,
      action: 'RECHARGE_REJECT',
      targetEntity: 'RechargeRequest',
      targetId: 'rec-nagad-991201',
      beforeState: {
        status: 'PENDING',
        amount: '12500.00',
        method: 'Nagad Personal',
        transactionNumber: 'NG882711000',
      },
      afterState: { status: 'REJECTED' },
      reason: 'Fraud Alert: TrxID does not exist in Nagad statement and sender phone number mismatched.',
      ipAddress: '103.239.252.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
      createdAt: new Date(now - 18 * hour),
    },
    {
      actorId: admin.id,
      actorType: 'ADMIN' as const,
      action: 'WITHDRAWAL_APPROVE',
      targetEntity: 'WithdrawalRequest',
      targetId: 'wdr-rocket-449102',
      beforeState: {
        status: 'PENDING',
        amount: '3500.00',
        fee: '52.50',
        netAmount: '3447.50',
        destinationAccount: '01755999182',
      },
      afterState: {
        status: 'APPROVED',
        disbursedAmount: '3447.50',
        fee: '52.50',
      },
      reason: 'Disbursed via Rocket B2C disbursement gateway. Reference TrxID: RC881920394.',
      ipAddress: '103.239.252.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
      createdAt: new Date(now - 8 * hour),
    },
    {
      actorId: admin.id,
      actorType: 'ADMIN' as const,
      action: 'WITHDRAWAL_REJECT',
      targetEntity: 'WithdrawalRequest',
      targetId: 'wdr-bank-110293',
      beforeState: {
        status: 'PENDING',
        amount: '15000.00',
        fee: '225.00',
        netAmount: '14775.00',
        destinationAccount: 'City Bank AC# 2109837482',
      },
      afterState: {
        status: 'REJECTED',
        refundedAmount: '15000.00',
      },
      reason: 'Routing number does not match branch code. Funds credited back to user available balance.',
      ipAddress: '103.239.252.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
      createdAt: new Date(now - 4 * hour),
    },
    {
      actorId: admin.id,
      actorType: 'ADMIN' as const,
      action: 'WALLET_ADJUST',
      targetEntity: 'Wallet',
      targetId: users[1]?.wallet?.id || 'w-admin-adj-001',
      beforeState: { availableBalance: '500.00', holdBalance: '0.00' },
      afterState: { availableBalance: '1500.00', holdBalance: '0.00' },
      reason: 'Promotional onboarding voucher credited for Top Seller of the Month award.',
      ipAddress: '103.239.252.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
      createdAt: new Date(now - 2 * hour),
    },
    {
      actorId: 'SYSTEM',
      actorType: 'SYSTEM' as const,
      action: 'ESCROW_AUTO_RELEASE',
      targetEntity: 'Transaction',
      targetId: 'trx-escrow-auto-99',
      beforeState: { status: 'DELIVERED', disputeDeadline: new Date(now - 10 * minute).toISOString() },
      afterState: { status: 'COMPLETED', releasedAmount: '4500.00' },
      reason: 'Automatic escrow release triggered: 72 hours passed post-delivery without buyer dispute.',
      ipAddress: '127.0.0.1',
      userAgent: 'SafnexBD-CronWorker/1.0',
      createdAt: new Date(now - 45 * minute),
    },
    {
      actorId: admin.id,
      actorType: 'ADMIN' as const,
      action: 'BID_CANCEL',
      targetEntity: 'Bid',
      targetId: 'bid-pos-1-violation',
      beforeState: {
        status: 'ACTIVE',
        targetPosition: 1,
        bidAmount: '150.00',
        targetType: 'PRODUCT',
      },
      afterState: { status: 'CANCELLED' },
      reason: 'Policy Violation: Product title contained deceptive keywords. Bid cancelled & balance released.',
      ipAddress: '103.239.252.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
      createdAt: new Date(now - 15 * minute),
    },
  ];

  for (const log of logsToCreate) {
    await prisma.auditLog.create({
      data: {
        ...log,
        beforeState: log.beforeState || undefined,
      } as any,
    });
  }

  const count = await prisma.auditLog.count();
  console.log(`Successfully seeded audit logs! Total count in DB: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
