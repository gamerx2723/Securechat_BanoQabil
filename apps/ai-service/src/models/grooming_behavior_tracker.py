import re
from typing import Dict, Any, List

class GroomingBehaviorTracker:
    """
    Multi-Turn Behavioral Escalation, Grooming & Romance Scam Tracker.
    Analyzes sliding windows of 15-20 chronological messages to evaluate:
    1. Intimacy Acceleration (Sudden shift from stranger to pseudo-intimacy)
    2. Platform Migration & Isolation Attempts ("Move to Telegram", "Keep this confidential")
    3. Emotional Exploitation & Pity Lures ("Sudden emergency", "Stuck in hospital", "Prove you love me")
    4. Financial Pressure & Extortion Shift (Cryptocurrency, Gift cards, Wire transfers, Private media demands)
    """

    INTIMACY_PATTERNS = [
        r'\b(?:you\s*(?:are\s*)?special|trust\s*(?:me|you)|only\s*(?:telling|talking\s*to)\s*you|deep\s*connection|soulmate|love\s*you|my\s*love|darling|babe|baby|sweetheart)\b',
        r'\b(?:tum\s*bohot\s*(?:achay|pyaray|special)\s*ho|sirf\s*tum\s*par\s*bharosa|pyar\s*(?:karta|karti)\s*hoon|jaan|meri\s*jaan|dil\s*se\s*chahata)\b',
        r'(?:تم\s*بہت\s*خاص\s*ہو|صرف\s*تم\s*پر\s*بھروسہ|پیار\s*کرتا\s*ہوں)'
    ]

    ISOLATION_PATTERNS = [
        r'\b(?:switch\s*to\s*(?:telegram|whatsapp|signal|snapchat|secret\s*chat)|let\'s\s*(?:talk|chat)\s*(?:on|in)\s*(?:telegram|whatsapp|signal)|add\s*me\s*on\s*telegram)\b',
        r'\b(?:telegram\s*pe\s*aao|whatsapp\s*pe\s*baat\s*karein|yahan\s*se\s*delete\s*karo|secret\s*app|kisi\s*ko\s*mat\s*batana|kisi\s*se\s*share\s*mat\s*karna)\b',
        r'\b(?:do\s*not\s*tell\s*(?:anyone|family|parents|friends)|between\s*(?:you\s*and\s*me|us\s*only)|raaz\s*rakhna|chup\s*rehna)\b',
        r'(?:ٹیلی\s*گرام\s*پر\s*آؤ|کسی\s*کو\s*مت\s*بتانا|راز\s*رکھنا|خفیہ\s*رابطہ)'
    ]

    PITY_EMERGENCY_PATTERNS = [
        r'\b(?:stuck\s*in\s*(?:hospital|customs|airport|police\s*station)|lost\s*my\s*wallet|mother\s*is\s*sick|urgent\s*medical|accident\s*ho\s*gaya|hospital\s*mein\s*hoon|ammi\s*bimar)\b',
        r'\b(?:if\s*you\s*(?:really\s*)?love\s*me|prove\s*your\s*love|why\s*don\'t\s*you\s*trust\s*me|agar\s*pyar\s*karti\s*ho|bharosa\s*nahi\s*hai)\b',
        r'(?:ہسپتال\s*میں\s*ہوں|حادثہ\s*ہو\s*گیا|پیار\s*کا\s*ثبوت)'
    ]

    EXPLOITATION_PATTERNS = [
        r'\b(?:send\s*(?:money|funds|cash|crypto|bitcoin|usdt|gift\s*card|pics?|nudes?)|transfer\s*(?:now|karo|bhejo)|easypaisa|jazzcash)\b',
        r'\b(?:paise\s*(?:bhejo|transfer\s*karo|send\s*karo)|foran\s*raqam|private\s*(?:pic|photo|video)\s*bhejo)\b',
        r'\b(?:guaranteed\s*(?:profit|returns?|crypto\s*trade)|invest\s*in\s*my\s*platform|deposit\s*now)\b',
        r'(?:رقم\s*بھیجو|پیسے\s*ٹرانسفر\s*کرو|نجی\s*تصویر\s*بھیجو)'
    ]

    @classmethod
    def analyze_behavior(cls, messages: List[str]) -> Dict[str, Any]:
        if not messages:
            return {
                "grooming_detected": False,
                "grooming_risk_score": 0,
                "current_stage": "BENIGN_BASELINE",
                "stage_label": "Safe Communication Baseline",
                "velocity_summary": "No conversational anomalies or manipulation pressure detected.",
                "intimacy_index": 0.0,
                "isolation_index": 0.0,
                "exploitation_index": 0.0,
                "timeline_milestones": [],
                "recommendation": "Normal secure communication."
            }

        window = messages[-20:]
        intimacy_count = 0
        isolation_count = 0
        pity_count = 0
        exploitation_count = 0
        milestones = []

        for idx, text in enumerate(window):
            step_num = idx + 1
            step_tags = []

            # Check intimacy
            for p in cls.INTIMACY_PATTERNS:
                if re.search(p, text, re.IGNORECASE):
                    intimacy_count += 1
                    step_tags.append("Intimacy Acceleration")
                    break

            # Check isolation
            for p in cls.ISOLATION_PATTERNS:
                if re.search(p, text, re.IGNORECASE):
                    isolation_count += 1
                    step_tags.append("Platform Migration / Secrecy Pressure")
                    break

            # Check pity/emergency
            for p in cls.PITY_EMERGENCY_PATTERNS:
                if re.search(p, text, re.IGNORECASE):
                    pity_count += 1
                    step_tags.append("Emotional Distress / Pity Lure")
                    break

            # Check exploitation
            for p in cls.EXPLOITATION_PATTERNS:
                if re.search(p, text, re.IGNORECASE):
                    exploitation_count += 1
                    step_tags.append("Financial / Media Solicitation")
                    break

            if step_tags:
                milestones.append({
                    "step": step_num,
                    "snippet": (text[:60] + "...") if len(text) > 60 else text,
                    "signals": step_tags
                })

        total_turns = len(window)
        intimacy_idx = min(1.0, round(intimacy_count / max(1, total_turns * 0.3), 2))
        isolation_idx = min(1.0, round(isolation_count / max(1, total_turns * 0.25), 2))
        pity_idx = min(1.0, round(pity_count / max(1, total_turns * 0.25), 2))
        exploitation_idx = min(1.0, round(exploitation_count / max(1, total_turns * 0.2), 2))

        # Risk calculation
        risk_score = (
            intimacy_idx * 25.0 +
            isolation_idx * 35.0 +
            pity_idx * 25.0 +
            exploitation_idx * 50.0
        )

        # Compound escalation multiplier:
        # If intimacy + isolation + exploitation are all present in sequence
        has_full_escalation = (intimacy_count > 0 or pity_count > 0) and isolation_count > 0 and exploitation_count > 0
        if has_full_escalation:
            risk_score = max(risk_score, 88.0)

        final_risk = min(100, round(risk_score))
        grooming_detected = final_risk >= 40

        # Determine stage
        if final_risk >= 80 or (isolation_count > 0 and exploitation_count > 0):
            current_stage = "COERCIVE_EXPLOITATION"
            stage_label = "Stage 4: Active Coercion / Financial Extortion"
            summary = "CRITICAL ALERT: Multi-turn grooming detected. The contact established emotional trust and isolation before demanding funds or sensitive media."
            rec = "DANGER: Do not transfer money, do not send private media, and do not switch to external unencrypted apps. Block the contact immediately."
        elif isolation_count > 0:
            current_stage = "SOCIAL_ISOLATION"
            stage_label = "Stage 3: Social Isolation & Secret Channel Lure"
            summary = "ELEVATED RISK: Contact is attempting to isolate you from support systems or migrate you to external unmonitored channels (e.g. Telegram/WhatsApp)."
            rec = "Proceed with caution. Never migrate to secret channels to conduct financial transactions or share personal images."
        elif intimacy_count > 0 or pity_count > 0:
            current_stage = "RAPPORT_ACCELERATION"
            stage_label = "Stage 2: Rapid Trust & Intimacy Acceleration"
            summary = "OBSERVED: Unusually rapid establishment of intimacy or emotional distress claims without prior verified relationship."
            rec = "Exercise healthy skepticism. Verify the individual's identity independently before emotional or financial commitment."
        else:
            current_stage = "BENIGN_BASELINE"
            stage_label = "Stage 1: Clean Baseline"
            summary = "Conversation displays normal organic flow with zero manipulative pressure."
            rec = "Normal communication safe to proceed."

        return {
            "grooming_detected": grooming_detected,
            "grooming_risk_score": final_risk,
            "current_stage": current_stage,
            "stage_label": stage_label,
            "velocity_summary": summary,
            "intimacy_index": intimacy_idx,
            "isolation_index": isolation_idx,
            "pity_index": pity_idx,
            "exploitation_index": exploitation_idx,
            "timeline_milestones": milestones,
            "recommendation": rec
        }
