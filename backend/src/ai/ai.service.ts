import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

export interface AiAnalysisResult {
  riskScore: number; // 0 - 100
  category: 'NORMAL' | 'OFF_PLATFORM_BYPASS' | 'SCAM_PHISHING' | 'HARASSMENT' | 'DEAL_PROPOSAL';
  reason: string;
  detectedKeywords: string[];
  dealTerms?: {
    detected: boolean;
    amount?: number | null;
    title?: string | null;
  };
}

export interface DisputeDossierResult {
  executiveSummary: string;
  timeline: Array<{ time: string; event: string; actor: string }>;
  buyerArguments: string[];
  sellerArguments: string[];
  evidenceFindings: string[];
  recommendedVerdict: 'REFUND_SENDER' | 'RELEASE_RECEIVER' | 'PARTIAL_SPLIT' | 'MANUAL_INVESTIGATION';
  recommendedSplit?: { senderPercent: number; receiverPercent: number };
  justification: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  // Fast-path heuristic regex patterns for Bangladesh context
  private readonly phoneRegex = /(?:\+?880|0)[\s.-]*1[3-9][\s.-]*(?:\d[\s.-]*){8}/i;
  private readonly bnPhoneRegex = /(?:(\+৮৮০|০)[\s.-]*)?১[৩-৯][\s.-]*(?:[০-৯][\s.-]*){8}/;
  private readonly bypassKeywords = [
    'bkash',
    'b-kash',
    'বিকাশ',
    'nagad',
    'নগদ',
    'rocket',
    'রকেট',
    'upay',
    'উপায়',
    'whatsapp',
    'whats-app',
    'হোয়াটসঅ্যাপ',
    'wa.me',
    't.me',
    'telegram',
    'টেলিগ্রাম',
    'imo',
    'ইমো',
    'direct send',
    'direct pay',
    'বাইরে পেমেন্ট',
    'বাইরে দেন',
    'ব্যক্তিগত একাউন্ট',
    'ব্যক্তিগত নাম্বার',
    'send money',
    'ক্যাশআউট',
    'ক্যাশ আউট',
  ];

  private readonly scamKeywords = [
    'otp',
    'ওটিপি',
    'password',
    'পাসওয়ার্ড',
    'pin code',
    'পিন কোড',
    'pin number',
    'সিক্রেট কোড',
    'secret code',
    'ভেরিফিকেশন কোড',
    'verification code',
    'login link',
    'লগইন লিংক',
  ];

  constructor(private settingsService: SettingsService) {}

  /**
   * Fast heuristic check before calling LLM
   */
  detectHeuristicRisks(text: string): {
    hasRisk: boolean;
    score: number;
    category: AiAnalysisResult['category'];
    keywords: string[];
  } {
    if (!text) return { hasRisk: false, score: 0, category: 'NORMAL', keywords: [] };

    const lower = text.toLowerCase();
    const foundKeywords: string[] = [];

    // Check scam keywords first (highest severity)
    for (const kw of this.scamKeywords) {
      if (lower.includes(kw)) {
        foundKeywords.push(kw);
      }
    }
    if (foundKeywords.length > 0) {
      return {
        hasRisk: true,
        score: 95,
        category: 'SCAM_PHISHING',
        keywords: foundKeywords,
      };
    }

    // Check bypass keywords & phone numbers
    const hasPhone = this.phoneRegex.test(text) || this.bnPhoneRegex.test(text);
    for (const kw of this.bypassKeywords) {
      if (lower.includes(kw)) {
        foundKeywords.push(kw);
      }
    }

    if (hasPhone) {
      foundKeywords.push('PHONE_NUMBER_DETECTED');
    }

    if (hasPhone && foundKeywords.length > 1) {
      return {
        hasRisk: true,
        score: 90,
        category: 'OFF_PLATFORM_BYPASS',
        keywords: foundKeywords,
      };
    }

    if (hasPhone) {
      return {
        hasRisk: true,
        score: 75,
        category: 'OFF_PLATFORM_BYPASS',
        keywords: foundKeywords,
      };
    }

    if (foundKeywords.length > 0) {
      return {
        hasRisk: true,
        score: 70,
        category: 'OFF_PLATFORM_BYPASS',
        keywords: foundKeywords,
      };
    }

    return { hasRisk: false, score: 0, category: 'NORMAL', keywords: [] };
  }

  /**
   * Analyze a single chat message with AI (Gemini / OpenAI)
   */
  async analyzeChatMessage(
    content: string,
    recentContext: Array<{ sender: string; text: string }> = [],
  ): Promise<AiAnalysisResult> {
    const aiConfig = await this.settingsService.getAiSettings();

    // Fast-path heuristic detection
    const heuristic = this.detectHeuristicRisks(content);

    if (!aiConfig.enabled || !aiConfig.apiKey) {
      // If AI is disabled or key not provided, return heuristic result
      return {
        riskScore: heuristic.score,
        category: heuristic.category,
        reason: heuristic.hasRisk
          ? `Heuristic detection flagged keywords: ${heuristic.keywords.join(', ')}`
          : 'Clean message (Heuristic check)',
        detectedKeywords: heuristic.keywords,
        dealTerms: { detected: false },
      };
    }

    // Build LLM prompt
    const systemPrompt = `You are the AI Safety & Fraud Prevention Engine for SafnexBD, a secure digital escrow marketplace in Bangladesh.
Your task is to analyze user chat messages (Bengali, English, or Banglish) for:
1. OFF_PLATFORM_BYPASS: Asking to pay or communicate outside SafnexBD (personal bKash/Nagad/Rocket numbers, WhatsApp, Telegram, personal bank accounts).
2. SCAM_PHISHING: Asking for OTPs, passwords, PINs, or deceptive links.
3. DEAL_PROPOSAL: User proposing a specific price or task (e.g., "আমি ২০০০ টাকায় লোগো ডিজাইন করব").
4. NORMAL: Safe, standard conversation.

Respond STRICTLY in valid JSON with this format:
{
  "riskScore": <integer 0-100>,
  "category": "NORMAL" | "OFF_PLATFORM_BYPASS" | "SCAM_PHISHING" | "HARASSMENT" | "DEAL_PROPOSAL",
  "reason": "<short explanation in Bengali or English>",
  "detectedKeywords": ["<list of suspicious words or detected numbers>"],
  "dealTerms": {
    "detected": <boolean>,
    "amount": <number or null>,
    "title": "<deal title or null>"
  }
}`;

    const contextFormatted = recentContext
      .slice(-4)
      .map((c) => `${c.sender}: ${c.text}`)
      .join('\n');

    const userPrompt = `Recent context:
${contextFormatted || 'None'}

Current message to analyze:
"${content}"`;

    try {
      if (aiConfig.provider === 'OPENAI') {
        const response = await this.callOpenAi(
          aiConfig.apiKey,
          aiConfig.modelName || 'gpt-4o-mini',
          systemPrompt,
          userPrompt,
        );
        return this.parseAiResponse(response, heuristic);
      } else if (aiConfig.provider === 'QWEN' || aiConfig.provider === 'CUSTOM') {
        let effectiveKey = (aiConfig.apiKey || '').trim();
        let endpoint = (aiConfig.baseUrl || '').trim();

        if (endpoint.startsWith('sk-') || endpoint.startsWith('gsk_')) {
          if (!effectiveKey || !effectiveKey.startsWith('sk-')) {
            effectiveKey = endpoint;
          }
          endpoint = '';
        }

        if (!endpoint) {
          if (effectiveKey.startsWith('sk-or-')) {
            endpoint = 'https://openrouter.ai/api/v1';
          } else if (effectiveKey.startsWith('gsk_')) {
            endpoint = 'https://api.groq.com/openai/v1';
          } else {
            endpoint = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
          }
        } else if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
          endpoint = `https://${endpoint}`;
        }

        const response = await this.callOpenAi(
          effectiveKey,
          aiConfig.modelName || (effectiveKey.startsWith('sk-or-') ? 'qwen/qwen-2.5-72b-instruct' : 'qwen-plus'),
          systemPrompt,
          userPrompt,
          endpoint,
        );
        return this.parseAiResponse(response, heuristic);
      } else {
        // Default to GEMINI
        const response = await this.callGemini(
          aiConfig.apiKey,
          aiConfig.modelName || 'gemini-2.0-flash',
          systemPrompt,
          userPrompt,
        );
        return this.parseAiResponse(response, heuristic);
      }
    } catch (err: any) {
      this.logger.warn(`AI analysis call failed, falling back to heuristic: ${err.message}`);
      return {
        riskScore: heuristic.score,
        category: heuristic.category,
        reason: heuristic.hasRisk
          ? `Heuristic detection (AI fallback): ${heuristic.keywords.join(', ')}`
          : 'Clean message (Heuristic check)',
        detectedKeywords: heuristic.keywords,
        dealTerms: { detected: false },
      };
    }
  }

  /**
   * Generate Dispute Dossier & Arbitration Recommendation for Admin
   */
  async generateDisputeDossier(
    disputeData: {
      id: string;
      reason: string;
      transaction: {
        trackingNumber?: string;
        amount: string;
        senderName: string;
        receiverName: string;
        status: string;
      };
    },
    chatMessages: Array<{ senderName: string; text: string; time: string }>,
    workLogs: Array<{ notes: string; proofUrls?: string[]; time: string }>,
    evidenceList: Array<{ description?: string; fileType: string; uploadedBy: string }>,
  ): Promise<DisputeDossierResult> {
    const aiConfig = await this.settingsService.getAiSettings();

    const systemPrompt = `You are a Senior Escrow Arbitrator & Dispute Investigator for SafnexBD, a secure digital escrow marketplace in Bangladesh.
Review the dispute details, transaction terms, chat history, work logs, and evidence between the Buyer (Sender) and Seller (Receiver).
Generate a fair, neutral, and rigorous case dossier.

Return ONLY a valid JSON object matching this schema:
{
  "executiveSummary": "<2-3 sentence overview of the core dispute>",
  "timeline": [
    { "time": "<timestamp or step>", "event": "<event description>", "actor": "BUYER" | "SELLER" | "SYSTEM" }
  ],
  "buyerArguments": ["<key points made by buyer>"],
  "sellerArguments": ["<key points made by seller>"],
  "evidenceFindings": ["<evaluation of work logs and evidence>"],
  "recommendedVerdict": "REFUND_SENDER" | "RELEASE_RECEIVER" | "PARTIAL_SPLIT" | "MANUAL_INVESTIGATION",
  "recommendedSplit": { "senderPercent": 50, "receiverPercent": 50 },
  "justification": "<detailed rationale for the admin based on escrow rules and proof of work>"
}`;

    const userPrompt = `
DISPUTE DETAILS:
Dispute ID: ${disputeData.id}
Reason: ${disputeData.reason}
Transaction: ${disputeData.transaction.trackingNumber || 'N/A'} (Amount: ৳${disputeData.transaction.amount})
Buyer: ${disputeData.transaction.senderName}
Seller: ${disputeData.transaction.receiverName}
Status: ${disputeData.transaction.status}

CHAT HISTORY (LAST 30 MESSAGES):
${chatMessages.map((m) => `[${m.time}] ${m.senderName}: ${m.text}`).join('\n') || 'No chat history'}

WORK LOGS SUBMITTED BY SELLER:
${workLogs.map((w) => `[${w.time}] Notes: ${w.notes} (Proofs: ${w.proofUrls?.length || 0})`).join('\n') || 'None'}

EVIDENCE FILES:
${evidenceList.map((e) => `Uploaded by ${e.uploadedBy}: ${e.description || 'Evidence file'} (${e.fileType})`).join('\n') || 'None'}
`;

    if (!aiConfig.apiKey) {
      return {
        executiveSummary: `Dispute on transaction ${disputeData.transaction.trackingNumber || disputeData.id} for ৳${disputeData.transaction.amount}. AI key not configured.`,
        timeline: [{ time: new Date().toISOString(), event: 'Dispute opened', actor: 'BUYER' }],
        buyerArguments: [disputeData.reason],
        sellerArguments: ['Awaiting review'],
        evidenceFindings: ['Evidence files submitted'],
        recommendedVerdict: 'MANUAL_INVESTIGATION',
        justification: 'AI API key not configured. Please review chat history and evidence manually.',
      };
    }

    try {
      let rawText = '';
      if (aiConfig.provider === 'OPENAI') {
        rawText = await this.callOpenAi(
          aiConfig.apiKey,
          aiConfig.modelName || 'gpt-4o-mini',
          systemPrompt,
          userPrompt,
        );
      } else if (aiConfig.provider === 'QWEN' || aiConfig.provider === 'CUSTOM') {
        let effectiveKey = (aiConfig.apiKey || '').trim();
        let endpoint = (aiConfig.baseUrl || '').trim();

        if (endpoint.startsWith('sk-') || endpoint.startsWith('gsk_')) {
          if (!effectiveKey || !effectiveKey.startsWith('sk-')) {
            effectiveKey = endpoint;
          }
          endpoint = '';
        }

        if (!endpoint) {
          if (effectiveKey.startsWith('sk-or-')) {
            endpoint = 'https://openrouter.ai/api/v1';
          } else if (effectiveKey.startsWith('gsk_')) {
            endpoint = 'https://api.groq.com/openai/v1';
          } else {
            endpoint = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
          }
        } else if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
          endpoint = `https://${endpoint}`;
        }

        rawText = await this.callOpenAi(
          effectiveKey,
          aiConfig.modelName || (effectiveKey.startsWith('sk-or-') ? 'qwen/qwen-2.5-72b-instruct' : 'qwen-plus'),
          systemPrompt,
          userPrompt,
          endpoint,
        );
      } else {
        rawText = await this.callGemini(
          aiConfig.apiKey,
          aiConfig.modelName || 'gemini-2.0-flash',
          systemPrompt,
          userPrompt,
        );
      }

      const parsed = this.cleanAndParseJson(rawText);
      return {
        executiveSummary: parsed.executiveSummary || 'Dispute summary generated.',
        timeline: parsed.timeline || [],
        buyerArguments: parsed.buyerArguments || [],
        sellerArguments: parsed.sellerArguments || [],
        evidenceFindings: parsed.evidenceFindings || [],
        recommendedVerdict: parsed.recommendedVerdict || 'MANUAL_INVESTIGATION',
        recommendedSplit: parsed.recommendedSplit,
        justification: parsed.justification || 'Review all evidence before making a final decision.',
      };
    } catch (err: any) {
      this.logger.error('Failed to generate AI dispute dossier:', err);
      return {
        executiveSummary: `Dispute investigation for ${disputeData.transaction.trackingNumber || disputeData.id}. Error generating AI dossier: ${err.message}`,
        timeline: [{ time: new Date().toISOString(), event: 'Dispute opened', actor: 'BUYER' }],
        buyerArguments: [disputeData.reason],
        sellerArguments: [],
        evidenceFindings: [],
        recommendedVerdict: 'MANUAL_INVESTIGATION',
        justification: 'An error occurred during AI analysis. Admin must review manually.',
      };
    }
  }

  // --- HTTP Handlers for Gemini & OpenAI ---

  private async callGemini(
    apiKey: string,
    model: string,
    systemInstruction: string,
    prompt: string,
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\n${prompt}` }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gemini API HTTP ${res.status}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  }

  private async callOpenAi(
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    baseUrl: string = 'https://api.openai.com/v1',
  ): Promise<string> {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const url = cleanBase.endsWith('/chat/completions')
      ? cleanBase
      : `${cleanBase}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
    if (apiKey.startsWith('sk-or-')) {
      headers['HTTP-Referer'] = 'https://safnexbd.com';
      headers['X-Title'] = 'SafnexBD';
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || `API HTTP ${res.status}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '{}';
  }

  private cleanAndParseJson(raw: string): any {
    try {
      const clean = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(clean);
    } catch {
      return {};
    }
  }

  private parseAiResponse(raw: string, heuristic: any): AiAnalysisResult {
    const parsed = this.cleanAndParseJson(raw);
    const score = typeof parsed.riskScore === 'number' ? parsed.riskScore : heuristic.score;
    const finalScore = Math.max(score, heuristic.score);

    return {
      riskScore: finalScore,
      category: parsed.category || heuristic.category,
      reason: parsed.reason || (heuristic.hasRisk ? 'Suspicious keywords detected' : 'Clean message'),
      detectedKeywords: Array.from(
        new Set([...(parsed.detectedKeywords || []), ...(heuristic.keywords || [])]),
      ),
      dealTerms: parsed.dealTerms || { detected: false },
    };
  }
}
