import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting clean-up of test data...');

  // Identify all staff and admin accounts to preserve
  const staffUsers = await prisma.user.findMany({
    where: {
      OR: [
        { isEmployee: true },
        {
          userRoles: {
            some: {
              role: {
                name: {
                  in: [
                    'ADMIN',
                    'SUPER_ADMIN',
                    'EMPLOYEE',
                    'SUPPORT_ADMIN',
                    'FINANCE_ADMIN',
                    'CONTENT_ADMIN',
                  ],
                },
              },
            },
          },
        },
      ],
    },
    select: { id: true, email: true, uniqueUserId: true },
  });

  const staffUserIds = staffUsers.map((s) => s.id);
  console.log(
    `🛡️  Preserving ${staffUsers.length} Admin/Staff accounts:`,
    staffUsers.map((s) => `${s.uniqueUserId} (${s.email})`)
  );

  // 1. Clean test chats and messages
  console.log('🧹 Cleaning chat attachments, messages, participants, and conversations...');
  await prisma.messageAttachment.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversationParticipant.deleteMany({});
  await prisma.conversation.deleteMany({});

  // 2. Clean test transactions & escrows
  console.log('🧹 Cleaning test transactions, disputes and handoffs...');
  await prisma.disputeEvidence.deleteMany({});
  await prisma.disputeAction.deleteMany({});
  await prisma.dispute.deleteMany({});
  await prisma.transactionWorkLog.deleteMany({});
  await prisma.transactionStatusHistory.deleteMany({});
  await prisma.taskHandoffLog.deleteMany({});
  await prisma.transaction.deleteMany({});

  // 3. Clean test bids
  console.log('🧹 Cleaning test bids and reservations...');
  await prisma.bidReservation.deleteMany({});
  await prisma.bidHistory.deleteMany({});
  await prisma.bid.deleteMany({});

  // 4. Clean test products
  console.log('🧹 Cleaning test products, images, files and metadata...');
  await prisma.productImage.deleteMany({});
  await prisma.productFile.deleteMany({});
  await prisma.productPhysicalMeta.deleteMany({});
  await prisma.product.deleteMany({});

  // 5. Clean test financial requests & ledgers
  console.log('🧹 Cleaning test recharges, withdrawals, wallet holds and ledgers...');
  await prisma.rechargeRequest.deleteMany({});
  await prisma.withdrawalRequest.deleteMany({});
  await prisma.walletHold.deleteMany({});
  await prisma.walletLedger.deleteMany({});

  // Reset admin wallets to 0
  await prisma.wallet.updateMany({
    where: { userId: { in: staffUserIds } },
    data: {
      availableBalance: 0,
      holdBalance: 0,
      version: 0,
    },
  });

  // Delete regular user wallets
  await prisma.wallet.deleteMany({
    where: { userId: { notIn: staffUserIds } },
  });

  // 6. Clean user reviews & reset requests
  console.log('🧹 Cleaning user reviews and password reset requests...');
  await prisma.userReview.deleteMany({});
  await prisma.passwordResetRequest.deleteMany({});

  // 7. Clean test audit logs (keep admin audit intact if needed or clean non-essential)
  console.log('🧹 Cleaning audit logs...');
  await prisma.auditLog.deleteMany({});

  // 8. Clean test payment accounts & refresh tokens for non-staff
  console.log('🧹 Cleaning payment accounts and refresh tokens...');
  await prisma.userPaymentAccount.deleteMany({
    where: { userId: { notIn: staffUserIds } },
  });
  await prisma.refreshToken.deleteMany({
    where: { userId: { notIn: staffUserIds } },
  });

  // 9. Delete non-staff users (test users)
  console.log('🧹 Deleting non-staff test users...');
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { notIn: staffUserIds },
    },
  });

  console.log(`✅ Cleaned ${deletedUsers.count} test users.`);
  console.log('🎉 Database cleaned successfully! Admins, settings, categories, and payment configs preserved.');
}

main()
  .catch((e) => {
    console.error('❌ Clean-up failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
