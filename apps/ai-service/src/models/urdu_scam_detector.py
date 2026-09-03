import os
import re
import joblib
from typing import Dict, Any, List

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models_store", "unified_online_guardian.joblib")
_ml_roman_urdu_model = None

def get_roman_urdu_model():
    global _ml_roman_urdu_model
    if _ml_roman_urdu_model is None and os.path.exists(MODEL_PATH):
        try:
            _ml_roman_urdu_model = joblib.load(MODEL_PATH)
        except Exception as e:
            print(f"Warning: Failed to load trained Roman Urdu model: {e}")
    return _ml_roman_urdu_model

class UrduScamDetector:
    """
    Zero-Trust Urdu & Roman Urdu Scam / Social Engineering Detector.
    Integrates:
    1. 500,000-dataset trained Roman Urdu Linear SGD / TF-IDF Classifier
    2. Native Urdu Script (عربی رسم الخط) Heuristic NLP Engine
    3. Regional South Asian / Pakistani Financial Fraud Archetypes:
       - Easypaisa / JazzCash / Bank Account Block & OTP Solicitation
       - BISP / Ehsaas / Rashan Relief Fund Fraud
       - Jeeto Pakistan / ARY / Bol Lottery & Gold Prize Scams
       - FIA / Cyber Crime / Police Extortion & Arrest Threats
       - Emergency / Hospital Hospitalization Relative Impersonation
       - Fake Online Task / Daily Earning Investment Scams
    """

    # Comprehensive Regex Patterns for Native Urdu & Roman Urdu
    URDU_SCAM_PATTERNS = {
        "BISP_EHSAAS_FRAUD": [
            r'(?:بے\s*نظیر|بینظیر|احساس\s*پروگرام|راشن\s*رعایت|امداد\s*حاصل|25000\s*روپے|رقم\s*حاصل\s*کریں)',
            r'\b(?:bisp|ehsaas|benazir|rashan|8171|786|wazifa|25000|35000|50000\s*mubarak|paisa niklwain|imdad)\b'
        ],
        "BANKING_EASYPAISA_TAKEOVER": [
            r'(?:ایزی\s*پیسہ|جاز\s*کیش|اکاؤنٹ\s*بلاک|پاس\s*ورڈ\s*بھیجیں|او\s*ٹی\s*پی|پن\s*کوڈ|تصدیق\s*کریں|بند\s*ہو\s*جائے\s*گا)',
            r'\b(?:easypaisa|jazzcash|hbl|ubl|meezan|mcb|nayapay|sadapay)\s*(?:account|app)?\s*(?:block|band|suspend|verify|update|otp|pin|password|helpline)\b',
            r'\b(?:account block honay wala|foran call karein|pin send karein|otp share karein|account band|helpline pe rabta)\b'
        ],
        "LOTTERY_PRIZE_SCAM": [
            r'(?:جیتو\s*پاکستان|قرعہ\s*اندازی|سونے\s*کا\s*سیٹ|گاڑی\s*نکل|مبارک\s*ہو.*انعام|لاٹری)',
            r'\b(?:jeeto pakistan|fahad mustafa|lottery|inaam nikla|car jeet li|sona nikla|5 tola|mubarak ho.*inaam|lucky draw|bisp lottery)\b'
        ],
        "LAW_ENFORCEMENT_EXTORTION": [
            r'(?:ایف\s*آئی\s*اے|سائبر\s*کرائم|پولیس|وارنٹ|گرفتاری|مقدمہ\s*درج|قانونی\s*نوٹس|عدالتی\s*نوٹس|سرکاری\s*نوٹس|جرمانہ)',
            r'\b(?:fia|cyber crime|police|warrant|girftari|muqadma|court notice|fir darj|fine ada karein|jail)\b'
        ],
        "RELATIVE_EMERGENCY_IMPERSONATION": [
            r'(?:ہسپتال|ایمرجنسی|حادثہ|امی\s*کی\s*طبیعت|خون\s*کی\s*ضرورت|فوری\s*پیسے\s*بھیجیں)',
            r'\b(?:hospital|emergency|hadsa|accident|ammi bimar|operation|foran.*paisa.*bhejo|udhar de do|intiqal)\b'
        ],
        "FAKE_TASK_EARNING_SCAM": [
            r'(?:روزانہ\s*\d+\s*کمائیں|گھر\s*بیٹھے\s*کمائیں|آن\s*لائن\s*ملازمت|انویسٹمنٹ.*منافع|ٹاسک\s*مکمل)',
            r'\b(?:daily\s*\d+\s*kamayein|ghar bethay.*kamayein|online job|task complete|investment double|profit guaranteed)\b'
        ]
    }

    @classmethod
    def scan(cls, text: str) -> Dict[str, Any]:
        signals = []
        categories_detected = []
        score = 0.0

        # 1. Native Urdu & Roman Urdu Pattern Engine
        for cat_name, pattern_list in cls.URDU_SCAM_PATTERNS.items():
            for pat in pattern_list:
                if re.search(pat, text, re.IGNORECASE):
                    categories_detected.append(cat_name)
                    if cat_name in ("BISP_EHSAAS_FRAUD", "BANKING_EASYPAISA_TAKEOVER", "LOTTERY_PRIZE_SCAM", "LAW_ENFORCEMENT_EXTORTION"):
                        score += 80
                        signals.append(f"Urdu High-Severity Fraud: {cat_name.replace('_', ' ')}")
                    else:
                        score += 55
                        signals.append(f"Urdu Social Engineering Indicator: {cat_name.replace('_', ' ')}")
                    break

        ml_model = get_roman_urdu_model()
        ml_score = 0.0
        ml_active = ml_model is not None

        # Clean short phrases guard (e.g. "hi", "ok", "salam", "theek hai")
        words = text.strip().split()
        if len(words) < 3 and len(categories_detected) == 0:
            return {
                "scam_detected": False,
                "risk_score": 0,
                "confidence": 0.0,
                "detected_categories": [],
                "signals": [],
                "ml_model_active": ml_active
            }

        # 2. 500k-Dataset Trained Machine Learning Model Inference
        if ml_model is not None and len(words) >= 3:
            try:
                if isinstance(ml_model, dict):
                    vec = ml_model.get("vectorizer")
                    clf = ml_model.get("model")
                    pred_prob = clf.predict_proba(vec.transform([text]))[0][1]
                else:
                    pred_prob = ml_model.predict_proba([text])[0][1]
                ml_score = float(pred_prob) * 100
                if ml_score >= 65.0 or (ml_score >= 50.0 and len(categories_detected) > 0):
                    score = max(score, ml_score)
                    signals.append(f"Unified Online Guardian ML Classifier: {ml_score:.1f}% scam confidence")
                elif ml_score < 20.0 and not categories_detected:
                    score = min(score, 10.0)
            except Exception as e:
                pass

        final_score = min(100.0, max(0.0, score))
        is_scam = final_score >= 45.0 or len(categories_detected) > 0

        return {
            "scam_detected": is_scam,
            "risk_score": round(final_score),
            "confidence": round(max(final_score / 100.0, 0.90 if is_scam else 0.0), 2),
            "detected_categories": list(set(categories_detected)),
            "signals": signals,
            "ml_model_active": ml_active
        }
