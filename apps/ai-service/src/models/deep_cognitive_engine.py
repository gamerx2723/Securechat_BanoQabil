import re
import math
from typing import Dict, Any, List, Set

class DeepCognitiveEngine:
    """
    High-Capacity Deep Cognitive Semantic Recognizer.
    Performs multi-layered intent extraction across:
    1. Psychological Manipulation Dimensions (Urgency, Authority, Fear, Greed, Secrecy, Distress)
    2. Irreversible Action Solicitation Vectors (Credentials, Funds, Execution, Migration)
    3. Morphological Leetspeak & Homoglyph Normalization
    4. Compound Multi-Vector Cognitive Synthesis
    """

    # Leetspeak & Obfuscation Mapping
    LEET_MAP = {
        '@': 'a', '4': 'a', '8': 'b', '3': 'e', '1': 'i', '!': 'i', '|': 'i',
        '0': 'o', '5': 's', '$': 's', '7': 't', '+': 't', 'v': 'u'
    }

    # Zero-Width Unicode Characters
    ZERO_WIDTH_SET = {'\u200B', '\u200C', '\u200D', '\uFEFF', '\u202A', '\u202E', '\u00AD'}

    @classmethod
    def normalize_text(cls, text: str) -> str:
        """
        Strips anti-analysis zero-width characters, unfolds leetspeak,
        and standardizes Unicode variations.
        """
        # 1. Strip zero-width characters
        cleaned = "".join(c for c in text if c not in cls.ZERO_WIDTH_SET)
        
        # 2. Lowercase and unspace deliberately separated characters (e.g., 'p a y p a l')
        cleaned = re.sub(r'\b([a-zA-Z0-9])\s+([a-zA-Z0-9])\s+([a-zA-Z0-9])\s+([a-zA-Z0-9])\b', r'\1\2\3\4', cleaned)
        
        # 3. Leetspeak unfolding for alphanumeric tokens
        words = cleaned.split()
        normalized_words = []
        for w in words:
            if not w.startswith("http://") and not w.startswith("https://"):
                unleeted = "".join(cls.LEET_MAP.get(ch.lower(), ch.lower()) for ch in w)
                normalized_words.append(unleeted)
            else:
                normalized_words.append(w)

        return " ".join(normalized_words)

    @classmethod
    def analyze_deep_intent(cls, raw_text: str) -> Dict[str, Any]:
        normalized = cls.normalize_text(raw_text)
        signals = []
        vector_scores: Dict[str, float] = {}

        # --- 1. Action Vectors ---
        # A. Credential / Identity Solicitation
        if re.search(r'\b(?:password|passwd|otp|pin|passcode|token|credentials|login\s*details|verification\s*code|cnic|shanakhti\s*card|cvv|card\s*number|seed\s*phrase|secret\s*key|auth\s*session|verify\s*identity)\b', normalized, re.IGNORECASE) or \
           re.search(r'(?:پاس\s*ورڈ|او\s*ٹی\s*پی|پن\s*کوڈ|شناختی\s*کارڈ|تصدیقی\s*کوڈ)', raw_text):
            vector_scores['CREDENTIAL_SOLICITATION'] = 0.95
            signals.append("Explicit / Implicit Authentication Credential Solicitation")

        # B. Financial Value Transfer
        if re.search(r'\b(?:(?:transfer|wire|send|deposit)\s+(?:money|funds|cash|amount|rs\.?|pkr|\$|rupees|payment)|pay\s+(?:now|fee|advance|charges)|paisay\s*(?:send|bhejo|transfer)|easypaisa\s*karo|jazzcash\s*karo)\b', normalized, re.IGNORECASE) or \
           re.search(r'(?:رقم\s*بھیجیں|پیسے\s*ٹرانسفر|ایزی\s*پیسہ\s*کریں)', raw_text):
            vector_scores['VALUE_TRANSFER'] = 0.90
            signals.append("Irreversible Financial Value / Asset Transfer Request")

        # C. Code / App / APK Execution
        if re.search(r'\b(?:download|install|open\s*attachment|run\s*this|setup\s*file|\.apk|\.exe|\.scr|install\s*app|update\s*software)\b', normalized, re.IGNORECASE):
            vector_scores['CODE_EXECUTION'] = 0.85
            signals.append("External Software / Mobile APK Installation Solicitation")

        # D. Channel Migration / Evasion
        if re.search(r'\b(?:message\s*me\s*on\s*(?:whatsapp|telegram|signal)|contact\s*via\s*\+?\d{8,}|inbox\s*me\s*privately)\b', normalized, re.IGNORECASE):
            vector_scores['CHANNEL_MIGRATION'] = 0.70
            signals.append("Off-Platform Channel Migration Directive")

        # --- 2. Psychological Manipulation Vectors ---
        # E. Temporal Urgency
        if re.search(r'\b(?:urgent|immediately|within\s*(?:\d+\s*(?:mins?|hours?|seconds?)|today)|act\s*now|before\s*it\s*expires|deadline|right\s*now|at\s*once|foran|jaldi|abhi\s*k\s*abhi)\b', normalized, re.IGNORECASE) or \
           re.search(r'(?:فوری|جلدی|ابھی\s*کے\s*ابھی|وقت\s*کم\s*ہے)', raw_text):
            vector_scores['TEMPORAL_URGENCY'] = 0.88
            signals.append("High-Intensity Temporal Urgency Pressure")

        # F. Authority & Legal Extortion
        if re.search(r'\b(?:police|fia|fbi|cyber\s*crime|inspector|court\s*order|arrest\s*warrant|fir\s*darj|legal\s*action|head\s*office|security\s*team|administrator)\b', normalized, re.IGNORECASE) or \
           re.search(r'(?:ایف\s*آئی\s*اے|پولیس|وارنٹ|گرفتاری|عدالتی\s*نوٹس)', raw_text):
            vector_scores['AUTHORITY_COERCION'] = 0.92
            signals.append("Authority Impersonation & Legal Enforcement Intimidation")

        # G. Consequence & Penalty Threat
        if re.search(r'\b(?:otherwise|or\s*else|will\s*be\s*(?:cancelled|suspended|blocked|deleted|terminated)|avoid\s*(?:penalty|fine|arrest|loss)|nuksan|band\s*ho\s*jaye\s*ga|jail)\b', normalized, re.IGNORECASE) or \
           re.search(r'(?:اکاؤنٹ\s*بند|جرمانہ|گرفتاری)', raw_text):
            vector_scores['CONSEQUENCE_THREAT'] = 0.90
            signals.append("Asymmetric Negative Consequence / Account Loss Threat")

        # H. Greed & Unrealistic Prize Lure
        if re.search(r'\b(?:guaranteed\s*(?:return|profit)|earn\s*\$?\d+\s*daily|won\s*(?:lottery|prize|car|gold|5\s*tola)|free\s*(?:gift|crypto|tokens?)|bisp|ehsaas|jeeto\s*pakistan|mubarak\s*ho)\b', normalized, re.IGNORECASE) or \
           re.search(r'(?:بے\s*نظیر|احساس|جیتو\s*پاکستان|انعام|لاٹری)', raw_text):
            vector_scores['GREED_LURE'] = 0.92
            signals.append("Unrealistic Financial Reward / Government Grant Lure")

        # I. Simulated Crisis / Distress
        if re.search(r'\b(?:stuck|lost\s*my\s*phone|hospital|emergency|hadsa|accident|in\s*trouble|stranded|help\s*me\s*out|ammi\s*bimar|operation)\b', normalized, re.IGNORECASE) or \
           re.search(r'(?:ہسپتال|ایمرجنسی|حادثہ|امی\s*کی\s*طبیعت)', raw_text):
            vector_scores['CRISIS_SIMULATION'] = 0.85
            signals.append("Simulated Emergency / Relative Crisis Impersonation")

        # J. Verification Bypass & Secrecy
        if re.search(r'\b(?:ignore\s*(?:warning|security\s*alert|prompt)|bypass|do\s*not\s*(?:call|verify|report|ask)|kisi\s*ko\s*mat\s*batana|keep\s*this\s*secret|between\s*us)\b', normalized, re.IGNORECASE) or \
           re.search(r'(?:کسی\s*کو\s*مت\s*بتانا|خفیہ|راز)', raw_text):
            vector_scores['VERIFICATION_BYPASS'] = 0.95
            signals.append("Direct Security Bypass & Social Isolation Directive")

        # K. Anti-Analysis Obfuscation
        zero_width_count = sum(1 for c in raw_text if c in cls.ZERO_WIDTH_SET)
        if zero_width_count > 0:
            vector_scores['OBFUSCATION_EVASION'] = 0.95
            signals.append(f"Anti-Analysis Evasion: {zero_width_count} hidden zero-width characters detected")

        # --- 3. Compound Cognitive Synthesis ---
        action_count = sum(1 for k in ['CREDENTIAL_SOLICITATION', 'VALUE_TRANSFER', 'CODE_EXECUTION', 'CHANNEL_MIGRATION'] if k in vector_scores)
        pressure_count = sum(1 for k in ['TEMPORAL_URGENCY', 'AUTHORITY_COERCION', 'CONSEQUENCE_THREAT', 'GREED_LURE', 'CRISIS_SIMULATION'] if k in vector_scores)
        bypass_count = sum(1 for k in ['VERIFICATION_BYPASS', 'OBFUSCATION_EVASION'] if k in vector_scores)

        compound_score = 0.0
        if action_count > 0 and pressure_count > 0:
            compound_score = max(compound_score, 80.0)
            signals.append("Cognitive Compound Threat: Action Request paired with Asymmetric Pressure Vector")

        if action_count > 0 and bypass_count > 0:
            compound_score = max(compound_score, 90.0)
            signals.append("Critical Compound Threat: Action Solicitation coupled with Verification Bypass / Evasion")

        if action_count > 0 and pressure_count > 0 and bypass_count > 0:
            compound_score = 100.0
            signals.append("Full Spectrum Zero-Trust Attack Chain Confirmed")

        # If individual vectors fired without compound
        if compound_score == 0.0 and len(vector_scores) > 0:
            max_vec = max(vector_scores.values())
            compound_score = max_vec * 55.0

        final_cognitive_score = min(100.0, compound_score)

        return {
            "cognitive_threat_detected": final_cognitive_score >= 40.0,
            "deep_cognitive_score": round(final_cognitive_score),
            "vector_scores": vector_scores,
            "signals": signals,
            "action_vectors_count": action_count,
            "pressure_vectors_count": pressure_count,
            "bypass_vectors_count": bypass_count,
            "normalized_text": normalized
        }
