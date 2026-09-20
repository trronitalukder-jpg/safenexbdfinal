import { PrismaService } from '../../prisma/prisma.service';
import { invalidateUserCache } from '../../auth/jwt.strategy';

/**
 * Completely purges or scrubs a user record so that:
 * 1. Their email and phone are immediately freed for re-registration or staff creation.
 * 2. They disappear from all chat conversations and participant lists.
 * 3. Their profile cannot be viewed (returns 404).
 * 4. If they have NO financial records, they are hard-deleted completely.
 * 5. If they have financial records (for accounting/audit integrity), their credentials are
 *    scrubbed with unique timestamps, isEmployee set to false, and tokens/participants deleted.
 */
export async function purgeOrScrubUser(
  prisma: PrismaService,
  userId: string,
): Promise<{ hardDeleted: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          sentTransactions: true,
          receivedTransactions: true,
          rechargeRequests: true,
          withdrawalRequests: true,
          assignedRecharges: true,
          assignedWithdrawals: true,
        },
      },
    },
  });

  if (!user) {
    return { hardDeleted: true };
  }

  // Check if user has any financial transactions
  const hasFinancialRecords =
    (user._count?.sentTransactions || 0) > 0 ||
    (user._count?.receivedTransactions || 0) > 0 ||
    (user._count?.rechargeRequests || 0) > 0 ||
    (user._count?.withdrawalRequests || 0) > 0 ||
    (user._count?.assignedRecharges || 0) > 0 ||
    (user._count?.assignedWithdrawals || 0) > 0;

  // Invalidate auth cache and revoke refresh tokens immediately
  invalidateUserCache(userId);
  await prisma.refreshToken.deleteMany({ where: { userId } }).catch(() => null);

  // If no financial records exist, attempt a complete HARD DELETE
  if (!hasFinancialRecords) {
    try {
      // 1. Remove conversation participants
      await prisma.conversationParticipant.deleteMany({ where: { userId } }).catch(() => null);

      // 2. Remove staff profile & task handoff logs
      await prisma.staffProfile.deleteMany({ where: { userId } }).catch(() => null);
      await prisma.taskHandoffLog
        .deleteMany({
          where: { OR: [{ fromStaffId: userId }, { toStaffId: userId }] },
        })
        .catch(() => null);

      // 3. Remove payment accounts, roles, reviews
      await prisma.userPaymentAccount.deleteMany({ where: { userId } }).catch(() => null);
      await prisma.userRole.deleteMany({ where: { userId } }).catch(() => null);
      await prisma.userReview
        .deleteMany({
          where: { OR: [{ reviewerId: userId }, { targetUserId: userId }] },
        })
        .catch(() => null);

      // 4. Remove partner user mappings
      await prisma.partnerUser.deleteMany({ where: { safnexUserId: userId } }).catch(() => null);

      // 5. Remove bids & histories
      await prisma.bidHistory.deleteMany({ where: { userId } }).catch(() => null);
      await prisma.bid
        .deleteMany({
          where: { OR: [{ sellerId: userId }, { targetUserId: userId }] },
        })
        .catch(() => null);

      // 6. Remove products
      await prisma.product.deleteMany({ where: { sellerId: userId } }).catch(() => null);

      // 7. Remove wallet & ledger
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (wallet) {
        await prisma.walletLedger.deleteMany({ where: { walletId: wallet.id } }).catch(() => null);
        await prisma.walletHold.deleteMany({ where: { walletId: wallet.id } }).catch(() => null);
        await prisma.wallet.delete({ where: { id: wallet.id } }).catch(() => null);
      }

      // 8. Delete user record completely
      await prisma.user.delete({ where: { id: userId } });
      return { hardDeleted: true };
    } catch (err) {
      console.warn(`[purgeOrScrubUser] Hard delete failed for user ${userId}, falling back to scrub:`, err);
    }
  }

  // Fallback / SCRUB: If user has financial history, scrub all credentials so they are instantly freed
  const timestamp = Date.now();
  const scrubbedEmail = user.email.includes('_deleted_') ? user.email : `${user.email}_deleted_${timestamp}`;
  const scrubbedPhone = user.phone.includes('_deleted_') ? user.phone : `${user.phone}_deleted_${timestamp}`;
  const scrubbedUniqueId = user.uniqueUserId.includes('_del_')
    ? user.uniqueUserId
    : `${user.uniqueUserId}_del_${timestamp}`;

  await prisma.user.update({
    where: { id: userId },
    data: {
      email: scrubbedEmail,
      phone: scrubbedPhone,
      uniqueUserId: scrubbedUniqueId,
      isActive: false,
      isEmployee: false,
      adminPermissions: null,
      deletedAt: user.deletedAt || new Date(),
    },
  });

  // Remove chat participants so the user disappears completely from all chats
  await prisma.conversationParticipant.deleteMany({ where: { userId } }).catch(() => null);

  // Remove staff profile
  await prisma.staffProfile.deleteMany({ where: { userId } }).catch(() => null);

  // Remove employee and administrative roles
  await prisma.userRole
    .deleteMany({
      where: {
        userId,
        role: {
          name: { in: ['EMPLOYEE', 'ADMIN', 'SUPPORT_ADMIN', 'FINANCE_ADMIN', 'MODERATOR'] },
        },
      },
    })
    .catch(() => null);

  // Soft-delete products
  await prisma.product
    .updateMany({
      where: { sellerId: userId },
      data: { status: 'INACTIVE', deletedAt: new Date() },
    })
    .catch(() => null);

  // Cancel active bids
  await prisma.bid
    .updateMany({
      where: { sellerId: userId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    })
    .catch(() => null);

  return { hardDeleted: false };
}
