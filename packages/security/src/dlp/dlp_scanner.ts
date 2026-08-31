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
      regex: /(?:password|pass|pwd|secret|passcode|creds)\s*[:=]\s*["']?([^\s"';,]{4,})["']?|(?:my\s+(?:password|pin|passcode)\s+is\s+([^\s"';,]{4,}))/gi,
      warning: 'Plaintext password or passcode detected. Never share account passwords in cleartext.',
    },
    {
      type: 'OTP' as const,
      regex: /(?:otp|verification\s*code|security\s*code|login\s*code|passcode|code\s*is|tasdeeqi\s*code)\s*[:=]?\s*(\b\d{4,8}\b)/gi,
      warning: 'One-Time Password (OTP) or 2FA verification code detected. Never share OTPs.',
    },
    {
      type: 'CREDIT_CARD' as const,
      regex: /\b(\d{5}-\d{7}-\d|\d{13})\b/g,
      warning: 'National Identity Number (CNIC / PII) detected.',
    },
    {
      type: 'DATABASE_URL' as const,
      regex: /\b(PK\d{2}[A-Z]{4}\d{16}|(?:account|acc|ac|khata)\s*#?\s*[:=]?\s*\d{10,16})\b/gi,
      warning: 'Bank Account or IBAN number detected.',
    },
    {
      type: 'CREDIT_CARD' as const,
      regex: /(?:cvv|cvc|card\s*pin)\s*[:=]?\s*(\b\d{3,4}\b)/gi,
      warning: 'Card Security Code (CVV/CVC) detected.',
    }
  ];

  public static scan(text: string): DlpScanResult {
    const detectedItems: DlpScanResult['detectedItems'] = [];

    for (const pattern of this.PATTERNS) {
      pattern.regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.regex.exec(text)) !== null) {
        const fullMatched = match[1] || match[2] || match[0];
        if (fullMatched) {
          const masked = this.maskSecret(fullMatched);
          detectedItems.push({
            type: pattern.type,
            maskedSnippet: masked,
            warning: pattern.warning,
          });
        }
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

  public static redact(text: string): string {
    let result = text;
    for (const pattern of this.PATTERNS) {
      pattern.regex.lastIndex = 0;
      result = result.replace(pattern.regex, (match, p1, p2) => {
        const secret = p1 || p2 || match;
        return match.replace(secret, '[REDACTED]');
      });
    }

    // Also redact credit cards
    result = result.replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b/g, (match) => {
      const cleaned = match.replace(/[-\s]/g, '');
      if (this.isValidLuhn(cleaned)) {
        return `****-****-****-${cleaned.slice(-4)}`;
      }
      return match;
    });

    return result;
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
