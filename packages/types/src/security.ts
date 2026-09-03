export type SecurityIndicatorColor = 'GREEN' | 'ORANGE' | 'RED';

export type ThreatCategory =
  | 'SAFE'
  | 'PHISHING'
  | 'CREDENTIAL_HARVESTING'
  | 'ACCOUNT_TAKEOVER'
  | 'SOCIAL_ENGINEERING'
  | 'URGENCY_MANIPULATION'
  | 'AUTHORITY_IMPERSONATION'
  | 'FEAR_COERCION'
  | 'SECRECY_PRESSURE'
  | 'FINANCIAL_FRAUD'
  | 'MALICIOUS_URL'
  | 'DLP_SECRET_EXPOSURE'
  | 'BLACKMAIL_SEXTORTION'
  | 'COERCIVE_INTIMATE_SOLICITATION'
  | 'INTIMATE_MEDIA_WARNING'
  | 'SUSPICIOUS_ATTACHMENT'
  | 'SUSPICIOUS_APK';

export type DetectionBasis = 'DETERMINISTIC_RULE' | 'LOCAL_AI_MODEL' | 'CONTEXT_ANALYSIS' | 'THREAT_INTELLIGENCE';

export interface ThreatEvidence {
  category: ThreatCategory;
  signal: string;
  confidence: number; // 0 - 1
  detectionBasis: DetectionBasis;
  description: string;
}

export interface SecurityAnalysisResult {
  messageId?: string;
  riskScore: number; // 0 - 100
  indicatorColor: SecurityIndicatorColor;
  primaryThreat: ThreatCategory;
  confidence: number; // 0 - 100
  evidenceList: ThreatEvidence[];
  explanation: string;
  recommendation: string;
  suggestedActions: Array<'BLOCK_LINK' | 'REPORT_MESSAGE' | 'BLOCK_SENDER' | 'CONTINUE_ANYWAY' | 'ASK_COPILOT'>;
  detectedSecrets?: Array<{
    type: string;
    snippet: string;
    entropy?: number;
  }>;
  analyzedUrls?: Array<{
    url: string;
    domain: string;
    isIpAddress: boolean;
    hasHomoglyphs: boolean;
    isShortened: boolean;
    suspiciousScore: number;
  }>;
}

export interface DlpScanResult {
  hasSensitiveData: boolean;
  detectedItems: Array<{
    type: 'AWS_KEY' | 'GITHUB_TOKEN' | 'JWT' | 'PRIVATE_KEY' | 'PASSWORD' | 'OTP' | 'CREDIT_CARD' | 'DATABASE_URL';
    maskedSnippet: string;
    warning: string;
  }>;
}
