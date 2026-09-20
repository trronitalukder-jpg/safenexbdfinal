import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SafnexBD database...');

  // 1. Permissions
  const permissionsList = [
    { code: 'USER_VIEW', description: 'View all users and details' },
    { code: 'USER_EDIT', description: 'Edit user profile and status' },
    { code: 'WALLET_VIEW', description: 'View user wallets and ledgers' },
    { code: 'WALLET_ADJUST', description: 'Manually adjust wallet balances with audit reason' },
    { code: 'TRANSACTION_VIEW', description: 'View all marketplace transactions' },
    { code: 'TRANSACTION_APPROVE', description: 'Intervene and approve transactions' },
    { code: 'HOLD_RELEASE', description: 'Release or refund hold balances' },
    { code: 'RECHARGE_APPROVE', description: 'Approve or reject recharge requests' },
    { code: 'WITHDRAW_APPROVE', description: 'Approve or reject withdrawal requests' },
    { code: 'CMS_EDIT', description: 'Manage banners, sliders, pages and navigation' },
    { code: 'PRODUCT_MODERATE', description: 'Approve, reject, or feature products' },
    { code: 'CATEGORY_MANAGE', description: 'Create and organize hierarchical categories' },
    { code: 'DISPUTE_MANAGE', description: 'Inspect disputes and resolve call admin requests' },
  ];

  for (const p of permissionsList) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }
  console.log('✔ Permissions seeded');

  // 2. Roles
  const rolesList = [
    'SUPER_ADMIN',
    'ADMIN',
    'FINANCE_ADMIN',
    'SUPPORT_ADMIN',
    'CONTENT_ADMIN',
    'MODERATOR',
    'USER',
  ];

  const allPerms = await prisma.permission.findMany();

  for (const roleName of rolesList) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `${roleName} Role with designated privileges`,
      },
    });

    if (roleName === 'SUPER_ADMIN') {
      for (const perm of allPerms) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: perm.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: perm.id,
          },
        });
      }
    }
  }
  console.log('✔ Roles & RolePermissions seeded');

  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  const userRole = await prisma.role.findUnique({ where: { name: 'USER' } });

  // 3. Super Admin Account
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@safnexbd.com' },
    update: {},
    create: {
      uniqueUserId: 'Admin0000',
      firstName: 'SafnexBD',
      lastName: 'Super Admin',
      email: 'admin@safnexbd.com',
      phone: '01700000000',
      passwordHash: adminPasswordHash,
      isActive: true,
      isVerified: true,
      address: 'Dhaka, Bangladesh',
      wallet: {
        create: {
          availableBalance: 0,
          holdBalance: 0,
        },
      },
    },
    include: { wallet: true },
  });

  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
      },
    });
  }
  console.log('✔ Super Admin created: admin@safnexbd.com (Admin@123456)');

  // 4. Demo Users (Rahim & Karim)
  const userPasswordHash = await bcrypt.hash('User@123456', 10);

  const rahimUser = await prisma.user.upsert({
    where: { email: 'user@safnexbd.com' },
    update: {},
    create: {
      uniqueUserId: 'Rahim2345',
      firstName: 'Rahim',
      lastName: 'Ahmed',
      email: 'user@safnexbd.com',
      phone: '01712342345',
      passwordHash: userPasswordHash,
      isActive: true,
      isVerified: true,
      address: 'Mirpur, Dhaka',
      wallet: {
        create: {
          availableBalance: 5000.0,
          holdBalance: 1500.0,
        },
      },
    },
    include: { wallet: true },
  });

  if (userRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: rahimUser.id, roleId: userRole.id } },
      update: {},
      create: { userId: rahimUser.id, roleId: userRole.id },
    });
  }

  // Add initial ledger entry for Rahim
  if (rahimUser.wallet) {
    await prisma.walletLedger.create({
      data: {
        walletId: rahimUser.wallet.id,
        userId: rahimUser.id,
        type: 'RECHARGE',
        amount: 6500.0,
        commission: 0,
        balanceBefore: 0,
        balanceAfter: 5000.0,
        holdBefore: 0,
        holdAfter: 1500.0,
        notes: 'Initial account activation and demo wallet funding',
        status: 'COMPLETED',
        createdBy: 'SYSTEM_SEED',
      },
    });
  }

  const karimUser = await prisma.user.upsert({
    where: { email: 'karim@safnexbd.com' },
    update: {},
    create: {
      uniqueUserId: 'Karim8899',
      firstName: 'Karim',
      lastName: 'Ullah',
      email: 'karim@safnexbd.com',
      phone: '01812348899',
      passwordHash: userPasswordHash,
      isActive: true,
      isVerified: true,
      address: 'Agrabad, Chattogram',
      wallet: {
        create: {
          availableBalance: 3000.0,
          holdBalance: 0.0,
        },
      },
    },
    include: { wallet: true },
  });

  if (userRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: karimUser.id, roleId: userRole.id } },
      update: {},
      create: { userId: karimUser.id, roleId: userRole.id },
    });
  }
  console.log('✔ Demo Users created: Rahim (user@safnexbd.com) & Karim (karim@safnexbd.com)');

  // 5. Hierarchical Categories
  const categoriesData = [
    {
      name: 'Electronics',
      slug: 'electronics',
      icon: 'Cpu',
      children: [
        { name: 'Smart Home', slug: 'smart-home' },
        { name: 'Mobile Accessories', slug: 'mobile-accessories' },
        { name: 'Computer Accessories', slug: 'computer-accessories' },
      ],
    },
    {
      name: 'Digital Products',
      slug: 'digital-products',
      icon: 'DownloadCloud',
      children: [
        { name: 'Software & Scripts', slug: 'software-scripts' },
        { name: 'Ebooks & Guides', slug: 'ebooks' },
        { name: 'Templates & Themes', slug: 'templates' },
      ],
    },
    {
      name: 'Services',
      slug: 'services',
      icon: 'Briefcase',
      children: [
        { name: 'Graphic Design', slug: 'graphic-design' },
        { name: 'Web Development', slug: 'web-development' },
        { name: 'Digital Marketing', slug: 'digital-marketing' },
      ],
    },
    {
      name: 'Money Exchange',
      slug: 'money-exchange',
      icon: 'Coins',
      children: [
        { name: 'USD Buy / Sell', slug: 'usd-exchange' },
        { name: 'EUR Buy / Sell', slug: 'eur-exchange' },
        { name: 'Crypto Peer-to-Peer', slug: 'crypto-p2p' },
      ],
    },
  ];

  for (const cat of categoriesData) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon },
      create: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
      },
    });

    if (cat.children) {
      for (const child of cat.children) {
        await prisma.category.upsert({
          where: { slug: child.slug },
          update: { name: child.name, parentId: parent.id },
          create: {
            name: child.name,
            slug: child.slug,
            parentId: parent.id,
          },
        });
      }
    }
  }
  console.log('✔ Hierarchical Categories seeded');

  // 6. Payment & Recharge Methods
  const rechargeMethods = [
    {
      name: 'bKash Personal',
      code: 'BKASH_PERSONAL',
      type: 'PERSONAL' as const,
      accountNumber: '01700000001',
      accountName: 'SafnexBD Deposit',
      instructions: 'Send Money to our bKash Personal number, then submit TrxID and screenshot.',
      minAmount: 50,
      maxAmount: 25000,
      sortOrder: 1,
    },
    {
      name: 'bKash Merchant',
      code: 'BKASH_MERCHANT',
      type: 'MERCHANT' as const,
      accountNumber: '01700000002',
      accountName: 'SafnexBD Ltd',
      instructions: 'Make Payment using Merchant counter code 1234.',
      minAmount: 100,
      maxAmount: 100000,
      sortOrder: 2,
    },
    {
      name: 'Nagad Personal',
      code: 'NAGAD_PERSONAL',
      type: 'PERSONAL' as const,
      accountNumber: '01800000001',
      accountName: 'SafnexBD Deposit',
      instructions: 'Send Money to our Nagad Personal number.',
      minAmount: 50,
      maxAmount: 25000,
      sortOrder: 3,
    },
    {
      name: 'Bank Transfer (City Bank)',
      code: 'BANK_CITY',
      type: 'BANK' as const,
      accountNumber: '1102938475001',
      accountName: 'SafnexBD Safe Escrow Ltd',
      bankDetails: 'Bank: The City Bank Ltd | Branch: Gulshan 2 | Routing: 225272345',
      instructions: 'NPSB / BEFTN / Direct Cash Deposit accepted. Upload bank deposit receipt.',
      minAmount: 500,
      maxAmount: 500000,
      sortOrder: 4,
    },
  ];

  for (const m of rechargeMethods) {
    await prisma.rechargeMethod.upsert({
      where: { code: m.code },
      update: m,
      create: m,
    });
  }

  const withdrawalMethods = [
    { name: 'bKash Withdrawal', code: 'BKASH_OUT', minAmount: 100, maxAmount: 25000, feePercentage: 1.5, sortOrder: 1 },
    { name: 'Nagad Withdrawal', code: 'NAGAD_OUT', minAmount: 100, maxAmount: 25000, feePercentage: 1.2, sortOrder: 2 },
    { name: 'Rocket Withdrawal', code: 'ROCKET_OUT', minAmount: 100, maxAmount: 25000, feePercentage: 1.5, sortOrder: 3 },
    { name: 'Bank Transfer', code: 'BANK_OUT', minAmount: 500, maxAmount: 100000, feeFlat: 15.0, sortOrder: 4 },
  ];

  for (const w of withdrawalMethods) {
    await prisma.withdrawalMethod.upsert({
      where: { code: w.code },
      update: w,
      create: w,
    });
  }
  console.log('✔ Recharge & Withdrawal Methods seeded');

  // 7. Commission Rules
  const commissionRules = [
    { name: 'Global Standard Commission', scope: 'GLOBAL' as const, rateType: 'PERCENTAGE' as const, value: 5.0, priority: 1 },
    { name: 'Physical Product Commission', scope: 'PHYSICAL_PRODUCT' as const, rateType: 'PERCENTAGE' as const, value: 4.0, priority: 5 },
    { name: 'Digital Product Commission', scope: 'DIGITAL_PRODUCT' as const, rateType: 'PERCENTAGE' as const, value: 8.0, priority: 5 },
    { name: 'Money Exchange Escrow Fee', scope: 'CATEGORY' as const, categorySlug: 'money-exchange', rateType: 'PERCENTAGE' as const, value: 2.0, priority: 10 },
  ];

  for (const cr of commissionRules) {
    const existing = await prisma.commissionRule.findFirst({ where: { name: cr.name } });
    if (!existing) {
      await prisma.commissionRule.create({ data: cr });
    }
  }
  console.log('✔ Commission Rules seeded');

  // 8. Sliders & CMS Sections
  const sliders = [
    {
      title: 'বাংলাদেশের প্রথম নিরাপদ ট্রানজ্যাকশন প্ল্যাটফর্ম',
      subtitle: 'Buyer এবং Seller উভয়ের জন্যই ১০০% সুরক্ষা ও Escrow নিশ্চয়তা',
      description: 'প্রোডাক্ট কেনাবেচা, ফ্রিল্যান্সিং সার্ভিস বা ডিজিটাল এসেট লেনদেনে মধ্যস্থতা করার বিশ্বস্ত ঠিকানা।',
      imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
      buttonText: 'লেনদেন শুরু করুন',
      buttonLink: '/transactions',
      sortOrder: 1,
    },
    {
      title: 'ডিজিটাল ও ফিজিক্যাল প্রোডাক্ট নিরাপদে কিনুন',
      subtitle: 'টাকা থাকবে Hold ব্যালেন্সে, কাজ বা পণ্য বুঝে পেয়ে কনফার্ম করুন',
      description: 'সরাসরি চ্যাটে কথা বলুন, অফার ঠিক করুন এবং নিরাপদে লেনদেন সম্পন্ন করুন।',
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67e5572293?auto=format&fit=crop&w=1200&q=80',
      buttonText: 'প্রোডাক্ট এক্সপ্লোর করুন',
      buttonLink: '/products',
      sortOrder: 2,
    },
  ];

  for (const s of sliders) {
    const existing = await prisma.slider.findFirst({ where: { title: s.title } });
    if (!existing) {
      await prisma.slider.create({ data: s });
    }
  }

  const sections = [
    { sectionKey: 'hero', title: 'হিরো ব্যানার ও তাৎক্ষণিক লেনদেন', sortOrder: 1, isEnabled: true },
    { sectionKey: 'featured_categories', title: 'টপ ক্যাটাগরি সমূহ', sortOrder: 2, isEnabled: true },
    { sectionKey: 'latest_products', title: 'সাম্প্রতিক প্রোডাক্ট ও ডিল', sortOrder: 3, isEnabled: true },
    { sectionKey: 'digital_products', title: 'ডিজিটাল প্রোডাক্ট ও সফটওয়্যার', sortOrder: 4, isEnabled: true },
    { sectionKey: 'physical_products', title: 'ফিজিক্যাল গ্যাজেট ও অ্যাক্সেসরিজ', sortOrder: 5, isEnabled: true },
    { sectionKey: 'money_exchange', title: 'পিয়ার-টু-পিয়ার মানি এক্সচেঞ্জ', sortOrder: 6, isEnabled: true },
    { sectionKey: 'how_it_works', title: 'নিরাপদ লেনদেন কিভাবে কাজ করে?', sortOrder: 7, isEnabled: true },
    { sectionKey: 'trust_safety', title: 'কেন SafnexBD নিরাপদ?', sortOrder: 8, isEnabled: true },
    { sectionKey: 'cta', title: 'আজই জয়েন করুন এবং নিরাপদ লেনদেন উপভোগ করুন', sortOrder: 9, isEnabled: true },
  ];

  for (const sec of sections) {
    await prisma.cmsSection.upsert({
      where: { sectionKey: sec.sectionKey },
      update: sec,
      create: sec,
    });
  }

  // 9. System Settings
  const settings = [
    { key: 'SITE_NAME', value: { bn: 'সেফনেক্স বিডি', en: 'SafnexBD' }, category: 'GENERAL', isPublic: true },
    { key: 'SITE_TAGLINE', value: { bn: 'নিরাপদ লেনদেন ও আধুনিক মার্কেটপ্লেস', en: 'Safe Transaction & Modern Marketplace' }, category: 'GENERAL', isPublic: true },
    { key: 'CURRENCY', value: { code: 'BDT', symbol: '৳' }, category: 'FINANCIAL', isPublic: true },
    { key: 'MIN_BID_AMOUNT', value: 10, category: 'BIDDING', isPublic: true },
    { key: 'MIN_BID_INCREMENT', value: 1, category: 'BIDDING', isPublic: true },
    { key: 'BID_DURATION_HOURS', value: 24, category: 'BIDDING', isPublic: false },
    { key: 'CONTACT_EMAIL', value: 'support@safnexbd.com', category: 'CONTACT', isPublic: true },
    { key: 'CONTACT_PHONE', value: '+880 1700-000000', category: 'CONTACT', isPublic: true },
  ];

  for (const st of settings) {
    await prisma.systemSetting.upsert({
      where: { key: st.key },
      update: { value: st.value },
      create: st,
    });
  }
  console.log('✔ System Settings & CMS Sections seeded');

  // 10. Sample Products for Rahim
  const digitalCategory = await prisma.category.findUnique({ where: { slug: 'software-scripts' } });
  const physicalCategory = await prisma.category.findUnique({ where: { slug: 'smart-home' } });

  if (digitalCategory) {
    await prisma.product.upsert({
      where: { slug: 'safnex-multi-vendor-marketplace-source-code' },
      update: {},
      create: {
        sellerId: rahimUser.id,
        categoryId: digitalCategory.id,
        title: 'Safnex Multi-Vendor Marketplace & Escrow Script',
        slug: 'safnex-multi-vendor-marketplace-source-code',
        productType: 'DIGITAL_DOWNLOAD',
        price: 3500.0,
        descriptionHtml: '<h1>Professional Escrow & Marketplace Platform</h1><p>Full source code with Next.js, NestJS, and MySQL integration. Clean architecture and production ready.</p>',
        status: 'ACTIVE',
        isFeatured: true,
        images: {
          create: [
            {
              imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
              isMain: true,
              sortOrder: 1,
            },
          ],
        },
      },
    });
  }

  if (physicalCategory) {
    await prisma.product.upsert({
      where: { slug: 'smart-wifi-video-doorbell-camera' },
      update: {},
      create: {
        sellerId: rahimUser.id,
        categoryId: physicalCategory.id,
        title: 'Smart WiFi Video Doorbell Camera 1080P HD',
        slug: 'smart-wifi-video-doorbell-camera',
        productType: 'PHYSICAL',
        price: 2850.0,
        descriptionHtml: '<h2>High Definition Smart Security Doorbell</h2><p>Two-way audio, night vision, cloud storage support and easy smartphone app connection.</p>',
        status: 'ACTIVE',
        isFeatured: true,
        images: {
          create: [
            {
              imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
              isMain: true,
              sortOrder: 1,
            },
          ],
        },
        physicalMeta: {
          create: {
            stock: 25,
            sku: 'DOOR-CAM-01',
            weight: 0.45,
            deliveryInfo: 'Home delivery all over Bangladesh in 24-48 hours via Steadfast / RedX.',
          },
        },
      },
    });
  }
  console.log('✔ Sample Products created');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

