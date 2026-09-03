import { ThreatCategory, ThreatEvidence } from '@securechat/types';

export class SocialEngineeringScanner {
  private static readonly RULES: Array<{
    category: ThreatCategory;
    regex: RegExp;
    weight: number;
    description: string;
  }> = [
    // 1. Urgency Manipulation & Account Suspensions (English, Roman Urdu, Urdu Script)
    {
      category: 'URGENCY_MANIPULATION',
      regex: /(?:\b(?:urgent|urgently|immediately|within 24 hours|suspended today|account will be terminated|account is suspended|account has been suspended|act now|expires in|foran|jaldi|abhi karo|block honay wala hai|bhai jaldi|waqt bohot kam|last chance|der mat karo|temporarily suspended|restore your account|cancel the transaction|cancel within)\b|(?:فوراً|جلدی|ابھی\s*کے\s*ابھی|وقت\s*کم\s*ہے|آخری\s*موقع|اکاؤنٹ\s*بند))/i,
      weight: 45,
      description: 'Linguistic urgency pressure coercing fast action without independent verification.',
    },
    // 2. Executive Impersonation & Gift Card Scams (CEO Fraud)
    {
      category: 'SOCIAL_ENGINEERING',
      regex: /(?:\b(?:gift card|gift cards|apple gift card|itunes|google play card|steam card|scratch off|take photo|take photos|emergency meeting|board meeting|in a meeting|don't call me|dont call me|just message|buy \d+x?)\b)/i,
      weight: 65,
      description: 'Executive impersonation or gift card advance-fee fraud solicitation.',
    },
    // 3. Payroll, Direct Deposit & Wire Transfer Hijacking
    {
      category: 'FINANCIAL_FRAUD',
      regex: /(?:\b(?:direct deposit|routing #|routing number|account #|bank account #|wire transfer|payroll payout|payout to|update my bank|banking details for direct deposit)\b)/i,
      weight: 60,
      description: 'Direct deposit or payroll wire transfer redirection fraud.',
    },
    // 4. Extortion, Non-Consensual Image Leak & Sextortion Blackmail Threats (Urdu, Roman Urdu, English)
    {
      category: 'BLACKMAIL_SEXTORTION',
      regex: /(?:\b(?:teri|tumhari|apki|uski|your)\b.*?\b(?:pics?|pictures?|photos?|videos?|tasveere?i?n?|recordings?|nudes?)\b.*?\b(?:viral|leak|upload|send|post|share|expose|daal|charha|forward|bhej)\b.*?\b(?:kar dunga|kar donga|kardunga|kr donga|karoon?ga|dunga|will|warna|ruin|barbaad)\b|\b(?:facebook|tiktok|instagram|social media|internet|youtube|whatsapp|group)\b.*?\b(?:pe|par|main|mein)\b.*?\b(?:daal|upload|charha|viral|post|leak|share)\b.*?\b(?:dunga|kardunga|kr donga|donga)\b|\b(?:tere|tumhare|apke|your)\b.*?\b(?:abba|abbu|bhai|walid|family|rishtedar(?:on)?|ghar wal(?:on)?|ammi|parents|friends)\b.*?\b(?:ko|k pas|to)\b.*?\b(?:send|bhej|dikha|forward)\b.*?\b(?:dunga|kardunga|kr donga|donga)\b|\b(?:i will|i\'ll)\s+(?:leak|expose|post|viral|share|publish)\s+(?:your\s+)?(?:nudes?|pics?|pictures?|private|photos?|videos?)\b|\b(?:send|bhejo|transfer)\s+.*?\b(?:money|paise|pics?|photos?|nudes?)\b.*?\b(?:warna|or else|otherwise)\b.*?\b(?:viral|leak|barbaad|ruin)\b|\b(?:saboot hai mere paas|barbaad kar dunga|sab ko dikhaunga|ruin your life|sab ko bhej dunga)\b|(?:تصویریں\s*وائرل|ویڈیو\s*لیک|فیس\s*بک\s*پر|والدین\s*کو\s*بھیج|برباد\s*کر\s*دوں\s*گا|بلیک\s*میل|سب\s*کو\s*دکھاؤں\s*گا))/i,
      weight: 95,
      description: 'Critical cyber-blackmail, sextortion, or non-consensual private image leak threat detected.',
    },
    // 4b. Coercive Intimate Media Solicitation & Emotional Exploitation
    {
      category: 'COERCIVE_INTIMATE_SOLICITATION',
      regex: /(?:\b(?:nudes?|private\s*(?:pic|pics|photo|photos|video|videos)|tasveer|tasveerein)\b.*?\b(?:send karo|bhejo|dikhao|share karo|do)\b|\b(?:camera|cam)\s*(?:kholo|on karo|start karo|open karo)\b|\b(?:kapr[ae]y?\s*utaro|take off your clothes)\b|\bagar\s*(?:sach\s*mein\s*)?(?:pyar|mohabbat)\s*(?:karti|karte)\s*ho\s*to\s*.*?\b(?:saboot do|tasveer|pic|photo)\b|\bprove your love\b.*?\b(?:sending|photo|pic|picture)\b|\bif you (?:really )?love me\b.*?\b(?:send|show)\b|\b(?:kisi ko|kisi se)\s*(?:mat batana|share na karna|nahi batana)\b.*?\b(?:secret|raz|baat)\b|\bbreak up\s*kar\s*(?:lunga|loonga)\s*agar\s*.*?(?:pic|photo|tasveer)\b|(?:برہنہ\s*تصویر|ثبوت\s*دو|پیار\s*کا\s*ثبوت|کپڑے\s*اتار))/i,
      weight: 80,
      description: 'Coercive solicitation of private/intimate imagery or emotional manipulation detected.',
    },
    // 4c. General Device Compromise / Webcam Ransom Threats
    {
      category: 'SOCIAL_ENGINEERING',
      regex: /(?:\b(?:webcam footage|recorded your webcam|compromised your device|leaked to your contacts|transfer \$?\d+ in bitcoin|bitcoin to wallet|pay the ransom|private files will be leaked|compromised your system)\b)/i,
      weight: 75,
      description: 'Coercive extortion, sextortion, or cryptocurrency ransom blackmail threat.',
    },
    // 5. Code Injection & Exploit Payloads
    {
      category: 'MALICIOUS_URL',
      regex: /(?:<script[\s>]|javascript:|onerror\s*=|onload\s*=|powershell(?:\.exe)?|invoke-webrequest|\$env:temp|attacker-c2|evil-corp|malware\.exe)/i,
      weight: 75,
      description: 'Malicious payload injection, XSS exploit, or shell execution script detected.',
    },
    // 6. Authority & Law Enforcement Extortion (FIA, Police, Cyber Crime, Court)
    {
      category: 'AUTHORITY_IMPERSONATION',
      regex: /(?:\b(?:federal police|fia|police department|fbi|irs|tax department|security team|head office|court order|arrest warrant|fir darj|legal action|cyber crime|inspector|manager|helpline)\b|(?:ایف\s*آئی\s*اے|سائبر\s*کرائم|پولیس|وارنٹ|گرفتاری|مقدمہ\s*درج|قانونی\s*نوٹس|عدالتی\s*نوٹس|سرکاری\s*نوٹس|جرمانہ|سیکیورٹی\s*ٹیم))/i,
      weight: 50,
      description: 'Authority impersonation or legal coercion intimidation language.',
    },
    // 7. Secrecy & Isolation
    {
      category: 'SECRECY_PRESSURE',
      regex: /(?:\b(?:don't tell anyone|keep this secret|between you and me|confidential matter|kisi ko mat batana|chup rehna|kisi se share mat karna|raaz rakhna|keep this confidential)\b|(?:کسی\s*کو\s*مت\s*بتانا|خفیہ|راز|خاموش\s*رہیں))/i,
      weight: 40,
      description: 'Isolation tactics instructing recipient to conceal communication from family or colleagues.',
    },
    // 8. Credential Solicitation (Password, PIN, OTP, CNIC)
    {
      category: 'CREDENTIAL_HARVESTING',
      regex: /(?:\b(?:send me (?:your )?(?:password|pin|otp|code|card details)|apna (?:password|pin|code|otp|cnic|shanakhti card) (?:bhejo|send karo|share karo)|tasdeeqi code send karo|4 digit code batao|confirm your (?:seed phrase|password|pin)|restore your (?:account|wallet))\b|(?:پاس\s*ورڈ|او\s*ٹی\s*پی|پن\s*کوڈ|شناختی\s*کارڈ|تصدیقی\s*کوڈ))/i,
      weight: 65,
      description: 'Direct conversational solicitation of confidential authentication credentials or 2FA OTP codes.',
    },
    // 9. Financial Fraud & Lottery Scams (BISP, Ehsaas, Jeeto Pakistan, Lottery, Fake Tasks)
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
