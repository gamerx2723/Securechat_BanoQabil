import re
import os
import joblib
from urllib.parse import urlparse
from typing import Dict, Any, List

# Ensure custom extractor is available for unpickling
from .extractors import LexicalUrlFeatureExtractor, PROTECTED_BRANDS, SUSPICIOUS_TLDS

HOMOGLYPH_MAP = {
    'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'ѕ': 's', 'ԁ': 'd', 'ԛ': 'q', 'і': 'i', 'ј': 'j', 'у': 'y', 'ѵ': 'v', 'х': 'x', 'ԝ': 'w',
    '0': 'o', '1': 'l', '3': 'e', '5': 's', '8': 'b', '@': 'a'
}

DYNAMIC_DNS_DOMAINS = {
    'servebbs.org', 'duckdns.org', 'ngrok.io', 'loca.lt', 'hopto.org',
    'zapto.org', 'ddns.net', 'bounceme.net', '000webhostapp.com', 'firebaseapp.com',
    'pages.dev', 'workers.dev', 'netlify.app', 'glitch.me', 'vercel.app'
}

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models_store", "phishing_model.joblib")
_ml_model = None

def get_ml_model():
    global _ml_model
    if _ml_model is None and os.path.exists(MODEL_PATH):
        try:
            _ml_model = joblib.load(MODEL_PATH)
        except Exception as e:
            print(f"Warning: Failed to load trained phishing model: {e}")
    return _ml_model

class PhishingDetector:
    """
    Multilayer Phishing Classifier combining:
    1. Level 0 Deterministic Lexical & Typo Brand Inspection (Subdomains, Paths, Hashes)
    2. Level 1 Brand Spoofing & High-Risk TLD / Dynamic DNS heuristics
    3. Level 2 Trained Machine Learning Model (Random Forest + Char N-Grams + Lexical Feature Union)
    """

    @classmethod
    def extract_urls(cls, text: str) -> List[str]:
        # Comprehensive URL and bare domain pattern extractor
        pattern = r'(?:(?:https?://|www\.)[^\s<>"\'{}|\\^`\[\]]+|(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|xyz|top|info|site|online|club|tk|ml|ga|cf|gq|io|dev|app|cc|to|co|pk)(?:/[^\s<>"\'{}|\\^`\[\]]*)?)'
        matches = re.findall(pattern, text, re.IGNORECASE)
        normalized = []
        for m in matches:
            if not m.startswith('http://') and not m.startswith('https://'):
                normalized.append(f"http://{m}")
            else:
                normalized.append(m)
        return list(dict.fromkeys(normalized))

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
                "confidence": 0.95,
                "signals": ["Malformed or deceptive URL structure"],
                "suspicious_score": 95
            }

        full_url_lower = url.lower()
        path_lower = (parsed.path + ("?" + parsed.query if parsed.query else "")).lower()

        # 1. IP Host Check
        is_ip = bool(re.match(r'^(\d{1,3}\.){3}\d{1,3}$', hostname))
        if is_ip:
            score += 45
            signals.append(f"Direct IP destination endpoint ({hostname})")

        # 2. Suspicious TLD Check
        tld = hostname.split('.')[-1] if '.' in hostname else ''
        if tld in SUSPICIOUS_TLDS:
            score += 40
            signals.append(f"High-risk disposable TLD (.{tld})")

        # 3. Dynamic DNS / Free Staging Host Check
        for dyn in DYNAMIC_DNS_DOMAINS:
            if hostname == dyn or hostname.endswith(f".{dyn}"):
                score += 35
                signals.append(f"Dynamic DNS or free hosting service endpoint ({dyn})")
                break

        # 4. Unicode Homoglyph & Leetspeak Normalized Brand Check
        normalized_host = "".join(HOMOGLYPH_MAP.get(c, c) for c in hostname)
        if normalized_host != hostname:
            score += 35
            signals.append("Unicode homoglyph or character substitution observed in domain")

        clean_host = re.sub(r'[^a-z]', '', normalized_host)
        typo_brand = None
        for brand in PROTECTED_BRANDS:
            if brand in clean_host:
                if not (hostname.endswith(f".{brand}.com") or hostname.endswith(f".{brand}.pk") or hostname == f"{brand}.com"):
                    typo_brand = brand
                    score += 60
                    signals.append(f"Brand lookalike typosquatting targeting '{brand}'")
                    break

        # 5. Brand in Subdomain or Deep Path Check (e.g. nobell.it/.../login.SkyPe.com/... or .../paypal.co.uk/...)
        for brand in PROTECTED_BRANDS:
            if brand in full_url_lower and typo_brand is None:
                # If the root domain is NOT official brand, this is deep spoofing
                if not (hostname == f"{brand}.com" or hostname.endswith(f".{brand}.com") or hostname == f"{brand}.pk" or hostname.endswith(f".{brand}.pk")):
                    score += 55
                    typo_brand = brand
                    signals.append(f"Target brand '{brand}' embedded in non-official URL path or subdomain")
                    break

        # 6. Hex / MD5 Hash in Path (phishing kit tracking identifier)
        if re.search(r'[0-9a-fA-F]{16,}', path_lower):
            score += 30
            signals.append("Phishing kit session hash token detected in URL path")

        # 7. Suspicious Script Endpoints & Keywords in Path
        if re.search(r'(?:webscr|cgi-bin|dispatch=|loading\.php|confirmar|verify-account|login-suspended|update-billing|claim-reward|secure-login|unlock-account|action=verify|fidelidade)', path_lower):
            score += 35
            signals.append("Credential harvesting or automated phishing script path pattern")

        # 8. Excessive Subdomains / Dot Count
        if hostname.count('.') >= 3:
            score += 25
            signals.append(f"Excessive subdomain nesting ({hostname.count('.')} subdomains)")

        # 9. Trained Machine Learning Model Inference
        ml_model = get_ml_model()
        ml_confidence = 0.0
        if ml_model is not None:
            try:
                prob = ml_model.predict_proba([url])[0][1]
                ml_confidence = float(prob)
                if ml_confidence >= 0.50:
                    score = max(score, ml_confidence * 100)
                    signals.append(f"ML Classifier (Trained Random Forest): {ml_confidence * 100:.1f}% phishing probability")
                elif ml_confidence <= 0.15 and not signals:
                    # Clear legitimate URL
                    score = min(score, 10)
            except Exception as e:
                pass

        final_score = min(100.0, max(0.0, score))
        detected = final_score >= 45.0 or (typo_brand is not None)

        return {
            "url": url,
            "domain": hostname,
            "phishing_detected": detected,
            "confidence": round(final_score / 100.0, 2),
            "typo_brand_target": typo_brand,
            "signals": signals if signals else ["Standard web URL"],
            "suspicious_score": round(final_score),
            "ml_model_active": ml_model is not None
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
