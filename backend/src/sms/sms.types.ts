export type SmsProviderType =
  | 'GENERIC_HTTP'
  | 'BULKSMSBD'
  | 'GREENWEB'
  | 'MIMSMS'
  | 'TWILIO';

export type HttpMethod = 'GET' | 'POST';
export type RequestFormat = 'JSON' | 'FORM_DATA' | 'QUERY_PARAMS';

export interface SmsGatewayConfig {
  isEnabled: boolean;
  provider: SmsProviderType;
  apiUrl: string;
  httpMethod: HttpMethod;
  requestFormat: RequestFormat;
  apiKey: string;
  senderId?: string;
  clientId?: string;
  customHeaders?: Record<string, string>;
  paramMapping?: {
    toParam?: string;        // e.g. 'to', 'number', 'receiver'
    messageParam?: string;   // e.g. 'message', 'msg', 'text'
    apiKeyParam?: string;    // e.g. 'api_key', 'token'
    senderIdParam?: string;  // e.g. 'senderid', 'sender_id'
  };
}

export interface MailGatewayConfig {
  isEnabled: boolean;
  host: string;
  port: number;
  secure: boolean; // true for 465, false for 587/other
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

export type ForgotPasswordMode = 'MANUAL' | 'OTP';

export interface SecurityModesConfig {
  forgotPasswordMode: ForgotPasswordMode; // Default: 'MANUAL'
  withdrawOtpEnabled: boolean;            // Default: false
  otpExpiryMinutes: number;              // Default: 5
  otpLength: number;                     // Default: 6
}

export interface TemplateItem {
  key: string;
  titleBn: string;
  titleEn: string;
  isEnabled: boolean;
  templateBn: string;
  templateEn: string;
  availableVariables: string[];
}

export type GatewayTemplatesMap = Record<string, TemplateItem>;

export const DEFAULT_SMS_GATEWAY: SmsGatewayConfig = {
  isEnabled: false,
  provider: 'GENERIC_HTTP',
  apiUrl: '',
  httpMethod: 'POST',
  requestFormat: 'JSON',
  apiKey: '',
  senderId: '',
  clientId: '',
  customHeaders: {},
  paramMapping: {
    toParam: 'to',
    messageParam: 'message',
    apiKeyParam: 'api_key',
    senderIdParam: 'sender_id',
  },
};

export const DEFAULT_MAIL_GATEWAY: MailGatewayConfig = {
  isEnabled: false,
  host: '',
  port: 587,
  secure: false,
  user: '',
  pass: '',
  fromName: 'SafnexBD',
  fromEmail: 'noreply@safnexbd.com',
};

export const DEFAULT_SECURITY_MODES: SecurityModesConfig = {
  forgotPasswordMode: 'MANUAL', // Preserves existing manual form by default!
  withdrawOtpEnabled: false,    // Preserves existing direct withdraw by default!
  otpExpiryMinutes: 5,
  otpLength: 6,
};

export const DEFAULT_GATEWAY_TEMPLATES: GatewayTemplatesMap = {
  withdraw_otp: {
    key: 'withdraw_otp',
    titleBn: 'উইথড্র রিকোয়েস্ট ওটিপি (Withdrawal OTP)',
    titleEn: 'Withdrawal Verification OTP',
    isEnabled: true,
    templateBn: 'আপনার সেফনেক্সবিডি উইথড্র ওটিপি কোড হলো: {otp}। এটি কারো সাথে শেয়ার করবেন না। মেয়াদ {expiry} মিনিট।',
    templateEn: 'Your SafnexBD withdrawal OTP is {otp}. Do not share this with anyone. Valid for {expiry} mins.',
    availableVariables: ['{name}', '{otp}', '{amount}', '{method}', '{expiry}', '{siteName}'],
  },
  forgot_password_otp: {
    key: 'forgot_password_otp',
    titleBn: 'পাসওয়ার্ড রিসেট ওটিপি (Forgot Password OTP)',
    titleEn: 'Password Reset OTP',
    isEnabled: true,
    templateBn: 'আপনার সেফনেক্সবিডি পাসওয়ার্ড রিসেট ওটিপি কোড হলো: {otp}। মেয়াদ {expiry} মিনিট।',
    templateEn: 'Your SafnexBD password reset OTP is {otp}. Valid for {expiry} minutes.',
    availableVariables: ['{name}', '{otp}', '{expiry}', '{siteName}'],
  },
  welcome_sms: {
    key: 'welcome_sms',
    titleBn: 'নতুন রেজিস্ট্রেশন স্বাগতম বার্তা',
    titleEn: 'New Registration Welcome SMS',
    isEnabled: false,
    templateBn: 'অভিনন্দন {name}! সেফনেক্সবিডিতে আপনার অ্যাকাউন্ট সফলভাবে খোলা হয়েছে। আপনার ইউজার আইডি: {userId}।',
    templateEn: 'Welcome {name} to SafnexBD! Your account has been registered successfully. User ID: {userId}.',
    availableVariables: ['{name}', '{userId}', '{phone}', '{siteName}'],
  },
  recharge_success: {
    key: 'recharge_success',
    titleBn: 'ওয়ালেট রিচার্জ সফল',
    titleEn: 'Wallet Recharge Approved',
    isEnabled: false,
    templateBn: 'প্রিয় {name}, আপনার ৳{amount} ওয়ালেট রিচার্জ সফল হয়েছে। নতুন ব্যালেন্স: ৳{balance}। ট্রানজ্যাকশন আইডি: {txId}।',
    templateEn: 'Dear {name}, your wallet recharge of ৳{amount} was successful. New balance: ৳{balance}. TxID: {txId}.',
    availableVariables: ['{name}', '{amount}', '{balance}', '{method}', '{txId}', '{siteName}'],
  },
  recharge_rejected: {
    key: 'recharge_rejected',
    titleBn: 'ওয়ালেট রিচার্জ বাতিল',
    titleEn: 'Wallet Recharge Rejected',
    isEnabled: false,
    templateBn: 'প্রিয় {name}, আপনার ৳{amount} ওয়ালেট রিচার্জ বাতিল করা হয়েছে। কারণ: {reason}।',
    templateEn: 'Dear {name}, your wallet recharge of ৳{amount} has been declined. Reason: {reason}.',
    availableVariables: ['{name}', '{amount}', '{method}', '{reason}', '{siteName}'],
  },
  withdraw_approved: {
    key: 'withdraw_approved',
    titleBn: 'উইথড্র রিকোয়েস্ট সফল ও ক্যাশআউট প্রদান',
    titleEn: 'Withdrawal Disbursed Successfully',
    isEnabled: false,
    templateBn: 'প্রিয় {name}, আপনার ৳{amount} উইথড্র সফলভাবে প্রদান করা হয়েছে। একাউন্ট: {account}। ট্রানজ্যাকশন আইডি: {txId}।',
    templateEn: 'Dear {name}, your withdrawal of ৳{amount} has been disbursed to {account}. TxID: {txId}.',
    availableVariables: ['{name}', '{amount}', '{method}', '{account}', '{txId}', '{siteName}'],
  },
  withdraw_rejected: {
    key: 'withdraw_rejected',
    titleBn: 'উইথড্র রিকোয়েস্ট বাতিল',
    titleEn: 'Withdrawal Request Declined',
    isEnabled: false,
    templateBn: 'প্রিয় {name}, আপনার ৳{amount} উইথড্র বাতিল করা হয়েছে এবং টাকা ওয়ালেটে ফেরত দেওয়া হয়েছে। কারণ: {reason}।',
    templateEn: 'Dear {name}, your withdrawal of ৳{amount} was declined and refunded to wallet. Reason: {reason}.',
    availableVariables: ['{name}', '{amount}', '{reason}', '{siteName}'],
  },
  deal_started: {
    key: 'deal_started',
    titleBn: 'নতুন এসক্রো ডিল শুরু',
    titleEn: 'New Escrow Deal Started',
    isEnabled: false,
    templateBn: 'প্রিয় {name}, #{trackingNumber} নম্বরের একটি নতুন এসক্রো ডিল শুরু হয়েছে। পরিমাণ: ৳{amount}।',
    templateEn: 'Dear {name}, a new escrow deal #{trackingNumber} has started for ৳{amount}.',
    availableVariables: ['{name}', '{trackingNumber}', '{amount}', '{siteName}'],
  },
  deal_completed: {
    key: 'deal_completed',
    titleBn: 'এসক্রো ডিল সম্পন্ন ও ফান্ড রিলিজ',
    titleEn: 'Escrow Deal Completed',
    isEnabled: false,
    templateBn: 'প্রিয় {name}, এসক্রো ডিল #{trackingNumber} সফলভাবে সম্পন্ন হয়েছে এবং ৳{amount} রিলিজ হয়েছে।',
    templateEn: 'Dear {name}, deal #{trackingNumber} has been successfully completed and ৳{amount} released.',
    availableVariables: ['{name}', '{trackingNumber}', '{amount}', '{siteName}'],
  },
  dispute_alert: {
    key: 'dispute_alert',
    titleBn: 'ডিসপ্যুট / কল অ্যাডমিন সতর্কতা',
    titleEn: 'Dispute / Admin Calling Alert',
    isEnabled: false,
    templateBn: 'জরুরি সতর্কতা: ডিল #{trackingNumber}-এ ডিসপ্যুট সহায়তা চাওয়া হয়েছে। অ্যাডমিন টিম বিষয়টি খতিয়ে দেখছে।',
    templateEn: 'Alert: A dispute was opened for deal #{trackingNumber}. Admin team is reviewing.',
    availableVariables: ['{name}', '{trackingNumber}', '{siteName}'],
  },
  login_alert: {
    key: 'login_alert',
    titleBn: 'নিরাপত্তা / নতুন লগইন সতর্কতা',
    titleEn: 'Security Login Alert',
    isEnabled: false,
    templateBn: 'নিরাপত্তা সতর্কতা: আপনার সেফনেক্সবিডি অ্যাকাউন্টে নতুন একটি ডিভাইস থেকে লগইন করা হয়েছে। সময়: {time}।',
    templateEn: 'Security alert: A new login was detected on your SafnexBD account at {time}.',
    availableVariables: ['{name}', '{time}', '{ip}', '{siteName}'],
  },
};

