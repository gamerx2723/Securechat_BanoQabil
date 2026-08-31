import { ThreatCategory, ThreatEvidence } from '@securechat/types';

export interface SocialPatternMatch {
  category: ThreatCategory;
  signal: string;
  weight: number;
  description: string;
}

export class SocialEngineeringScanner {
  private static readonly RULES: Array<{
    category: ThreatCategory;
    regex: RegExp;
    weight: number;
    description: string;
  }> = [
    // Urgency Patterns (English, Roman Urdu, Urdu)
    {
      category: 'URGENCY_MANIPULATION',
      regex: /\b(?:urgent|immediately|within 24 hours|suspended today|account will be terminated|act now|expires in|foran|jaldi|abhi karo|block honay wala hai|bhai jaldi|فوراً|جلدی)\b/i,
      weight: 35,
      description: 'Linguistic urgency pressure demanding immediate action without verification.',
    },
    // Authority & Legal Fear
    {
      category: 'AUTHORITY_IMPERSONATION',
      regex: /\b(?:federal police|fia|police department|fbi|irs|tax department|security team|head office|court order|arrest warrant|fir darj|legal action)\b/i,
      weight: 45,
      description: 'Authority impersonation or legal intimidation language.',
    },
    // Secrecy & Isolation
    {
      category: 'SECRECY_PRESSURE',
      regex: /\b(?:don't tell anyone|keep this secret|between you and me|confidential matter|kisi ko mat batana|chup rehna|kisi se share mat karna)\b/i,
      weight: 40,
      description: 'Isolation tactics instructing recipient to hide communication from colleagues or family.',
    },
    // Credential Solicitation
    {
      category: 'CREDENTIAL_HARVESTING',
      regex: /\b(?:send me (?:your )?(?:password|pin|otp|code|card details)|apna (?:password|pin|code|otp) bhejo|tasdeeqi code send karo)\b/i,
      weight: 60,
      description: 'Direct conversational solicitation of confidential credentials or one-time codes.',
    },
    // Financial Fraud / Lottery Scams
    {
      category: 'FINANCIAL_FRAUD',
      regex: /\b(?:you (?:have )?won|lottery prize|claim your (?:cash|reward)|50000 cash|benazir income|free crypto|easy money|inaam nikla hai)\b/i,
      weight: 50,
      description: 'Unsolicited financial reward or prize lottery lure.',
    },
  ];

  public static scan(text: string): ThreatEvidence[] {
    const evidenceList: ThreatEvidence[] = [];

    for (const rule of this.RULES) {
      if (rule.regex.test(text)) {
        evidenceList.push({
          category: rule.category,
          signal: rule.category,
          confidence: Math.min(1.0, rule.weight / 60),
          detectionBasis: 'DETERMINISTIC_RULE',
          description: rule.description,
        });
      }
    }

    return evidenceList;
  }
}
