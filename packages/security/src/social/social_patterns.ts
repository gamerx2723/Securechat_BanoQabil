import { ThreatCategory, ThreatEvidence } from '@securechat/types';

export class SocialEngineeringScanner {
  private static readonly RULES: Array<{
    category: ThreatCategory;
    regex: RegExp;
    weight: number;
    description: string;
  }> = [
    // 1. Urgency Manipulation (English, Roman Urdu, Urdu Script)
    {
      category: 'URGENCY_MANIPULATION',
      regex: /(?:\b(?:urgent|immediately|within 24 hours|suspended today|account will be terminated|act now|expires in|foran|jaldi|abhi karo|block honay wala hai|bhai jaldi|waqt bohot kam|last chance|der mat karo)\b|(?:فوراً|جلدی|ابھی\s*کے\s*ابھی|وقت\s*کم\s*ہے|آخری\s*موقع|اکاؤنٹ\s*بند))/i,
      weight: 40,
      description: 'Linguistic urgency pressure coercing fast action without independent verification.',
    },
    // 2. Authority & Law Enforcement Extortion (FIA, Police, Cyber Crime, Court)
    {
      category: 'AUTHORITY_IMPERSONATION',
      regex: /(?:\b(?:federal police|fia|police department|fbi|irs|tax department|security team|head office|court order|arrest warrant|fir darj|legal action|cyber crime|inspector|manager|helpline)\b|(?:ایف\s*آئی\s*اے|سائبر\s*کرائم|پولیس|وارنٹ|گرفتاری|مقدمہ\s*درج|قانونی\s*نوٹس|عدالتی\s*نوٹس|سرکاری\s*نوٹس|جرمانہ|سیکیورٹی\s*ٹیم))/i,
      weight: 50,
      description: 'Authority impersonation or legal coercion intimidation language.',
    },
    // 3. Secrecy & Isolation
    {
      category: 'SECRECY_PRESSURE',
      regex: /(?:\b(?:don't tell anyone|keep this secret|between you and me|confidential matter|kisi ko mat batana|chup rehna|kisi se share mat karna|raaz rakhna)\b|(?:کسی\s*کو\s*مت\s*بتانا|خفیہ|راز|خاموش\s*رہیں))/i,
      weight: 40,
      description: 'Isolation tactics instructing recipient to conceal communication from family or colleagues.',
    },
    // 4. Credential Solicitation (Password, PIN, OTP, CNIC)
    {
      category: 'CREDENTIAL_HARVESTING',
      regex: /(?:\b(?:send me (?:your )?(?:password|pin|otp|code|card details)|apna (?:password|pin|code|otp|cnic|shanakhti card) (?:bhejo|send karo|share karo)|tasdeeqi code send karo|4 digit code batao)\b|(?:پاس\s*ورڈ|او\s*ٹی\s*پی|پن\s*کوڈ|شناختی\s*کارڈ|تصدیقی\s*کوڈ))/i,
      weight: 65,
      description: 'Direct conversational solicitation of confidential authentication credentials or 2FA OTP codes.',
    },
    // 5. Financial Fraud & Lottery Scams (BISP, Ehsaas, Jeeto Pakistan, Lottery, Fake Tasks)
    {
      category: 'FINANCIAL_FRAUD',
      regex: /(?:\b(?:you (?:have )?won|lottery prize|claim your (?:cash|reward)|50000 cash|benazir income|bisp|ehsaas|free crypto|easy money|inaam nikla hai|jeeto pakistan|fahad mustafa|5 tola sona|car nikli|daily \d+ kamayein|ghar bethay kamayein)\b|(?:بے\s*نظیر|احساس\s*پروگرام|قرعہ\s*اندازی|سونے\s*کا\s*سیٹ|گاڑی\s*نکل|مبارک\s*ہو.*انعام|امداد\s*حاصل|25000\s*روپے|روزانہ\s*\d+\s*کمائیں))/i,
      weight: 60,
      description: 'Unsolicited financial lottery, government grant (BISP/Ehsaas), or easy earning task scam lure.',
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
