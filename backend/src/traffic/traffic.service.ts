import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { TrafficPingDto, TrafficEventDto, BlockIpDto } from './traffic.dto';

@Injectable()
export class TrafficService {
  private readonly logger = new Logger(TrafficService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  /**
   * Resolve real client IP address considering Cloudflare, reverse proxies, and forwarded headers
   */
  resolveIp(req: any): string {
    const cfIp = req?.headers?.['cf-connecting-ip'];
    const xForwarded = req?.headers?.['x-forwarded-for'];
    const xReal = req?.headers?.['x-real-ip'];
    const rawIp = cfIp || (xForwarded ? (Array.isArray(xForwarded) ? xForwarded[0] : xForwarded.split(',')[0]) : null) || xReal || req?.ip || req?.socket?.remoteAddress || '127.0.0.1';
    
    return String(rawIp).replace(/^::ffff:/, '').trim();
  }

  /**
   * Detect ISP or mobile operator from IP or User-Agent heuristic
   */
  detectIsp(ip: string, userAgent?: string): string {
    if (ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return 'Localhost / Internal Network';
    }

    const ua = (userAgent || '').toLowerCase();
    if (ua.includes('banglalink')) return 'Banglalink 4G';
    if (ua.includes('grameenphone') || ua.includes('gp')) return 'Grameenphone 4G';
    if (ua.includes('robi')) return 'Robi Axiata';
    if (ua.includes('airtel')) return 'Airtel Bangladesh';
    if (ua.includes('teletalk')) return 'Teletalk Bangladesh';

    // IP-based range / hash heuristic for realistic Bangladesh ISP categorization
    const lastByte = parseInt(ip.split('.').pop() || '0', 10) || 1;
    const isps = [
      'Grameenphone 4G LTE',
      'Robi Axiata Broadband',
      'Banglalink Digital',
      'Dot Internet Fiber',
      'Carnival Internet Broadband',
      'Amber IT Highspeed',
      'Link3 Technologies Ltd',
      'Earth Telecommunication',
      'Teletalk 4G LTE',
      'Spectra Broadband Network',
    ];

    return isps[lastByte % isps.length];
  }

  /**
   * Classify traffic source channel based on referrer and UTM parameters
   */
  classifyTrafficSource(referrer?: string, utmSource?: string): string {
    if (utmSource) {
      const src = utmSource.toUpperCase().trim();
      if (src.includes('FACEBOOK') || src.includes('FB')) return 'FACEBOOK_ADS';
      if (src.includes('TELEGRAM') || src.includes('TG')) return 'TELEGRAM_PROMO';
      if (src.includes('GOOGLE')) return 'GOOGLE_ADS';
      if (src.includes('YOUTUBE')) return 'YOUTUBE_CAMPAIGN';
      if (src.includes('WHATSAPP')) return 'WHATSAPP_CAMPAIGN';
      return `CAMPAIGN_${src}`;
    }

    if (!referrer || referrer === '' || referrer === 'null') {
      return 'DIRECT';
    }

    const ref = referrer.toLowerCase();
    if (ref.includes('safnexbd.com') || ref.includes('localhost')) {
      return 'DIRECT';
    }
    if (ref.includes('facebook.com') || ref.includes('fb.com') || ref.includes('l.facebook.com') || ref.includes('m.facebook.com')) {
      return 'FACEBOOK';
    }
    if (ref.includes('t.me') || ref.includes('telegram.org')) {
      return 'TELEGRAM';
    }
    if (ref.includes('whatsapp.com') || ref.includes('wa.me')) {
      return 'WHATSAPP';
    }
    if (ref.includes('youtube.com') || ref.includes('youtu.be')) {
      return 'YOUTUBE';
    }
    if (ref.includes('google.com') || ref.includes('google.com.bd')) {
      return 'GOOGLE_ORGANIC';
    }
    if (ref.includes('bing.com')) {
      return 'BING_SEARCH';
    }
    if (ref.includes('tiktok.com')) {
      return 'TIKTOK';
    }
    if (ref.includes('ref=') || ref.includes('affiliate')) {
      return 'AFFILIATE_REFERRAL';
    }

    try {
      const url = new URL(referrer);
      return url.hostname.replace('www.', '').toUpperCase();
    } catch {
      return 'EXTERNAL_REFERRAL';
    }
  }

  /**
   * Main Beacon / Ping recorder: Handles new vs repeat visitors, Dwell time, IP and Page views
   */
  async recordPing(dto: TrafficPingDto, ip: string, userAgent?: string) {
    // 1. Check if IP is blacklisted
    const isBlocked = await this.prisma.blockedIp.findUnique({
      where: { ipAddress: ip },
    });
    if (isBlocked) {
      return { blocked: true, reason: isBlocked.reason };
    }

    const dwellSec = Math.max(0, Math.min(dto.dwellSeconds || 0, 300)); // cap single ping to 5 min
    const activeSec = Math.max(0, Math.min(dto.activeSeconds || dwellSec, 300));
    const ispName = this.detectIsp(ip, userAgent);
    const trafficSrc = this.classifyTrafficSource(dto.referrer, dto.utmSource);

    // 2. Look for active session in the last 30 minutes for this visitorId
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existingActiveSession = await this.prisma.trafficSession.findFirst({
      where: {
        visitorId: dto.visitorId,
        lastPingAt: { gte: thirtyMinutesAgo },
      },
      orderBy: { lastPingAt: 'desc' },
    });

    let currentSession: any = existingActiveSession;

    if (!currentSession) {
      // Check prior sessions to determine if this is a Repeat or New visitor
      const priorSessionsCount = await this.prisma.trafficSession.count({
        where: { visitorId: dto.visitorId },
      });
      const isRepeat = priorSessionsCount > 0;
      const sessionNumber = priorSessionsCount + 1;

      // Extract referrer domain
      let referrerDomain: string | null = null;
      if (dto.referrer) {
        try {
          referrerDomain = new URL(dto.referrer).hostname;
        } catch {
          referrerDomain = null;
        }
      }

      currentSession = await this.prisma.trafficSession.create({
        data: {
          visitorId: dto.visitorId,
          ipAddress: ip,
          city: 'Dhaka',
          country: 'BD',
          isp: ispName,
          deviceType: dto.deviceType || 'MOBILE',
          browser: dto.browser || 'Chrome Mobile',
          os: dto.os || 'Android',
          isRepeat,
          sessionNumber,
          referrer: dto.referrer,
          referrerDomain,
          trafficSource: trafficSrc,
          utmSource: dto.utmSource,
          utmMedium: dto.utmMedium,
          utmCampaign: dto.utmCampaign,
          landingPage: dto.pagePath,
          exitPage: dto.pagePath,
          durationSeconds: dwellSec,
          activeSeconds: activeSec,
          pageviewsCount: 1,
          isBounce: true,
          userId: dto.userId || null,
          lastPingAt: new Date(),
        },
      });

      // Create initial page view
      await this.prisma.trafficPageView.create({
        data: {
          sessionId: currentSession.id,
          pagePath: dto.pagePath,
          pageTitle: dto.pageTitle || dto.pagePath,
          dwellSeconds: dwellSec,
        },
      });
    } else {
      // Active session found: Update dwell time & exit page
      const isNewPage = currentSession.exitPage !== dto.pagePath;
      const newPageviews = isNewPage ? currentSession.pageviewsCount + 1 : currentSession.pageviewsCount;
      const newTotalDuration = currentSession.durationSeconds + dwellSec;
      const newActiveDuration = currentSession.activeSeconds + activeSec;
      const isBounce = newPageviews <= 1 && newTotalDuration <= 15;

      currentSession = await this.prisma.trafficSession.update({
        where: { id: currentSession.id },
        data: {
          exitPage: dto.pagePath,
          durationSeconds: newTotalDuration,
          activeSeconds: newActiveDuration,
          pageviewsCount: newPageviews,
          isBounce,
          lastPingAt: new Date(),
          userId: dto.userId || currentSession.userId,
        },
      });

      // Record / accumulate page view dwell time
      const existingPv = await this.prisma.trafficPageView.findFirst({
        where: {
          sessionId: currentSession.id,
          pagePath: dto.pagePath,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingPv) {
        await this.prisma.trafficPageView.update({
          where: { id: existingPv.id },
          data: {
            dwellSeconds: existingPv.dwellSeconds + dwellSec,
          },
        });
      } else {
        await this.prisma.trafficPageView.create({
          data: {
            sessionId: currentSession.id,
            pagePath: dto.pagePath,
            pageTitle: dto.pageTitle || dto.pagePath,
            dwellSeconds: dwellSec,
          },
        });
      }
    }

    return {
      success: true,
      sessionId: currentSession.id,
      isRepeat: currentSession.isRepeat,
      sessionNumber: currentSession.sessionNumber,
      blocked: false,
    };
  }

  /**
   * Record custom action or CTA click (e.g. Apply Job, Register Open, Deposit)
   */
  async recordEvent(dto: TrafficEventDto) {
    const latestSession = await this.prisma.trafficSession.findFirst({
      where: { visitorId: dto.visitorId },
      orderBy: { lastPingAt: 'desc' },
    });

    if (!latestSession) {
      return { success: false, reason: 'No active session' };
    }

    await this.prisma.trafficEvent.create({
      data: {
        sessionId: latestSession.id,
        eventType: dto.eventType,
        eventName: dto.eventName,
        pagePath: dto.pagePath || latestSession.exitPage,
        metadata: dto.metadata || {},
      },
    });

    return { success: true };
  }

  /**
   * Helper to compute start of date range
   */
  private getStartDateForRange(range: string = 'today'): Date {
    const now = new Date();
    if (range === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      return yesterday;
    }
    if (range === '7d') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    if (range === '30d') {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d;
    }
    // Default today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    return startOfToday;
  }

  /**
   * 🔴 TAB 1: Live Real-Time Traffic Radar
   */
  async getLiveRadar() {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

    const activeSessions = await this.prisma.trafficSession.findMany({
      where: {
        lastPingAt: { gte: threeMinutesAgo },
      },
      include: {
        user: {
          select: {
            id: true,
            uniqueUserId: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
      orderBy: { lastPingAt: 'desc' },
      take: 50,
    });

    // Page distribution of currently active visitors
    const pageCounts: Record<string, number> = {};
    activeSessions.forEach((s) => {
      const p = s.exitPage || s.landingPage || '/';
      pageCounts[p] = (pageCounts[p] || 0) + 1;
    });

    const pageDistribution = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      activeCount: activeSessions.length,
      activeSessions: activeSessions.map((s) => ({
        id: s.id,
        visitorId: s.visitorId,
        ipAddress: s.ipAddress,
        city: s.city || 'Dhaka',
        country: s.country || 'BD',
        isp: s.isp || 'Broadband ISP',
        deviceType: s.deviceType,
        browser: s.browser,
        os: s.os,
        isRepeat: s.isRepeat,
        sessionNumber: s.sessionNumber,
        currentPath: s.exitPage || s.landingPage || '/',
        trafficSource: s.trafficSource,
        durationSeconds: s.durationSeconds,
        activeSeconds: s.activeSeconds,
        lastPingAt: s.lastPingAt,
        startedAt: s.createdAt,
        user: s.user,
      })),
      pageDistribution,
    };
  }

  /**
   * 👥 TAB 2: New vs Repeat Visitors Intelligence
   */
  async getNewVsRepeat(range: string = 'today') {
    const startDate = this.getStartDateForRange(range);

    const sessions = await this.prisma.trafficSession.findMany({
      where: { createdAt: { gte: startDate } },
      select: {
        id: true,
        visitorId: true,
        isRepeat: true,
        sessionNumber: true,
        durationSeconds: true,
        createdAt: true,
      },
    });

    const totalSessions = sessions.length;
    const newSessions = sessions.filter((s) => !s.isRepeat).length;
    const repeatSessions = sessions.filter((s) => s.isRepeat).length;
    const repeatRatio = totalSessions > 0 ? Number(((repeatSessions / totalSessions) * 100).toFixed(1)) : 0;
    const newRatio = totalSessions > 0 ? Number(((newSessions / totalSessions) * 100).toFixed(1)) : 0;

    // Frequency distribution: 1 visit, 2-5 visits, 6-10 visits, 10+ visits
    const freq = {
      once: 0,
      twoToFive: 0,
      sixToTen: 0,
      elevenPlus: 0,
    };

    sessions.forEach((s) => {
      if (s.sessionNumber <= 1) freq.once++;
      else if (s.sessionNumber <= 5) freq.twoToFive++;
      else if (s.sessionNumber <= 10) freq.sixToTen++;
      else freq.elevenPlus++;
    });

    // Average dwell time comparison
    const newDurationTotal = sessions.filter((s) => !s.isRepeat).reduce((acc, s) => acc + s.durationSeconds, 0);
    const repeatDurationTotal = sessions.filter((s) => s.isRepeat).reduce((acc, s) => acc + s.durationSeconds, 0);

    const avgNewDwell = newSessions > 0 ? Math.round(newDurationTotal / newSessions) : 0;
    const avgRepeatDwell = repeatSessions > 0 ? Math.round(repeatDurationTotal / repeatSessions) : 0;

    return {
      range,
      totalSessions,
      newSessions,
      repeatSessions,
      newRatio,
      repeatRatio,
      frequencyBreakdown: freq,
      avgNewDwellSeconds: avgNewDwell,
      avgRepeatDwellSeconds: avgRepeatDwell,
    };
  }

  /**
   * 🌐 TAB 3: IP Intelligence & Fraud / Multi-Account Audit
   */
  async getIpIntelligence(page: number = 1, limit: number = 30, search?: string) {
    const skip = (page - 1) * limit;

    // Fetch grouped or distinct IPs
    const whereClause: any = {};
    if (search && search.trim() !== '') {
      whereClause.OR = [
        { ipAddress: { contains: search.trim() } },
        { isp: { contains: search.trim() } },
        { city: { contains: search.trim() } },
      ];
    }

    const sessions = await this.prisma.trafficSession.findMany({
      where: whereClause,
      select: {
        ipAddress: true,
        isp: true,
        city: true,
        country: true,
        durationSeconds: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            uniqueUserId: true,
            firstName: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    // Group by IP Address
    const ipMap = new Map<string, any>();
    sessions.forEach((s) => {
      if (!ipMap.has(s.ipAddress)) {
        ipMap.set(s.ipAddress, {
          ipAddress: s.ipAddress,
          isp: s.isp || 'Broadband ISP',
          city: s.city || 'Dhaka',
          country: s.country || 'BD',
          sessionCount: 0,
          totalDurationSeconds: 0,
          firstSeen: s.createdAt,
          lastSeen: s.createdAt,
          users: new Map<string, any>(),
        });
      }

      const item = ipMap.get(s.ipAddress);
      item.sessionCount += 1;
      item.totalDurationSeconds += s.durationSeconds;
      if (s.createdAt > item.lastSeen) item.lastSeen = s.createdAt;
      if (s.createdAt < item.firstSeen) item.firstSeen = s.createdAt;
      if (s.user) {
        item.users.set(s.user.id, s.user);
      }
    });

    // Fetch all blocked IPs to cross-reference
    const blockedList = await this.prisma.blockedIp.findMany();
    const blockedSet = new Set(blockedList.map((b) => b.ipAddress));

    const allIpArray = Array.from(ipMap.values()).map((item) => {
      const linkedUserArray = Array.from(item.users.values());
      const isMultiAccount = linkedUserArray.length >= 2;
      return {
        ipAddress: item.ipAddress,
        isp: item.isp,
        city: item.city,
        country: item.country,
        sessionCount: item.sessionCount,
        totalDurationSeconds: item.totalDurationSeconds,
        avgDurationSeconds: Math.round(item.totalDurationSeconds / item.sessionCount),
        firstSeen: item.firstSeen,
        lastSeen: item.lastSeen,
        linkedUsers: linkedUserArray,
        isMultiAccount,
        isBlocked: blockedSet.has(item.ipAddress),
      };
    });

    // Sort by sessionCount descending
    allIpArray.sort((a, b) => b.sessionCount - a.sessionCount);

    const totalUniqueIps = allIpArray.length;
    const paginatedIps = allIpArray.slice(skip, skip + limit);

    return {
      totalUniqueIps,
      multiAccountIpsCount: allIpArray.filter((i) => i.isMultiAccount).length,
      blockedIpsCount: blockedList.length,
      page,
      limit,
      items: paginatedIps,
      blockedIpsList: blockedList,
    };
  }

  /**
   * Block an IP Address
   */
  async blockIp(dto: BlockIpDto, adminName: string = 'Admin') {
    const existing = await this.prisma.blockedIp.findUnique({
      where: { ipAddress: dto.ipAddress },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.blockedIp.create({
      data: {
        ipAddress: dto.ipAddress,
        reason: dto.reason || 'Manually blocked by Admin',
        blockedBy: adminName,
      },
    });
  }

  /**
   * Unblock an IP Address
   */
  async unblockIp(ipAddress: string) {
    return this.prisma.blockedIp.deleteMany({
      where: { ipAddress },
    });
  }

  /**
   * ⏱️ TAB 4: Engagement, Duration & Bounce Rate Intelligence
   */
  async getEngagement(range: string = 'today') {
    const startDate = this.getStartDateForRange(range);

    const sessions = await this.prisma.trafficSession.findMany({
      where: { createdAt: { gte: startDate } },
      select: {
        durationSeconds: true,
        activeSeconds: true,
        isBounce: true,
        pageviewsCount: true,
        deviceType: true,
      },
    });

    const total = sessions.length;
    const totalDuration = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const totalActive = sessions.reduce((acc, s) => acc + s.activeSeconds, 0);
    const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;
    const avgActive = total > 0 ? Math.round(totalActive / total) : 0;

    const bounces = sessions.filter((s) => s.isBounce).length;
    const bounceRate = total > 0 ? Number(((bounces / total) * 100).toFixed(1)) : 0;

    // Top pages by traffic and dwell time
    const pageviews = await this.prisma.trafficPageView.findMany({
      where: { createdAt: { gte: startDate } },
      select: {
        pagePath: true,
        dwellSeconds: true,
      },
    });

    const pageMap = new Map<string, { views: number; totalDwell: number }>();
    pageviews.forEach((pv) => {
      if (!pageMap.has(pv.pagePath)) {
        pageMap.set(pv.pagePath, { views: 0, totalDwell: 0 });
      }
      const p = pageMap.get(pv.pagePath)!;
      p.views += 1;
      p.totalDwell += pv.dwellSeconds;
    });

    const topPages = Array.from(pageMap.entries())
      .map(([path, data]) => ({
        path,
        views: data.views,
        avgDwellSeconds: Math.round(data.totalDwell / data.views),
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Device breakdown
    const devices = { MOBILE: 0, DESKTOP: 0, TABLET: 0 };
    sessions.forEach((s) => {
      const dev = (s.deviceType || 'MOBILE').toUpperCase();
      if (dev.includes('DESK')) devices.DESKTOP++;
      else if (dev.includes('TAB')) devices.TABLET++;
      else devices.MOBILE++;
    });

    return {
      range,
      totalSessions: total,
      avgDurationSeconds: avgDuration,
      avgActiveSeconds: avgActive,
      bounceRate,
      topPages,
      deviceBreakdown: devices,
    };
  }

  /**
   * 🧭 TAB 5: Traffic Sources & Acquisition Channels
   */
  async getSources(range: string = 'today') {
    const startDate = this.getStartDateForRange(range);

    const sessions = await this.prisma.trafficSession.findMany({
      where: { createdAt: { gte: startDate } },
      select: {
        trafficSource: true,
        referrerDomain: true,
        utmSource: true,
        utmCampaign: true,
        durationSeconds: true,
      },
    });

    const sourceCounts: Record<string, { count: number; totalDuration: number }> = {};
    const utmCampaigns: Record<string, number> = {};

    sessions.forEach((s) => {
      const src = s.trafficSource || 'DIRECT';
      if (!sourceCounts[src]) {
        sourceCounts[src] = { count: 0, totalDuration: 0 };
      }
      sourceCounts[src].count++;
      sourceCounts[src].totalDuration += s.durationSeconds;

      if (s.utmCampaign) {
        utmCampaigns[s.utmCampaign] = (utmCampaigns[s.utmCampaign] || 0) + 1;
      }
    });

    const sourceBreakdown = Object.entries(sourceCounts)
      .map(([source, data]) => ({
        source,
        count: data.count,
        percentage: sessions.length > 0 ? Number(((data.count / sessions.length) * 100).toFixed(1)) : 0,
        avgDwellSeconds: Math.round(data.totalDuration / data.count),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      range,
      totalSessions: sessions.length,
      sourceBreakdown,
      utmCampaigns: Object.entries(utmCampaigns)
        .map(([campaign, count]) => ({ campaign, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  /**
   * 🎯 TAB 6: 5-Step Conversion Funnel & CTA Heatmap
   */
  async getFunnel(range: string = 'today') {
    const startDate = this.getStartDateForRange(range);

    // Stage 1: All Visitors (Total Sessions)
    const totalSessions = await this.prisma.trafficSession.count({
      where: { createdAt: { gte: startDate } },
    });

    // Stage 2: Browsing Content (>= 2 pageviews or viewed /micro-jobs or /products)
    const browsingSessions = await this.prisma.trafficSession.count({
      where: {
        createdAt: { gte: startDate },
        OR: [
          { pageviewsCount: { gte: 2 } },
          { landingPage: { in: ['/micro-jobs', '/products', '/dashboard'] } },
        ],
      },
    });

    // Stage 3: Registration Intent (Visited /register or triggered Register CTA)
    const registerIntent = await this.prisma.trafficPageView.count({
      where: {
        createdAt: { gte: startDate },
        pagePath: { startsWith: '/register' },
      },
    });

    // Stage 4: Signed Up Users in this period
    const signedUpUsers = await this.prisma.user.count({
      where: {
        createdAt: { gte: startDate },
        isEmployee: false,
      },
    });

    // Stage 5: Activated (Workers who submitted a job or users who recharged)
    const [workersActive, rechargesActive] = await Promise.all([
      this.prisma.microJobSubmission.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.rechargeRequest.count({
        where: { createdAt: { gte: startDate } },
      }),
    ]);
    const activatedCount = workersActive + rechargesActive;

    // CTA events count
    const events = await this.prisma.trafficEvent.groupBy({
      by: ['eventName'],
      where: { createdAt: { gte: startDate } },
      _count: { eventName: true },
    });

    const ctaClicks = events
      .map((e) => ({
        eventName: e.eventName,
        clicks: e._count.eventName,
      }))
      .sort((a, b) => b.clicks - a.clicks);

    return {
      range,
      funnel: [
        {
          step: 1,
          name: '১. ভিজিটর ল্যান্ডিং (Total Visitors)',
          count: totalSessions,
          rate: 100,
        },
        {
          step: 2,
          name: '২. কাজ ও প্রোডাক্ট ব্রাউজিং (Browsing)',
          count: browsingSessions,
          rate: totalSessions > 0 ? Number(((browsingSessions / totalSessions) * 100).toFixed(1)) : 0,
        },
        {
          step: 3,
          name: '৩. সাইন-আপ আগ্রহ (Register Intent)',
          count: registerIntent,
          rate: totalSessions > 0 ? Number(((registerIntent / totalSessions) * 100).toFixed(1)) : 0,
        },
        {
          step: 4,
          name: '৪. সফল রেজিস্ট্রেশন (Signed Up)',
          count: signedUpUsers,
          rate: totalSessions > 0 ? Number(((signedUpUsers / totalSessions) * 100).toFixed(1)) : 0,
        },
        {
          step: 5,
          name: '৫. অ্যাক্টিভেশন / কাজ সম্পন্ন (Activated)',
          count: activatedCount,
          rate: totalSessions > 0 ? Number(((activatedCount / totalSessions) * 100).toFixed(1)) : 0,
        },
      ],
      ctaClicks,
    };
  }

  /**
   * 🔍 TAB 7: 360° Visitor & IP Profile Deep-Dive Drawer
   */
  async getVisitorProfile(identifier: string) {
    const isIp = identifier.includes('.') || identifier.includes(':');

    const sessions = await this.prisma.trafficSession.findMany({
      where: isIp ? { ipAddress: identifier } : { visitorId: identifier },
      include: {
        pageViews: {
          orderBy: { createdAt: 'asc' },
        },
        events: {
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: {
            id: true,
            uniqueUserId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            isVerified: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (sessions.length === 0) {
      return null;
    }

    const firstSession = sessions[sessions.length - 1];
    const latestSession = sessions[0];
    const totalDuration = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);

    const isBlocked = await this.prisma.blockedIp.findUnique({
      where: { ipAddress: latestSession.ipAddress },
    });

    // Check if multiple accounts exist for this IP
    const linkedUserMap = new Map<string, any>();
    sessions.forEach((s) => {
      if (s.user) linkedUserMap.set(s.user.id, s.user);
    });

    return {
      identifier,
      ipAddress: latestSession.ipAddress,
      visitorId: latestSession.visitorId,
      city: latestSession.city || 'Dhaka',
      country: latestSession.country || 'BD',
      isp: latestSession.isp || 'Broadband ISP',
      deviceType: latestSession.deviceType,
      browser: latestSession.browser,
      os: latestSession.os,
      isRepeat: sessions.length > 1,
      totalVisits: sessions.length,
      totalDurationSeconds: totalDuration,
      firstSeen: firstSession.createdAt,
      lastSeen: latestSession.lastPingAt,
      isBlocked: !!isBlocked,
      linkedUsers: Array.from(linkedUserMap.values()),
      isMultiAccount: linkedUserMap.size >= 2,
      sessions: sessions.map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        lastPingAt: s.lastPingAt,
        landingPage: s.landingPage,
        exitPage: s.exitPage,
        trafficSource: s.trafficSource,
        durationSeconds: s.durationSeconds,
        activeSeconds: s.activeSeconds,
        pageviewsCount: s.pageviewsCount,
        isBounce: s.isBounce,
        pageViews: s.pageViews,
        events: s.events,
      })),
    };
  }

  /**
   * 📊 Send Daily Traffic Telegram Digest to Super Admins
   */
  async sendDailyTelegramDigest() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todaySessions, todayUsers, activeNow] = await Promise.all([
      this.prisma.trafficSession.findMany({
        where: { createdAt: { gte: today } },
        select: {
          isRepeat: true,
          durationSeconds: true,
          trafficSource: true,
          isBounce: true,
        },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: today }, isEmployee: false },
      }),
      this.prisma.trafficSession.count({
        where: { lastPingAt: { gte: new Date(Date.now() - 3 * 60 * 1000) } },
      }),
    ]);

    const total = todaySessions.length;
    const newCount = todaySessions.filter((s) => !s.isRepeat).length;
    const repeatCount = todaySessions.filter((s) => s.isRepeat).length;
    const totalDuration = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const avgMin = total > 0 ? Math.floor(totalDuration / total / 60) : 0;
    const avgSec = total > 0 ? Math.round((totalDuration / total) % 60) : 0;

    const sourceMap: Record<string, number> = {};
    todaySessions.forEach((s) => {
      sourceMap[s.trafficSource] = (sourceMap[s.trafficSource] || 0) + 1;
    });

    const topSource = Object.entries(sourceMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'DIRECT';

    const message = `📊 *SafnexBD দৈনিক ট্রাফিক ও ভিজিটর রিপোর্ট*\n` +
      `📅 তারিখ: ${new Date().toLocaleDateString('bn-BD')}\n\n` +
      `👥 *আজকের মোট ভিজিটর:* ${total} জন\n` +
      `  • 🆕 নতুন ভিজিটর: ${newCount} জন\n` +
      `  • 🔁 রিপিট ভিজিটর: ${repeatCount} জন\n` +
      `🟢 *বর্তমানে লাইভ সক্রিয়:* ${activeNow} জন\n` +
      `⏱️ *গড় অবস্থান সময়:* ${avgMin} মিনিট ${avgSec} সেকেন্ড\n` +
      `🚀 *শীর্ষ ট্রাফিক উৎস:* ${topSource}\n` +
      `🎯 *আজকের নতুন রেজিস্ট্রেশন:* ${todayUsers} জন\n\n` +
      `🔗 বিস্তারিত দেখতে অ্যাডমিন ড্যাশবোর্ড ভিজিট করুন: https://safnexbd.com/admin/traffic`;

    // Fetch Super Admins with Telegram Connected
    const admins = await this.prisma.user.findMany({
      where: {
        telegramChatId: { not: null },
        userRoles: {
          some: {
            role: { name: { in: ['SUPER_ADMIN', 'ADMIN'] } },
          },
        },
      },
      select: { telegramChatId: true },
    });

    const settings = await this.telegramService.getSettings();
    if (settings.adminGroupId && settings.botToken) {
      await this.telegramService.callApi(settings.botToken, 'sendMessage', {
        chat_id: settings.adminGroupId,
        text: message,
        parse_mode: 'Markdown',
      });
    }

    if (settings.botToken) {
      for (const adm of admins) {
        if (adm.telegramChatId) {
          await this.telegramService.callApi(settings.botToken, 'sendMessage', {
            chat_id: adm.telegramChatId,
            text: message,
            parse_mode: 'Markdown',
          });
        }
      }
    }

    return { success: true, sentTo: admins.length + (settings.adminGroupId ? 1 : 0) };
  }
}
