import { DlpScanResult } from '@securechat/types';

export class DlpScanner {
  private static readonly PATTERNS = [
    {
      type: 'AWS_KEY' as const,
      regex: /\b(AKIA[0-9A-Z]{16})\b/g,
      warning: 'AWS Access Key ID detected. Sharing cloud credentials exposes your infrastructure.',
    },
    {
      type: 'GITHUB_TOKEN' as const,
      regex: /\b(ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})\b/g,
      warning: 'GitHub Personal Access Token detected. This allows unauthorized repository access.',
    },
    {
      type: 'JWT' as const,
      regex: /\b(eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*)\b/g,
      warning: 'JSON Web Token (JWT) session token detected. This could allow session hijacking.',
    },
    {
      type: 'PRIVATE_KEY' as const,
      regex: /-----BEGIN (?:RSA|EC|OPENSSH|DSA|PGP|ENCRYPTED)? ?PRIVATE KEY-----[\s\S]*?-----END (?:RSA|EC|OPENSSH|DSA|PGP|ENCRYPTED)? ?PRIVATE KEY-----/g,
      warning: 'Asymmetric Private Key detected. Never transmit private cryptographic keys.',
    },
    {
      type: 'DATABASE_URL' as const,
      regex: /\b(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis):\/\/[a-zA-Z0-9_\-\.]+:[^@\s]+@[a-zA-Z0-9_\-\.]+/g,
      warning: 'Database Connection String with embedded credentials detected.',
    },
    {
      type: 'PASSWORD' as const,
      regex: /(?:password|pass|pwd|secret)\s*[:=]\s*["']?([^\s"';,]{6,})["']?/gi,
      warning: 'Plaintext password assignment detected.',
    },
    {
      type: 'OTP' as const,
      regex: /(?:otp|verification code|security code|login code|passcode|code is|tasdeeqi code)\s*[:=]?\s*(\b\d{4,8}\b)/gi,
      warning: 'One-Time Password (OTP) or 2FA verification code detected. Never share OTPs.',
    },
  ];

  public static scan(text: string): DlpScanResult {
    const detectedItems: DlpScanResult['detectedItems'] = [];

    for (const pattern of this.PATTERNS) {
      pattern.regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.regex.exec(text)) !== null) {
        const fullMatched = match[1] || match[0];
        const masked = this.maskSecret(fullMatched);
        detectedItems.push({
          type: pattern.type,
          maskedSnippet: masked,
          warning: pattern.warning,
        });
      }
    }

    // Check Credit Card Numbers with Luhn Algorithm
    const ccMatches = text.match(/\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b/g);
    if (ccMatches) {
      for (const rawCc of ccMatches) {
        const cleaned = rawCc.replace(/[-\s]/g, '');
        if (this.isValidLuhn(cleaned)) {
          detectedItems.push({
            type: 'CREDIT_CARD',
            maskedSnippet: `****-****-****-${cleaned.slice(-4)}`,
            warning: 'Valid Credit or Debit Card number detected.',
          });
        }
      }
    }

    return {
      hasSensitiveData: detectedItems.length > 0,
      detectedItems,
    };
  }

  private static maskSecret(secret: string): string {
    if (secret.length <= 6) {
      return '*'.repeat(secret.length);
    }
    return `${secret.slice(0, 3)}...${secret.slice(-3)}`;
  }

  private static isValidLuhn(numStr: string): boolean {
    let sum = 0;
    let shouldDouble = false;
    for (let i = numStr.length - 1; i >= 0; i--) {
      let digit = parseInt(numStr.charAt(i), 10);
      if (isNaN(digit)) return false;
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }
}
