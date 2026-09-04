import re
import os
import joblib
from typing import Dict, Any, List

# Load trained ML multi-label model
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models_store", "social_engineering_model.joblib")
_ml_social_model = None
if os.path.exists(MODEL_PATH):
    try:
        _ml_social_model = joblib.load(MODEL_PATH)
    except Exception as e:
        print(f"Warning: Failed to load trained social engineering model: {e}")

TARGET_NAMES = [
    "urgency",
    "authority",
    "fear",
    "reward",
    "secrecy",
    "pressure",
    "isolation",
    "financial_pressure",
    "credential_solicitation"
]

class SocialEngineeringDetector:
    """
    Multilingual Social Engineering & Manipulation Detector.
    Strict implementation of Section 2 ('Social-Engineering Model') from 'How to train model.docx'.
    Supports English, Urdu script, and Roman Urdu.
    Cascades trained Multi-label TF-IDF Logistic Regression model with deterministic rule heuristics.
    """

    CLEAN_GREETINGS = {
        "hi", "hello", "hey", "salam", "assalam", "assalamu alaikum", "assalam o alaikum",
        "aoa", "good morning", "good evening", "good afternoon", "good night",
        "how are you", "kese ho", "kaisay ho", "kia haal hai", "kya haal hai",
        "ok", "okay", "yes", "no", "han", "nahi", "shukriya", "thanks", "thank you",
        "bye", "tc", "take care", "kal miltay hain", "see you"
    }

    PATTERNS = {
        "urgency": [
            r'\b(?:urgent|immediately|act now|hurry|expires in|limited time|critical|suspended today|within (?:10|24|48) (?:minutes|hours))\b',
            r'\b(?:foran|jaldi|abhi k abhi|time bohot kam|last chance|der mat karo)\b',
            r'(?:فوری|جلدی|ابھی\s*کے\s*ابھی|وقت\s*کم\s*ہے|آخری\s*موقع)'
        ],
        "authority": [
            r'\b(?:it support|administrator|security team|federal|officer|fbi|fia|cyber crime|ceo|director|bank official)\b',
            r'\b(?:cyber crime|inspector|manager|helpline|support team|hbl|easypaisa helpline)\b',
            r'(?:افسر|سپورٹ ٹیم|سیکیورٹی ٹیم|منیجر)'
        ],
        "fear": [
            r'\b(?:suspended|terminated|arrest|law enforcement|legal action|court|fine|penalty|police|seized|blocked)\b',
            r'\b(?:account band|block ho jaye ga|police|adalat|fine lagega|jail)\b',
            r'(?:بند\s*ہو\s*جائے\s*گا|گرفتار|پولیس|عدالت|جرمانہ)'
        ],
        "reward": [
            r'\b(?:won|prize|lottery|lucky draw|free gift|bonus|cash reward|bisp|inaam|claim reward)\b',
            r'\b(?:inaam nikla|qurandazi|muft|cash prize)\b',
            r'(?:انعام|قرعہ اندازی|مفت|لاٹری)'
        ],
        "secrecy": [
            r'\b(?:do not tell|keep this confidential|private between us|do not disclose|secret|silence|shhh)\b',
            r'\b(?:kisi ko mat batana|chup chap|kisi se share mat karo|raaz)\b',
            r'(?:کسی\s*کو\s*مت\s*بتانا|خفیہ|راز)'
        ],
        "pressure": [
            r'\b(?:why don\'t you trust|prove yourself|if you love me|last chance|why are you hesitating)\b',
            r'\b(?:bharosa nahi|pyar karti|shak kar rahe)\b',
            r'(?:مجھ\s*پر\s*بھروسہ\s*نہیں)'
        ],
        "isolation": [
            r'\b(?:don\'t ask anyone|don\'t consult|ignore others|only trust me|do not talk to your family)\b',
            r'\b(?:kisi se mat poochna|ghar walon ko mat batana)\b',
            r'(?:کسی\s*سے\s*مشورہ\s*مت\s*کرو)'
        ],
        "financial_pressure": [
            r'\b(?:send money|transfer cash|pay now|wire money|deposit funds|easypaisa|jazzcash)\b',
            r'\b(?:pesay bhejo|raqam transfer karo|foran send karo)\b',
            r'(?:رقم\s*بھیجو|پیسے\s*ٹرانسفر\s*کرو)'
        ],
        "credential_solicitation": [
            r'\b(?:password|otp|pin|verification code|seed phrase|private key|card number|cvv)\b',
            r'\b(?:password send karo|otp bhej do|pin code|apna password|de do|bhejo|tasdeeqi code)\b',
            r'(?:پاس\s*ورڈ|او\s*ٹی\s*پی|پن\s*کوڈ|تصدیقی\s*کوڈ)'
        ]
    }

    @classmethod
    def classify(cls, text: str) -> Dict[str, Any]:
        normalized = text.strip().lower().rstrip("!.,?")
        
        # 0. Clean common greeting & conversational tokens bypass
        if normalized in cls.CLEAN_GREETINGS:
            return {
                "social_engineering_detected": False,
                "social_engineering_index": 0.0,
                "detected_categories": [],
                "category_scores": {},
                "ml_model_active": _ml_social_model is not None
            }

        detected_categories = set()
        category_scores: Dict[str, float] = {}

        # 1. Deterministic Rule Matching (Level 0)
        for cat, regex_list in cls.PATTERNS.items():
            for reg in regex_list:
                if re.search(reg, text, re.IGNORECASE):
                    detected_categories.add(cat)
                    category_scores[cat] = 0.90
                    break

        # 2. Trained Multi-Label ML Classifier (Level 1)
        ml_active = False
        if _ml_social_model is not None and len(text.split()) >= 2:
            try:
                ml_active = True
                if isinstance(_ml_social_model, dict) and "vectorizer" in _ml_social_model and "models" in _ml_social_model:
                    vec = _ml_social_model["vectorizer"].transform([text])
                    for tech_name, clf in _ml_social_model["models"].items():
                        prob = float(clf.predict_proba(vec)[0][1])
                        if prob >= 0.55:
                            detected_categories.add(tech_name)
                            category_scores[tech_name] = max(category_scores.get(tech_name, 0.0), prob)
                else:
                    pred_proba = _ml_social_model.predict_proba([text])
                    for idx, cat_name in enumerate(TARGET_NAMES):
                        if idx < len(pred_proba):
                            prob = float(pred_proba[idx][0][1]) if len(pred_proba[idx][0]) > 1 else float(pred_proba[idx][0][0])
                            if prob >= 0.55:
                                detected_categories.add(cat_name)
                                category_scores[cat_name] = max(category_scores.get(cat_name, 0.0), prob)
            except Exception:
                pass

        # Composite social engineering index
        weights = {
            "urgency": 0.35,
            "authority": 0.40,
            "fear": 0.35,
            "reward": 0.30,
            "secrecy": 0.35,
            "pressure": 0.35,
            "isolation": 0.40,
            "financial_pressure": 0.45,
            "credential_solicitation": 0.50
        }

        total_weight = sum(weights.get(cat, 0.30) * category_scores.get(cat, 0.90) for cat in detected_categories)
        index = min(1.0, total_weight)

        behavioral_summary = ""
        if detected_categories:
            tech_str = " + ".join(sorted(list(detected_categories)))
            behavioral_summary = f"Observable technique pressure detected: {tech_str}"

        return {
            "social_engineering_detected": len(detected_categories) > 0,
            "social_engineering_index": round(index, 2),
            "detected_categories": list(detected_categories),
            "category_scores": {k: round(v, 2) for k, v in category_scores.items()},
            "behavioral_summary": behavioral_summary,
            "ml_model_active": ml_active
        }
