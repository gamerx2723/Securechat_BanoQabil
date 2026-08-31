export interface AnalyzedUrlInfo {
  url: string;
  domain: string;
  isIpAddress: boolean;
  hasHomoglyphs: boolean;
  isShortened: boolean;
  hasSuspiciousTld: boolean;
  hasSuspiciousPath: boolean;
  typoBrandTarget?: string;
  suspiciousScore: number; // 0 - 100
  reasons: string[];
}

export class UrlAnalyzer {
  private static readonly SUSPICIOUS_TLDS = new Set([
    'xyz', 'top', 'tk', 'zip', 'cam', 'click', 'rest', 'gq', 'cf', 'ml', 'work', 'link', 'surf', 'loan'
  ]);

  private static readonly SHORTENER_DOMAINS = new Set([
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'cutt.ly', 'is.gd', 'rb.gy', 'shorte.st'
  ]);

  private static readonly PROTECTED_BRANDS = [
    'paypal', 'binance', 'whatsapp', 'google', 'apple', 'microsoft',
    'chase', 'bank', 'hbl', 'easypaisa', 'nayapay', 'sadapay', 'meezan', 'instagram', 'facebook'
  ];

  // Common Cyrillic / Greek / Digit confusable homoglyphs
  private static readonly HOMOGLYPH_MAP: Record<string, string> = {
    'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'ѕ': 's', 'ԁ': 'd', 'ԛ': 'q', 'і': 'i', 'ј': 'j', 'у': 'y', 'ѵ': 'v', 'х': 'x', 'ԝ': 'w',
    '0': 'o', '1': 'l', '3': 'e', '5': 's', '8': 'b', '@': 'a'
  };

  public static extractUrls(text: string): string[] {
    const urlRegex = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`\[\]]+/gi;
    const matches = text.match(urlRegex) || [];
    return matches.map(u => (u.startsWith('www.') ? `http://${u}` : u));
  }

  public static analyzeUrl(rawUrl: string): AnalyzedUrlInfo {
    const reasons: string[] = [];
    let suspiciousScore = 0;

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return {
        url: rawUrl,
        domain: rawUrl,
        isIpAddress: false,
        hasHomoglyphs: false,
        isShortened: false,
        hasSuspiciousTld: false,
        hasSuspiciousPath: false,
        suspiciousScore: 50,
        reasons: ['Malformed or unparseable URL structure'],
      };
    }

    const hostname = parsed.hostname.toLowerCase();
    const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    if (isIpAddress) {
      suspiciousScore += 45;
      reasons.push(`Direct IP address host instead of domain name (${hostname})`);
    }

    const isShortened = this.SHORTENER_DOMAINS.has(hostname);
    if (isShortened) {
      suspiciousScore += 25;
      reasons.push('Shortened URL domain concealing destination endpoint');
    }

    const tld = hostname.split('.').pop() || '';
    const hasSuspiciousTld = this.SUSPICIOUS_TLDS.has(tld);
    if (hasSuspiciousTld) {
      suspiciousScore += 35;
      reasons.push(`High-risk top level domain (.${tld}) frequently used in disposable phishing`);
    }

    // Check homoglyphs / leetspeak substitutions
    let hasHomoglyphs = false;
    let normalizedHostChars = '';
    for (const char of hostname) {
      if (this.HOMOGLYPH_MAP[char]) {
        hasHomoglyphs = true;
        normalizedHostChars += this.HOMOGLYPH_MAP[char];
      } else {
        normalizedHostChars += char;
      }
    }
    if (hasHomoglyphs) {
      suspiciousScore += 40;
      reasons.push('Character homoglyph / leetspeak permutation detected in domain name');
    }

    // Check brand typosquatting (e.g. paypa1, easypa1sa, nayapaay)
    let typoBrandTarget: string | undefined;
    const cleanNormalized = normalizedHostChars.replace(/[^a-z]/g, '');

    for (const brand of this.PROTECTED_BRANDS) {
      if (cleanNormalized.includes(brand)) {
        if (!hostname.endsWith(`.${brand}.com`) && !hostname.endsWith(`.${brand}.pk`) && hostname !== `${brand}.com`) {
          typoBrandTarget = brand;
          suspiciousScore += 55;
          reasons.push(`Lookalike brand spoofing targeting '${brand}'`);
          break;
        }
      }
    }

    // Check suspicious path keywords
    const pathAndQuery = (parsed.pathname + parsed.search).toLowerCase();
    const hasSuspiciousPath = /(?:verify-account|login-suspended|update-billing|claim-reward|secure-login|unlock-account|action=verify)/.test(pathAndQuery);
    if (hasSuspiciousPath) {
      suspiciousScore += 35;
      reasons.push('Suspicious credential collection or urgency keywords in URL path');
    }

    const boundedScore = Math.min(100, Math.max(0, suspiciousScore));

    return {
      url: rawUrl,
      domain: hostname,
      isIpAddress,
      hasHomoglyphs,
      isShortened,
      hasSuspiciousTld,
      hasSuspiciousPath,
      typoBrandTarget,
      suspiciousScore: boundedScore,
      reasons,
    };
  }
}
