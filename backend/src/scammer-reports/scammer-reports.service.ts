import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { CreateScammerReportDto } from './dto/create-scammer-report.dto';
import { UpdateScammerReportDto } from './dto/update-scammer-report.dto';
import { DirectScammerRecordDto } from './dto/direct-scammer-record.dto';
import { ScammerCategory, ScammerReportStatus } from '@prisma/client';

@Injectable()
export class ScammerReportsService {
  private readonly logger = new Logger(ScammerReportsService.name);

  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  /**
   * Helper: Normalize Phone Number to standard 11-digit or clean format
   * e.g. "+8801712-345678" -> "01712345678"
   */
  normalizePhone(raw?: string | null): string | null {
    if (!raw) return null;
    let clean = raw.trim().replace(/[\s\-\(\)]/g, '');
    if (clean.startsWith('+880')) {
      clean = '0' + clean.slice(4);
    } else if (clean.startsWith('880')) {
      clean = '0' + clean.slice(3);
    } else if (clean.startsWith('+88')) {
      clean = clean.slice(3);
    }
    return clean;
  }

  /**
   * Helper: Normalize Facebook Profile/Page URL to extract Username or UID
   * e.g. "https://facebook.com/john.scam12" -> "john.scam12"
   * e.g. "https://facebook.com/profile.php?id=100083921" -> "100083921"
   */
  normalizeFacebook(raw?: string | null): { url: string | null; uid: string | null } {
    if (!raw) return { url: null, uid: null };
    const trimmed = raw.trim();
    let uid: string | null = null;

    try {
      // Check for numeric ID parameter
      const idMatch = trimmed.match(/[?&]id=([0-9]+)/i);
      if (idMatch && idMatch[1]) {
        uid = idMatch[1];
      } else {
        // Remove trailing slashes and query strings
        const withoutQuery = trimmed.split('?')[0].replace(/\/+$/, '');
        const parts = withoutQuery.split('/');
        const lastPart = parts[parts.length - 1];
        if (
          lastPart &&
          !['profile.php', 'facebook.com', 'fb.com', 'm.facebook.com'].includes(
            lastPart.toLowerCase(),
          )
        ) {
          uid = lastPart.toLowerCase();
        }
      }
    } catch {
      uid = null;
    }

    return { url: trimmed, uid };
  }

  /**
   * Public Search Engine
   * Strictly cleans reporter details from the returned response for 100% privacy
   */
  async search(query: string) {
    if (!query || !query.trim()) {
      throw new BadRequestException('অনুসন্ধান করার জন্য একটি নম্বর বা ফেসবুক লিংক লিখুন।');
    }

    const settings = await this.settingsService.getAllSettings();
    const isEnabled = settings?.system?.scammerCheckerEnabled !== false;

    if (!isEnabled) {
      return {
        enabled: false,
        found: false,
        message: 'স্ক্যামার চেকার সিস্টেমটি বর্তমানে সাময়িকভাবে বন্ধ বা রক্ষণাবেক্ষণে রয়েছে।',
      };
    }

    const trimmedQuery = query.trim();
    const normalizedPhone = this.normalizePhone(trimmedQuery);
    const { uid: normalizedFb } = this.normalizeFacebook(trimmedQuery);

    const orConditions: any[] = [];

    if (normalizedPhone && normalizedPhone.length >= 7) {
      orConditions.push({ phone: { contains: normalizedPhone } });
      // Also match without leading zero if user typed without 0
      if (normalizedPhone.startsWith('0')) {
        orConditions.push({ phone: { contains: normalizedPhone.slice(1) } });
      }
    }

    if (normalizedFb && normalizedFb.length >= 3) {
      orConditions.push({ facebookUid: { equals: normalizedFb } });
      orConditions.push({ facebookLink: { contains: normalizedFb } });
    }

    // Direct string match on phone or facebookLink
    orConditions.push({ phone: { contains: trimmedQuery } });
    orConditions.push({ facebookLink: { contains: trimmedQuery } });

    const isGlobalWarningOnly = settings?.system?.scammerGlobalWarningOnly === true;

    const matches = await this.prisma.scammerRecord.findMany({
      where: {
        status: ScammerReportStatus.APPROVED,
        OR: orConditions,
      },
      select: {
        id: true,
        scammerName: true,
        phone: true,
        facebookLink: true,
        category: true,
        description: true,
        amountLost: true,
        proofImages: true,
        scammerPhotoUrl: true,
        severity: true,
        searchHitCount: true,
        warningOnlyMode: true,
        showScammerName: true,
        showPhonePublicly: true,
        showFacebookPublicly: true,
        showProofPublicly: true,
        showDescriptionPublicly: true,
        customWarning: true,
        createdAt: true,
        // CRITICAL: NEVER select reporterId, reporterName, reporterPhone, reporterIp
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (matches.length > 0) {
      // Asynchronously increment search hit count
      const matchIds = matches.map((m) => m.id);
      this.prisma.scammerRecord
        .updateMany({
          where: { id: { in: matchIds } },
          data: { searchHitCount: { increment: 1 } },
        })
        .catch((err) => this.logger.error('Failed to increment search hit count', err));

      const processedRecords = matches.map((item) => {
        const isWarningOnly = isGlobalWarningOnly || item.warningOnlyMode;
        if (isWarningOnly) {
          return {
            id: item.id,
            warningOnly: true,
            category: item.category,
            severity: item.severity,
            customWarning: item.customWarning || null,
            createdAt: item.createdAt,
            searchHitCount: item.searchHitCount,
            // Strictly hide all personal details:
            scammerName: null,
            phone: null,
            facebookLink: null,
            description: null,
            amountLost: null,
            proofImages: [],
            scammerPhotoUrl: null,
          };
        }

        return {
          id: item.id,
          warningOnly: false,
          category: item.category,
          severity: item.severity,
          customWarning: item.customWarning || null,
          createdAt: item.createdAt,
          searchHitCount: item.searchHitCount,
          amountLost: item.amountLost,
          scammerName: item.showScammerName !== false ? item.scammerName : null,
          phone: item.showPhonePublicly !== false ? item.phone : null,
          facebookLink: item.showFacebookPublicly !== false ? item.facebookLink : null,
          proofImages: item.showProofPublicly !== false ? item.proofImages : [],
          description: item.showDescriptionPublicly !== false ? item.description : null,
          scammerPhotoUrl: item.showScammerName !== false ? item.scammerPhotoUrl : null,
        };
      });

      return {
        enabled: true,
        found: true,
        count: matches.length,
        query: trimmedQuery,
        records: processedRecords,
        cautionMessageBn:
          '⚠️ বিশেষ সতর্কতা: এই ব্যক্তির বিরুদ্ধে আর্থিক লেনদেন সংক্রান্ত গুরুতর প্রতারণার রেকর্ড রয়েছে। তাই এর সাথে যেকোনো প্রকার টাকা লেনদেন, বিকাশ/নগদ পেমেন্ট বা লেনদেন করা থেকে সম্পূর্ণ বিরত থাকুন।',
        cautionMessageEn:
          'Caution: Fraud complaints have been verified for this contact. Avoid direct payments or financial transactions.',
      };
    }

    return {
      enabled: true,
      found: false,
      query: trimmedQuery,
      messageBn: 'এই নম্বরের/আইডির অতীতে কোনো প্রতারণার রেকর্ড আমাদের ডাটাবেজে নেই।',
      messageEn: 'No fraudulent record found in our database for this query.',
      advisoryNoticeBn:
        '⚠️ গুরুত্বপূর্ণ পরামর্শ: আমাদের ডাটাবেজে নাম না থাকার অর্থ এই ব্যক্তি ১০০% সৎ তা নিশ্চিত করে না। নতুন বা অচেনা কাউকে সরাসরি বিকাশ/নগদে টাকা পাঠাবেন না। লেনদেনে ১০০% সুরক্ষিত থাকতে সবসময় SafnexBD এসক্রো ব্যবহার করুন।',
      advisoryNoticeEn:
        'Safety Notice: A clean search does not guarantee complete trustworthiness. Never send money in advance to unverified contacts. Always use SafnexBD Escrow.',
    };
  }

  /**
   * User submits a new report (Requires Authentication)
   */
  async submitReport(userId: string, dto: CreateScammerReportDto, clientIp: string) {
    if (!dto.phone && !dto.facebookLink) {
      throw new BadRequestException('প্রতারকের মোবাইল নম্বর অথবা ফেসবুক লিংক যেকোনো একটি অবশ্যই প্রদান করতে হবে।');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const normalizedPhone = this.normalizePhone(dto.phone);
    const { url: fbUrl, uid: fbUid } = this.normalizeFacebook(dto.facebookLink);

    const record = await this.prisma.scammerRecord.create({
      data: {
        phone: normalizedPhone || dto.phone?.trim() || null,
        facebookLink: fbUrl || dto.facebookLink?.trim() || null,
        facebookUid: fbUid,
        scammerName: dto.scammerName?.trim() || null,
        scammerPhotoUrl: dto.scammerPhotoUrl?.trim() || null,
        category: dto.category || ScammerCategory.TRANSACTION_FRAUD,
        description: dto.description.trim(),
        amountLost: dto.amountLost ? Number(dto.amountLost) : null,
        proofImages: dto.proofImages || [],
        status: ScammerReportStatus.PENDING,
        severity: 'HIGH',
        reporterId: user.id,
        reporterName: `${user.firstName} ${user.lastName}`.trim(),
        reporterPhone: user.phone,
        reporterIp: clientIp || null,
      },
    });

    return {
      success: true,
      message:
        'আপনার রিপোর্টটি সফলভাবে গ্রহণ করা হয়েছে। প্রতারণার প্রমাণ যাচাই-বাছাই করে অ্যাডমিন প্যানেল থেকে অনুমোদন দিলে এটি ডাটাবেজে যুক্ত হবে।',
      reportId: record.id,
      ticketStatus: record.status,
    };
  }

  /**
   * Get reports submitted by the logged-in user
   */
  async getMyReports(userId: string) {
    return this.prisma.scammerRecord.findMany({
      where: { reporterId: userId },
      select: {
        id: true,
        phone: true,
        facebookLink: true,
        scammerName: true,
        category: true,
        description: true,
        amountLost: true,
        proofImages: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Admin Queue: View all records with full reporter identity & proofs
   */
  async adminGetQueue(status?: ScammerReportStatus, search?: string, page = 1, limit = 20) {
    const skip = (Math.max(1, page) - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { phone: { contains: q } },
        { facebookLink: { contains: q } },
        { scammerName: { contains: q } },
        { reporterName: { contains: q } },
        { reporterPhone: { contains: q } },
      ];
    }

    const [items, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      this.prisma.scammerRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.scammerRecord.count({ where }),
      this.prisma.scammerRecord.count({ where: { status: ScammerReportStatus.PENDING } }),
      this.prisma.scammerRecord.count({ where: { status: ScammerReportStatus.APPROVED } }),
      this.prisma.scammerRecord.count({ where: { status: ScammerReportStatus.REJECTED } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        totalAll: pendingCount + approvedCount + rejectedCount,
      },
    };
  }

  /**
   * Admin: Approve or Reject a report
   */
  async adminUpdateStatus(
    id: string,
    status: ScammerReportStatus,
    adminNotes?: string,
    rejectionReason?: string,
  ) {
    const existing = await this.prisma.scammerRecord.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Scammer report not found');
    }

    return this.prisma.scammerRecord.update({
      where: { id },
      data: {
        status,
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        ...(rejectionReason !== undefined ? { rejectionReason } : {}),
      },
    });
  }

  /**
   * Admin: Edit scammer record details
   */
  async adminUpdateRecord(id: string, dto: UpdateScammerReportDto) {
    const existing = await this.prisma.scammerRecord.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Scammer record not found');
    }

    const normalizedPhone = dto.phone !== undefined ? this.normalizePhone(dto.phone) : undefined;
    const fbNorm = dto.facebookLink !== undefined ? this.normalizeFacebook(dto.facebookLink) : undefined;

    return this.prisma.scammerRecord.update({
      where: { id },
      data: {
        ...(dto.phone !== undefined ? { phone: normalizedPhone || dto.phone?.trim() || null } : {}),
        ...(dto.facebookLink !== undefined ? { facebookLink: fbNorm?.url || dto.facebookLink?.trim() || null } : {}),
        ...(fbNorm?.uid !== undefined ? { facebookUid: fbNorm.uid } : {}),
        ...(dto.scammerName !== undefined ? { scammerName: dto.scammerName?.trim() || null } : {}),
        ...(dto.scammerPhotoUrl !== undefined ? { scammerPhotoUrl: dto.scammerPhotoUrl?.trim() || null } : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.description ? { description: dto.description.trim() } : {}),
        ...(dto.amountLost !== undefined ? { amountLost: dto.amountLost ? Number(dto.amountLost) : null } : {}),
        ...(dto.proofImages ? { proofImages: dto.proofImages } : {}),
        ...(dto.severity ? { severity: dto.severity } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.adminNotes !== undefined ? { adminNotes: dto.adminNotes } : {}),
        ...(dto.rejectionReason !== undefined ? { rejectionReason: dto.rejectionReason } : {}),
        ...(dto.warningOnlyMode !== undefined ? { warningOnlyMode: dto.warningOnlyMode } : {}),
        ...(dto.showScammerName !== undefined ? { showScammerName: dto.showScammerName } : {}),
        ...(dto.showPhonePublicly !== undefined ? { showPhonePublicly: dto.showPhonePublicly } : {}),
        ...(dto.showFacebookPublicly !== undefined ? { showFacebookPublicly: dto.showFacebookPublicly } : {}),
        ...(dto.showProofPublicly !== undefined ? { showProofPublicly: dto.showProofPublicly } : {}),
        ...(dto.showDescriptionPublicly !== undefined ? { showDescriptionPublicly: dto.showDescriptionPublicly } : {}),
        ...(dto.customWarning !== undefined ? { customWarning: dto.customWarning?.trim() || null } : {}),
      },
    });
  }

  /**
   * User: Withdraw/Delete their own report
   */
  async deleteMyReport(userId: string, id: string) {
    const existing = await this.prisma.scammerRecord.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('রিপোর্টটি পাওয়া যায়নি।');
    }
    if (existing.reporterId !== userId) {
      throw new BadRequestException('আপনি শুধুমাত্র আপনার নিজের রিপোর্ট মুছে ফেলতে পারবেন।');
    }

    await this.prisma.scammerRecord.delete({ where: { id } });
    return { success: true, message: 'আপনার রিপোর্টটি সফলভাবে প্রত্যাহার/মুছে ফেলা হয়েছে।' };
  }

  /**
   * Admin: Permanent Deletion of a record
   */
  async adminDeleteRecord(id: string) {
    const existing = await this.prisma.scammerRecord.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Scammer record not found');
    }

    await this.prisma.scammerRecord.delete({ where: { id } });
    return { success: true, message: 'রেকর্ডটি ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।' };
  }

  /**
   * Admin: Direct Scammer Entry (Bypasses review queue, immediately APPROVED)
   */
  async adminDirectCreate(adminUser: any, dto: DirectScammerRecordDto) {
    if (!dto.phone && !dto.facebookLink) {
      throw new BadRequestException('প্রতারকের মোবাইল নম্বর অথবা ফেসবুক লিংক যেকোনো একটি অবশ্যই প্রদান করতে হবে।');
    }

    const normalizedPhone = this.normalizePhone(dto.phone);
    const { url: fbUrl, uid: fbUid } = this.normalizeFacebook(dto.facebookLink);

    return this.prisma.scammerRecord.create({
      data: {
        phone: normalizedPhone || dto.phone?.trim() || null,
        facebookLink: fbUrl || dto.facebookLink?.trim() || null,
        facebookUid: fbUid,
        scammerName: dto.scammerName.trim(),
        scammerPhotoUrl: dto.scammerPhotoUrl?.trim() || null,
        category: dto.category || ScammerCategory.TRANSACTION_FRAUD,
        description: dto.description.trim(),
        amountLost: dto.amountLost ? Number(dto.amountLost) : null,
        proofImages: dto.proofImages || [],
        status: ScammerReportStatus.APPROVED,
        severity: dto.severity || 'HIGH',
        adminNotes: dto.adminNotes?.trim() || 'Admin Direct Verified Entry',
        warningOnlyMode: dto.warningOnlyMode ?? false,
        showScammerName: dto.showScammerName ?? true,
        showPhonePublicly: dto.showPhonePublicly ?? true,
        showFacebookPublicly: dto.showFacebookPublicly ?? true,
        showProofPublicly: dto.showProofPublicly ?? true,
        showDescriptionPublicly: dto.showDescriptionPublicly ?? true,
        customWarning: dto.customWarning?.trim() || null,
        reporterId: adminUser?.id || 'admin',
        reporterName: 'অ্যাডমিন সরাসরি এন্ট্রি',
        reporterPhone: 'Admin',
        reporterIp: '127.0.0.1',
      },
    });
  }

  /**
   * Admin: Toggle Master Switch for Scammer Checker
   */
  async adminToggleMaster(enabled: boolean) {
    const currentSettings = await this.settingsService.getAllSettings();
    await this.settingsService.saveSettings(
      {
        category: 'system',
        data: {
          ...currentSettings.system,
          scammerCheckerEnabled: enabled,
        },
      },
      'system',
    );
    return {
      success: true,
      scammerCheckerEnabled: enabled,
      message: enabled
        ? 'স্ক্যামার চেকার সিস্টেম সক্রিয় করা হয়েছে।'
        : 'স্ক্যামার চেকার সিস্টেম নিষ্ক্রিয় করা হয়েছে।',
    };
  }

  /**
   * Public: Get Live Social Proof activities (Concise, authentic, high-trust Bangla text)
   */
  async getSocialProofEvents() {
    const settings = await this.settingsService.getAllSettings();
    const isSocialProofEnabled = settings?.system?.socialProofEnabled !== false;

    if (!isSocialProofEnabled) {
      return { enabled: false, events: [] };
    }

    // Curated dynamic templates with short, clear proof in Bengali
    const templates = [
      {
        id: '1',
        titleBn: 'ক্যাশআউট সম্পন্ন',
        titleEn: 'Cashout Completed',
        descBn: 'তানভীর আহমেদ (ঢাকা) • ১,৫০০৳ ক্যাশআউট পেয়েছেন (বিকাশ) 🎉',
        descEn: 'Tanvir Ahmed (Dhaka) • Received 1,500৳ via bKash 🎉',
        type: 'CASHOUT',
        avatarText: 'TA',
        timeAgoBn: '২ মিনিট আগে',
        timeAgoEn: '2m ago',
      },
      {
        id: '2',
        titleBn: 'এসক্রো ডিল সম্পন্ন',
        titleEn: 'Escrow Completed',
        descBn: 'রাকিবুল হাসান ও সাইদ • পেজ এসক্রো ডিল সম্পন্ন (৫,০০০৳) 🛡️',
        descEn: 'Rakibul & Sayed • Page escrow completed (5,000৳) 🛡️',
        type: 'ESCROW',
        avatarText: 'RH',
        timeAgoBn: '৪ মিনিট আগে',
        timeAgoEn: '4m ago',
      },
      {
        id: '3',
        titleBn: 'রেফার বোনাস জমা',
        titleEn: 'Referral Bonus',
        descBn: 'নতুন মেম্বার একাউন্ট খুলে ২৫৳ বোনাস পেয়েছেন 🎁',
        descEn: 'New user joined and received 25৳ bonus 🎁',
        type: 'BONUS',
        avatarText: 'NU',
        timeAgoBn: '৭ মিনিট আগে',
        timeAgoEn: '7m ago',
      },
      {
        id: '4',
        titleBn: 'মাইক্রো-জব পেমেন্ট',
        titleEn: 'Micro Job Payout',
        descBn: 'সাদিয়া আক্তার • মাইক্রো জব উইথড্র পেয়েছেন (নগদ) ⚡',
        descEn: 'Sadia Akter • Received micro job payout via Nagad ⚡',
        type: 'JOB',
        avatarText: 'SA',
        timeAgoBn: '১১ মিনিট আগে',
        timeAgoEn: '11m ago',
      },
      {
        id: '5',
        titleBn: 'ডিজিটাল প্রোডাক্ট ডেলিভারি',
        titleEn: 'Digital Product Delivered',
        descBn: 'ফরহাদ হোসেন • গুগল প্লে কোড সফলভাবে পেয়েছেন 🎮',
        descEn: 'Farhad Hossain • Google Play code delivered 🎮',
        type: 'PRODUCT',
        avatarText: 'FH',
        timeAgoBn: '১৫ মিনিট আগে',
        timeAgoEn: '15m ago',
      },
    ];

    return {
      enabled: true,
      initialDelaySec: settings?.system?.socialProofInitialDelaySeconds ?? 5,
      intervalSec: settings?.system?.socialProofIntervalSeconds ?? 25,
      durationSec: settings?.system?.socialProofDurationSeconds ?? 8,
      events: templates,
    };
  }
}
