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

TARGET_NAMES = ["urgency", "fear_intimidation", "authority_impersonation", "secrecy_isolation", "credential_solicitation"]

class SocialEngineeringDetector:
    """
    Multilingual Social Engineering & Manipulation Detector.
    Supports English, Urdu script, and Roman Urdu.
    Cascades trained Multi-label TF-IDF Logistic Regression model with deterministic rule heuristics.
    """

    PATTERNS = {
        "urgency": [
            r'\b(?:urgent|immediately|act now|hurry|expires in|limited time|critical|suspended today|within 24 hours)\b',
            r'\b(?:foran|jaldi|abhi k abhi|time bohot kam|last chance|der mat karo)\b',
            r'(?:فوری|جلدی|ابھی|وقت کم|آخری موقع)'
        ],
        "fear_intimidation": [
            r'\b(?:suspended|terminated|arrest|law enforcement|legal action|court|fine|penalty|police|seized)\b',
            r'\b(?:account band|block ho jaye ga|police|adalat|fine lagega|jail)\b',
            r'(?:بند|گرفتار|پولیس|عدالت|جرمانہ)'
        ],
        "authority_impersonation": [
            r'\b(?:it support|administrator|security team|federal|officer|fbi|fia|cyber crime|ceo|director)\b',
            r'\b(?:cyber crime|inspector|manager|helpline|support team)\b',
            r'(?:افسر|سپورٹ ٹیم|سیکیورٹی ٹیم|منیجر)'
        ],
        "secrecy_isolation": [
            r'\b(?:do not tell|keep this confidential|private between us|do not disclose|secret|silence)\b',
            r'\b(?:kisi ko mat batana|chup chap|kisi se share mat karo|raaz|secret)\b',
            r'(?:کسی کو مت بتانا|خفیہ|راز)'
        ],
        "credential_solicitation": [
            r'\b(?:password|otp|pin|verification code|seed phrase|private key|card number|cvv)\b',
            r'\b(?:password send karo|otp bhej do|pin code|apna password|de do|bhejo)\b',
            r'(?:پاس ورڈ|او ٹی پی|پن کوڈ|تصدیقی کوڈ)'
        ]
    }

    @classmethod
    def classify(cls, text: str) -> Dict[str, Any]:
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
        if _ml_social_model is not None:
            try:
                ml_active = True
                pred_proba = _ml_social_model.predict_proba([text])
                for idx, cat_name in enumerate(TARGET_NAMES):
                    if idx < len(pred_proba):
                        prob = float(pred_proba[idx][0][1]) if len(pred_proba[idx][0]) > 1 else float(pred_proba[idx][0][0])
                        if prob > 0.35:
                            detected_categories.add(cat_name)
                            category_scores[cat_name] = max(category_scores.get(cat_name, 0.0), prob)
            except Exception:
                pass

        # Composite social engineering index
        weights = {
            "urgency": 0.35,
            "fear_intimidation": 0.35,
            "authority_impersonation": 0.40,
            "secrecy_isolation": 0.30,
            "credential_solicitation": 0.50
        }

        total_weight = sum(weights[cat] * category_scores.get(cat, 0.90) for cat in detected_categories)
        index = min(1.0, total_weight)

        return {
            "social_engineering_detected": len(detected_categories) > 0,
            "social_engineering_index": round(index, 2),
            "detected_categories": list(detected_categories),
            "category_scores": {k: round(v, 2) for k, v in category_scores.items()},
            "ml_model_active": ml_active
        }
