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
    'xyz', 'top', 'tk', 'zip', 'cam', 'click', 'rest', 'gq', 'cf', 'ml',
    'work', 'link', 'surf', 'loan', 'club', 'info', 'online', 'site',
    'fun', 'live', 'support', 'vip', 'icu', 'buzz', 'ga', 'space', 'gdn',
    'fit', 'kim', 'bid', 'country', 'stream', 'download', 'racing', 'trade'
  ]);

  private static readonly DYNAMIC_DNS_DOMAINS = new Set([
    'servebbs.org', 'duckdns.org', 'ngrok.io', 'loca.lt', 'hopto.org',
    'zapto.org', 'ddns.net', 'bounceme.net', '000webhostapp.com', 'firebaseapp.com',
    'pages.dev', 'workers.dev', 'netlify.app', 'glitch.me', 'vercel.app'
  ]);

  private static readonly SHORTENER_DOMAINS = new Set([
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'cutt.ly', 'is.gd', 'rb.gy', 'shorte.st', 'xini.eu'
  ]);

  private static readonly PROTECTED_BRANDS = [
    'paypal', 'binance', 'whatsapp', 'google', 'apple', 'microsoft',
    'chase', 'bank', 'hbl', 'easypaisa', 'nayapay', 'sadapay', 'meezan',
    'instagram', 'facebook', 'skype', 'netflix', 'amazon', 'wellsfargo',
    'citibank', 'americanexpress', 'barclays', 'outlook', 'yahoo', 'steam'
  ];

  // Common Cyrillic / Greek / Digit confusable homoglyphs
  private static readonly HOMOGLYPH_MAP: Record<string, string> = {
    'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'ѕ': 's', 'ԁ': 'd', 'ԛ': 'q', 'і': 'i', 'ј': 'j', 'у': 'y', 'ѵ': 'v', 'х': 'x', 'ԝ': 'w',
    '0': 'o', '1': 'l', '3': 'e', '5': 's', '8': 'b', '@': 'a'
  };

  public static extractUrls(text: string): string[] {
    const urlRegex = /(?:(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`\[\]]+|(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|xyz|top|info|site|online|club|tk|ml|ga|cf|gq|io|dev|app|cc|to|co|pk)(?:\/[^\s<>"'{}|\\^`\[\]]*)?)/gi;
    const matches = text.match(urlRegex) || [];
    const normalized = matches.map(u => {
      if (!u.startsWith('http://') && !u.startsWith('https://')) {
        return `http://${u}`;
      }
      return u;
    });
    return Array.from(new Set(normalized));
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
        reasons: ['Malformed or deceptive URL structure'],
      };
    }

    const hostname = parsed.hostname.toLowerCase();
    const fullUrlLower = rawUrl.toLowerCase();
    const pathAndQuery = (parsed.pathname + parsed.search).toLowerCase();

    // 1. IP Address host check
    const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    if (isIpAddress) {
      suspiciousScore += 45;
      reasons.push(`Direct IP address host instead of registered domain (${hostname})`);
    }

    // 2. URL Shortener check
    const isShortened = this.SHORTENER_DOMAINS.has(hostname);
    if (isShortened) {
      suspiciousScore += 30;
      reasons.push('Shortened URL domain concealing destination endpoint');
    }

    // 3. High-risk TLD check
    const tld = hostname.split('.').pop() || '';
    const hasSuspiciousTld = this.SUSPICIOUS_TLDS.has(tld);
    if (hasSuspiciousTld) {
      suspiciousScore += 40;
      reasons.push(`High-risk disposable TLD (.${tld}) frequently used in phishing attacks`);
    }

    // 4. Dynamic DNS / Free Hosting host check
    for (const dyn of this.DYNAMIC_DNS_DOMAINS) {
      if (hostname === dyn || hostname.endsWith(`.${dyn}`)) {
        suspiciousScore += 35;
        reasons.push(`Unverified dynamic DNS or free staging domain (${dyn})`);
        break;
      }
    }

    // 5. Homoglyph and Leetspeak Character Substitutions
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

    // 6. Direct Brand Typosquatting
    let typoBrandTarget: string | undefined;
    const cleanNormalized = normalizedHostChars.replace(/[^a-z]/g, '');

    for (const brand of this.PROTECTED_BRANDS) {
      if (cleanNormalized.includes(brand)) {
        if (!hostname.endsWith(`.${brand}.com`) && !hostname.endsWith(`.${brand}.pk`) && hostname !== `${brand}.com`) {
          typoBrandTarget = brand;
          suspiciousScore += 60;
          reasons.push(`Lookalike brand spoofing targeting '${brand}'`);
          break;
        }
      }
    }

    // 7. Brand in Subdomain or Deep Path (e.g. attacker.com/paypal/login.php or skype.com.rogue.it)
    if (!typoBrandTarget) {
      for (const brand of this.PROTECTED_BRANDS) {
        if (fullUrlLower.includes(brand)) {
          if (!hostname.endsWith(`.${brand}.com`) && !hostname.endsWith(`.${brand}.pk`) && hostname !== `${brand}.com`) {
            typoBrandTarget = brand;
            suspiciousScore += 55;
            reasons.push(`Target brand '${brand}' embedded in non-official domain path or subdomain`);
            break;
          }
        }
      }
    }

    // 8. Hex / MD5 Hash in Path (phishing kit session token)
    if (/[0-9a-fA-F]{16,}/.test(pathAndQuery)) {
      suspiciousScore += 30;
      reasons.push('Phishing kit tracking session token detected in URL path');
    }

    // 9. Suspicious Script Endpoints & Phishing Query Keywords
    const hasSuspiciousPath = /(?:webscr|cgi-bin|dispatch=|loading\.php|confirmar|verify-account|login-suspended|update-billing|claim-reward|secure-login|unlock-account|action=verify|fidelidade|\.php\?|\/login|\/signin|\/verify|\/auth)/.test(pathAndQuery);
    if (hasSuspiciousPath) {
      suspiciousScore += 35;
      reasons.push('Suspicious credential collection or automated phishing script path pattern');
    }

    // 10. Excessive Subdomains
    if (hostname.split('.').length >= 4) {
      suspiciousScore += 25;
      reasons.push(`Excessive subdomain nesting (${hostname})`);
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
