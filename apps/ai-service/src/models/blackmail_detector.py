import os
import re
import joblib
from typing import Dict, Any, List

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models_store", "unified_online_guardian.joblib")
_ml_blackmail_model = None

def get_blackmail_model():
    global _ml_blackmail_model
    if _ml_blackmail_model is None and os.path.exists(MODEL_PATH):
        try:
            _ml_blackmail_model = joblib.load(MODEL_PATH)
        except Exception as e:
            print(f"Warning: Failed to load trained Blackmail model: {e}")
    return _ml_blackmail_model

class BlackmailDetector:
    """
    Zero-Trust Sextortion, Cyber-Blackmail & Non-Consensual Image Leak Detector.
    Integrates:
    1. 35,000-sample trained Blackmail Linear SGD / TF-IDF Classifier
    2. Deep Heuristic Extortion & Coercive Solicitation Patterns:
       - Threatening to leak private photos/videos to family (abba, bhai, walid, rishtedar)
       - Threatening to upload to social media (Facebook, TikTok, Instagram, WhatsApp groups)
       - Coercive intimate photo demands ("prove your love", "pic bhejo warna breakup")
       - Emotional isolation & secrecy pressure ("kisi ko mat batana", "hamara secret hai")
    """

    BLACKMAIL_LEAK_PATTERNS = [
        r'(?:\b(?:teri|tumhari|apki|uski|your)\b.*?\b(?:pics?|pictures?|photos?|videos?|tasveere?i?n?|recordings?|nudes?)\b.*?\b(?:viral|leak|upload|send|post|share|expose|daal|charha|forward|bhej)\b.*?\b(?:kar dunga|kar donga|kardunga|kr donga|karoon?ga|dunga|will|warna|ruin|barbaad)\b)',
        r'(?:\b(?:facebook|tiktok|instagram|social media|internet|youtube|whatsapp|group)\b.*?\b(?:pe|par|main|mein)\b.*?\b(?:daal|upload|charha|viral|post|leak|share)\b.*?\b(?:dunga|kardunga|kr donga|donga)\b)',
        r'(?:\b(?:tere|tumhare|apke|your)\b.*?\b(?:abba|abbu|bhai|walid|family|rishtedar(?:on)?|ghar wal(?:on)?|ammi|parents|friends)\b.*?\b(?:ko|k pas|to)\b.*?\b(?:send|bhej|dikha|forward)\b.*?\b(?:dunga|kardunga|kr donga|donga)\b)',
        r'(?:\b(?:i will|i\'ll)\s+(?:leak|expose|post|viral|share|publish)\s+(?:your\s+)?(?:nudes?|pics?|pictures?|private|photos?|videos?)\b)',
        r'(?:\b(?:send|bhejo|transfer)\s+.*?\b(?:money|paise|pics?|photos?|nudes?)\b.*?\b(?:warna|or else|otherwise)\b.*?\b(?:viral|leak|barbaad|ruin)\b)',
        r'(?:\b(?:saboot hai mere paas|barbaad kar dunga|sab ko dikhaunga|ruin your life|sab ko bhej dunga)\b)',
        r'(?:تصویریں\s*وائرل|تصاویر\s*وائرل|تصاویر.*وائرل|ذاتی\s*تصاویر|ویڈیو\s*لیک|فیس\s*بک\s*پر|سوشل\s*میڈیا\s*پر\s*وائرل|والدین\s*کو\s*بھیج|برباد\s*کر\s*دوں\s*گا|بلیک\s*میل|سب\s*کو\s*دکھاؤں\s*گا)'
    ]

    COERCIVE_SOLICITATION_PATTERNS = [
        r'(?:\b(?:nudes?|private\s*(?:pic|pics|photo|photos|video|videos)|tasveer|tasveerein)\b.*?\b(?:send karo|bhejo|dikhao|share karo|do)\b)',
        r'(?:\b(?:camera|cam)\s*(?:kholo|on karo|start karo|open karo)\b)',
        r'(?:\b(?:kapr[ae]y?\s*utaro|take off your clothes)\b)',
        r'(?:\bagar\s*(?:sach\s*mein\s*)?(?:pyar|mohabbat)\s*(?:karti|karte)\s*ho\s*to\s*.*?\b(?:saboot do|tasveer|pic|photo)\b)',
        r'(?:\bprove your love\b.*?\b(?:sending|photo|pic|picture)\b)',
        r'(?:\bif you (?:really )?love me\b.*?\b(?:send|show)\b)',
        r'(?:\b(?:kisi ko|kisi se)\s*(?:mat batana|share na karna|nahi batana)\b.*?\b(?:secret|raz|baat)\b)',
        r'(?:\bbreak up\s*kar\s*(?:lunga|loonga)\s*agar\s*.*?(?:pic|photo|tasveer)\b)',
        r'(?:برہنہ\s*تصویر|ثبوت\s*دو|پیار\s*کا\s*ثبوت|کپڑے\s*اتار)'
    ]

    @classmethod
    def scan(cls, text: str) -> Dict[str, Any]:
        evidence: List[Dict[str, Any]] = []
        is_blackmail_threat = False
        is_coercive_solicitation = False
        heuristic_score = 0.0

        # 1. Pattern-based deterministic analysis
        for pattern in cls.BLACKMAIL_LEAK_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                is_blackmail_threat = True
                heuristic_score = max(heuristic_score, 95.0)
                evidence.append({
                    "category": "BLACKMAIL_SEXTORTION",
                    "signal": "IMAGE_LEAK_EXTORTION",
                    "confidence": 0.98,
                    "detectionBasis": "DETERMINISTIC_RULE",
                    "description": "Explicit threat to leak private images/videos or humiliate victim to family/online."
                })
                break

        for pattern in cls.COERCIVE_SOLICITATION_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                is_coercive_solicitation = True
                heuristic_score = max(heuristic_score, 80.0)
                evidence.append({
                    "category": "COERCIVE_INTIMATE_SOLICITATION",
                    "signal": "INTIMATE_MEDIA_COERCION",
                    "confidence": 0.92,
                    "detectionBasis": "DETERMINISTIC_RULE",
                    "description": "Coercive solicitation of intimate photos or emotional exploitation detected."
                })
                break

        # 2. Machine Learning Model Inference
        ml_score = 0.0
        ml_detected = False
        saved_model = get_blackmail_model()
        if saved_model and text.strip():
            try:
                vec = saved_model.get("vectorizer")
                clf = saved_model.get("model")
                if vec and clf:
                    X = vec.transform([text.strip()])
                    probs = clf.predict_proba(X)[0]
                    ml_score = float(probs[1]) * 100
                    if ml_score >= 65.0:
                        ml_detected = True
                        evidence.append({
                            "category": "BLACKMAIL_SEXTORTION",
                            "signal": "ML_EXTORTION_CLASSIFIER",
                            "confidence": round(ml_score / 100.0, 2),
                            "detectionBasis": "LOCAL_AI_MODEL",
                            "description": f"AI statistical classifier flagged extortion patterns with {ml_score:.1f}% confidence."
                        })
            except Exception as e:
                pass

        final_score = max(heuristic_score, ml_score if ml_score >= 70.0 else 0.0)
        detected = is_blackmail_threat or is_coercive_solicitation or (ml_detected and final_score >= 65.0)

        primary_threat = "NONE"
        if is_blackmail_threat or (ml_detected and final_score >= 80.0):
            primary_threat = "BLACKMAIL_SEXTORTION"
        elif is_coercive_solicitation:
            primary_threat = "COERCIVE_INTIMATE_SOLICITATION"

        return {
            "blackmail_detected": detected,
            "is_blackmail_threat": is_blackmail_threat,
            "is_coercive_solicitation": is_coercive_solicitation,
            "risk_score": min(100.0, round(final_score, 1)),
            "primary_threat": primary_threat,
            "evidence": evidence
        }
