import re
import os
import joblib
from urllib.parse import urlparse
from typing import Dict, Any, List

# Ensure custom extractor is available for unpickling
from .extractors import LexicalUrlFeatureExtractor

# Homoglyphs and leetspeak map
HOMOGLYPH_MAP = {
    'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'ѕ': 's', 'ԁ': 'd', 'ԛ': 'q', 'і': 'i', 'ј': 'j', 'у': 'y', 'ѵ': 'v', 'х': 'x', 'ԝ': 'w',
    '0': 'o', '1': 'l', '3': 'e', '5': 's', '8': 'b', '@': 'a'
}

SUSPICIOUS_TLDS = {'xyz', 'top', 'tk', 'zip', 'cam', 'click', 'rest', 'gq', 'cf', 'ml', 'work', 'link', 'surf', 'loan'}

PROTECTED_BRANDS = [
    'paypal', 'binance', 'whatsapp', 'google', 'apple', 'microsoft',
    'chase', 'bank', 'hbl', 'easypaisa', 'nayapay', 'sadapay', 'meezan', 'instagram', 'facebook'
]

# Load trained ML pipeline
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models_store", "phishing_model.joblib")
_ml_model = None
if os.path.exists(MODEL_PATH):
    try:
        _ml_model = joblib.load(MODEL_PATH)
    except Exception as e:
        print(f"Warning: Failed to load trained phishing model: {e}")

class PhishingDetector:
    """
    Combines trained ML classifier (RandomForest + TF-IDF Lexical Feature Union)
    with deterministic Level 0 brand typosquatting & Unicode homoglyph analysis.
    """

    @classmethod
    def extract_urls(cls, text: str) -> List[str]:
        pattern = r'(?:https?://|www\.)[^\s<>"\'{}|\\^`\[\]]+'
        matches = re.findall(pattern, text, re.IGNORECASE)
        return [f"http://{m}" if m.startswith('www.') else m for m in matches]

    @classmethod
    def analyze_url(cls, url: str) -> Dict[str, Any]:
        signals = []
        score = 0.0

        try:
            parsed = urlparse(url)
            hostname = (parsed.hostname or "").lower()
        except Exception:
            return {
                "url": url,
                "phishing_detected": True,
                "confidence": 0.85,
                "signals": ["Malformed or deceptive URL structure"],
                "suspicious_score": 85
            }

        # 1. IP Host Check
        is_ip = bool(re.match(r'^(\d{1,3}\.){3}\d{1,3}$', hostname))
        if is_ip:
            score += 45
            signals.append(f"Direct IP destination endpoint ({hostname})")

        # 2. Suspicious TLD Check
        tld = hostname.split('.')[-1] if '.' in hostname else ''
        if tld in SUSPICIOUS_TLDS:
            score += 35
            signals.append(f"Disposable high-risk TLD (.{tld})")

        # 3. Unicode Homoglyph & Leetspeak Normalized Brand Check
        normalized_host = "".join(HOMOGLYPH_MAP.get(c, c) for c in hostname)
        if normalized_host != hostname:
            score += 30
            signals.append("Unicode homoglyph or character substitution observed in domain")

        clean_host = re.sub(r'[^a-z]', '', normalized_host)
        typo_brand = None
        for brand in PROTECTED_BRANDS:
            if brand in clean_host:
                if not (hostname.endswith(f".{brand}.com") or hostname.endswith(f".{brand}.pk") or hostname == f"{brand}.com"):
                    typo_brand = brand
                    score += 55
                    signals.append(f"Brand lookalike impersonation targeting '{brand}'")
                    break

        # 4. Keyword in path
        path_lower = (parsed.path + parsed.query).lower()
        if re.search(r'(?:verify-account|login-suspended|update-billing|claim-reward|secure-login|unlock-account|action=verify)', path_lower):
            score += 30
            signals.append("Credential harvesting or account suspension path pattern")

        # 5. Trained ML Model Inference
        ml_confidence = 0.0
        if _ml_model is not None:
            try:
                prob = _ml_model.predict_proba([url])[0][1]
                ml_confidence = float(prob)
                if ml_confidence > 0.50:
                    score = max(score, ml_confidence * 100)
                    signals.append(f"Trained Random Forest classifier confidence: {ml_confidence * 100:.1f}%")
            except Exception:
                pass

        final_score = min(100.0, max(0.0, score))
        detected = final_score >= 50.0 or (typo_brand is not None)

        return {
            "url": url,
            "domain": hostname,
            "phishing_detected": detected,
            "confidence": round(final_score / 100.0, 2),
            "typo_brand_target": typo_brand,
            "signals": signals,
            "suspicious_score": round(final_score),
            "ml_model_active": _ml_model is not None
        }

    @classmethod
    def analyze_text_and_urls(cls, text: str) -> Dict[str, Any]:
        urls = cls.extract_urls(text)
        if not urls:
            return {
                "phishing_detected": False,
                "phishing_confidence": 0.0,
                "analyzed_urls": []
            }

        analyzed = [cls.analyze_url(u) for u in urls]
        max_conf = max((a["confidence"] for a in analyzed), default=0.0)
        detected = any(a["phishing_detected"] for a in analyzed)

        return {
            "phishing_detected": detected,
            "phishing_confidence": max_conf,
            "analyzed_urls": analyzed
        }
