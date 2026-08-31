import { ThreatCategory, ThreatEvidence } from '@securechat/types';

export interface ZeroDayAnalysis {
  zeroDayThreatDetected: boolean;
  cognitiveRiskScore: number; // 0 - 100
  intentSignals: ThreatEvidence[];
  primaryCategory: ThreatCategory;
}

export class ZeroDayReasoner {
  private static readonly ZERO_WIDTH_REGEX = /[\u200B\u200C\u200D\uFEFF\u202A\u202E]/;
  private static readonly SPACED_TOKEN_REGEX = /\b([a-zA-Z0-9][\s\._-]){4,}[a-zA-Z0-9]\b/;

  private static calculateEntropy(str: string): number {
    if (!str) return 0;
    const len = str.length;
    const freqs: Record<string, number> = {};
    for (const char of str) {
      freqs[char] = (freqs[char] || 0) + 1;
    }
    let entropy = 0;
    for (const char in freqs) {
      const p = freqs[char] / len;
      entropy -= p * Math.log2(p);
    }
    return entropy;
  }

  public static evaluateZeroDay(text: string): ZeroDayAnalysis {
    const evidenceList: ThreatEvidence[] = [];
    let cognitiveScore = 0;

    // 1. Anti-Analysis Obfuscation & Evasion Logic
    if (this.ZERO_WIDTH_REGEX.test(text)) {
      cognitiveScore += 45;
      evidenceList.push({
        category: 'SOCIAL_ENGINEERING',
        signal: 'ZERO_WIDTH_EVASION',
        confidence: 0.96,
        detectionBasis: 'CONTEXT_ANALYSIS',
        description: 'Zero-Day Anti-Analysis Evasion: Hidden zero-width Unicode characters detected in message text.',
      });
    }

    if (this.SPACED_TOKEN_REGEX.test(text)) {
      cognitiveScore += 35;
      evidenceList.push({
        category: 'SOCIAL_ENGINEERING',
        signal: 'OBFUSCATED_SPACING',
        confidence: 0.90,
        detectionBasis: 'CONTEXT_ANALYSIS',
        description: 'Artificial character-spacing/delimiter evasion pattern detected to bypass keyword filters.',
      });
    }

    // 2. Cognitive Intent Triangle (Action + Pressure + Bypass)
    const hasAction = /\b(?:authenticate|sign\s*in|log\s*in|verify\s*identity|confirm\s*(?:credentials|details|account)|(?:transfer|wire|send|deposit)\s+(?:money|funds|cash|amount|rs\.?|pkr|\$|rupees|payment)|download|install|run\s*this|open\s*attachment|apk|paisay\s*(?:de\s*do|send|bhejo|transfer))\b/i.test(text);
    const hasPressure = /\b(?:within\s*(?:\d+\s*(?:mins?|hours?|seconds?)|today)|before\s*it\s*expires|deadline|right\s*now|at\s*once|otherwise|or\s*else|will\s*be\s*(?:lost|cancelled|suspended|blocked|deleted|terminated)|stuck|lost\s*my\s*phone|emergency|hospital|accident|earn\s*\$?\d+\s*daily|won\s*(?:lottery|prize|car|gold)|foran|jaldi|abhi\s*k\s*abhi|band\s*ho\s*jaye\s*ga|ammi\s*bimar)\b/i.test(text);
    const hasBypass = /\b(?:ignore\s*(?:warning|security\s*alert|prompt)|bypass|do\s*not\s*(?:call|verify\s*with|report|ask)|share\s*(?:code|otp|pin|password|card|cvv|cnic)|tell\s*me\s*the\s*number|kisi\s*ko\s*mat\s*batana|code\s*batao|otp\s*send\s*karo)\b/i.test(text);

    if (hasAction && hasPressure) {
      cognitiveScore += 55;
      evidenceList.push({
        category: 'SOCIAL_ENGINEERING',
        signal: 'ACTION_PRESSURE_COMPOUND',
        confidence: 0.94,
        detectionBasis: 'CONTEXT_ANALYSIS',
        description: 'Zero-Day Cognitive Intent: Combines an urgent irreversible action request with asymmetric pressure.',
      });
    }

    if (hasAction && hasBypass) {
      cognitiveScore += 65;
      evidenceList.push({
        category: 'CREDENTIAL_HARVESTING',
        signal: 'SECURITY_BYPASS_ATTEMPT',
        confidence: 0.98,
        detectionBasis: 'CONTEXT_ANALYSIS',
        description: 'Zero-Day Critical Intent: Direct instruction to bypass verification or disclose confidential 2FA authentication state.',
      });
    }

    // 3. Structural Zero-Day URL Invariant Logic
    const urlRegex = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`\[\]]+/gi;
    const urls = text.match(urlRegex) || [];

    for (const rawUrl of urls) {
      try {
        const parsed = new URL(rawUrl.startsWith('www.') ? `http://${rawUrl}` : rawUrl);
        const host = parsed.hostname.toLowerCase();
        const path = parsed.pathname.toLowerCase();
        const query = parsed.search.toLowerCase();

        // Subdomain Stacking
        if (host.split('.').length >= 4) {
          cognitiveScore += 30;
          evidenceList.push({
            category: 'MALICIOUS_URL',
            signal: 'SUBDOMAIN_STACKING',
            confidence: 0.88,
            detectionBasis: 'THREAT_INTELLIGENCE',
            description: `Zero-Day URL Structural Invariant: Deep subdomain stacking (${host})`,
          });
        }

        // High Host Entropy
        const entropy = this.calculateEntropy(host.replace(/\./g, ''));
        if (entropy >= 3.8 && host.length >= 15) {
          cognitiveScore += 35;
          evidenceList.push({
            category: 'PHISHING',
            signal: 'HIGH_ENTROPY_DOMAIN',
            confidence: 0.92,
            detectionBasis: 'THREAT_INTELLIGENCE',
            description: `Zero-Day Algorithmic Generation (DGA) Anomaly: High entropy domain (${entropy.toFixed(2)} bits)`,
          });
        }

        // Open Redirect in query string
        if (/(?:[?&](?:url|redirect|dest|destination|next|target|link|out)=)/i.test(query)) {
          cognitiveScore += 35;
          evidenceList.push({
            category: 'PHISHING',
            signal: 'OPEN_REDIRECT_INJECTION',
            confidence: 0.93,
            detectionBasis: 'THREAT_INTELLIGENCE',
            description: 'Zero-Day URL Anomaly: Nested open-redirect parameter concealing actual destination.',
          });
        }

        // Action in path on unverified origin
        if (/(?:\/auth|\/verify|\/login|\/signin|\/session|\/account|\/confirm|\/update|\/token|\/secure)/i.test(path)) {
          if (!host.endsWith('.google.com') && !host.endsWith('.microsoft.com') && !host.endsWith('.apple.com') && !host.endsWith('.github.com')) {
            cognitiveScore += 35;
            evidenceList.push({
              category: 'PHISHING',
              signal: 'UNTRUSTED_AUTH_ENDPOINT',
              confidence: 0.92,
              detectionBasis: 'CONTEXT_ANALYSIS',
              description: `Zero-Day Authentication Invariant: Sensitive action endpoint (${path}) hosted on unverified third-party domain (${host}).`,
            });
          }
        }
      } catch {}
    }

    const finalScore = Math.min(100, cognitiveScore);
    const isThreat = finalScore >= 40;

    let primaryCategory: ThreatCategory = 'SAFE';
    if (evidenceList.length > 0) {
      primaryCategory = evidenceList[0].category;
    }

    return {
      zeroDayThreatDetected: isThreat,
      cognitiveRiskScore: finalScore,
      intentSignals: evidenceList,
      primaryCategory,
    };
  }
}
