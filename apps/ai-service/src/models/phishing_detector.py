import re
import os
import joblib
from urllib.parse import urlparse
from typing import Dict, Any, List

# Ensure custom extractor is available for unpickling
from .extractors import LexicalUrlFeatureExtractor, PROTECTED_BRANDS, SUSPICIOUS_TLDS
import __main__
if not hasattr(__main__, 'LexicalUrlFeatureExtractor'):
    setattr(__main__, 'LexicalUrlFeatureExtractor', LexicalUrlFeatureExtractor)

HOMOGLYPH_MAP = {
    'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'ѕ': 's', 'ԁ': 'd', 'ԛ': 'q', 'і': 'i', 'ј': 'j', 'у': 'y', 'ѵ': 'v', 'х': 'x', 'ԝ': 'w',
    '0': 'o', '1': 'l', '3': 'e', '5': 's', '8': 'b', '@': 'a'
}

DYNAMIC_DNS_DOMAINS = {
    'servebbs.org', 'duckdns.org', 'ngrok.io', 'loca.lt', 'hopto.org',
    'zapto.org', 'ddns.net', 'bounceme.net', '000webhostapp.com', 'firebaseapp.com',
    'pages.dev', 'workers.dev', 'netlify.app', 'glitch.me', 'vercel.app'
}

URL_MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models_store", "url_model.joblib")
TEXT_MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models_store", "phishing_model.joblib")

_url_model = None
_text_model = None

def get_url_model():
    global _url_model
    if _url_model is None and os.path.exists(URL_MODEL_PATH):
        try:
            _url_model = joblib.load(URL_MODEL_PATH)
        except Exception as e:
            print(f"Warning: Failed to load URL model: {e}")
    return _url_model

def get_text_model():
    global _text_model
    if _text_model is None and os.path.exists(TEXT_MODEL_PATH):
        try:
            _text_model = joblib.load(TEXT_MODEL_PATH)
        except Exception as e:
            print(f"Warning: Failed to load text phishing model: {e}")
    return _text_model

class PhishingDetector:
    """
    Multilayer Phishing Classifier combining:
    1. Level 0 Deterministic Lexical & Typo Brand Inspection (Subdomains, Paths, Hashes)
    2. Level 1 Brand Spoofing & High-Risk TLD / Dynamic DNS heuristics
    3. Level 2 Trained URL Classifier (Lexical Feature Union + StandardScaler + SGDClassifier)
    4. Level 3 Trained Text Phishing Model (TF-IDF + SGDClassifier) learning semantic scam patterns
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
                "domain": "",
                "phishing_detected": True,
                "confidence": 0.95,
                "signals": ["Malformed or deceptive URL structure"],
                "suspicious_score": 95,
                "ml_model_active": False
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

        # 5. Brand in Subdomain or Deep Path Check
        for brand in PROTECTED_BRANDS:
            if brand in full_url_lower and typo_brand is None:
                if not (hostname == f"{brand}.com" or hostname.endswith(f".{brand}.com") or hostname == f"{brand}.pk" or hostname.endswith(f".{brand}.pk")):
                    score += 55
                    typo_brand = brand
                    signals.append(f"Target brand '{brand}' embedded in non-official URL path or subdomain")
                    break

        # 6. Hex / MD5 Hash in Path
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

        # 9. Trained Machine Learning URL Model Inference
        ml_model = get_url_model()
        ml_confidence = 0.0
        if ml_model is not None:
            try:
                prob = ml_model.predict_proba([url])[0][1]
                ml_confidence = float(prob)
                if ml_confidence >= 0.50:
                    score = max(score, ml_confidence * 100)
                    signals.append(f"ML Classifier (Trained URL SGD Model): {ml_confidence * 100:.1f}% phishing probability")
                elif ml_confidence <= 0.15 and not signals:
                    score = min(score, 10)
            except Exception:
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
    def analyze_text(cls, text: str) -> Dict[str, Any]:
        """Evaluates message text specifically using trained Phishing Model (phishing_model.joblib)."""
        t_model = get_text_model()
        if t_model is None or not text or len(text.strip()) < 5:
            return {
                "phishing_text_detected": False,
                "confidence": 0.0,
                "signals": []
            }

        try:
            vec = t_model["vectorizer"]
            clf = t_model["model"]
            prob = float(clf.predict_proba(vec.transform([text]))[0][1])
            detected = prob >= 0.50
            signals = []
            if detected:
                signals.append(f"Phishing semantic pattern match ({prob * 100:.1f}% confidence)")
            return {
                "phishing_text_detected": detected,
                "confidence": round(prob, 2),
                "signals": signals
            }
        except Exception:
            return {
                "phishing_text_detected": False,
                "confidence": 0.0,
                "signals": []
            }

    @classmethod
    def analyze_text_and_urls(cls, text: str) -> Dict[str, Any]:
        urls = cls.extract_urls(text)
        analyzed_urls = [cls.analyze_url(u) for u in urls]
        url_detected = any(a["phishing_detected"] for a in analyzed_urls)
        max_url_conf = max((a["confidence"] for a in analyzed_urls), default=0.0)

        # Run text phishing detection
        text_analysis = cls.analyze_text(text)
        text_detected = text_analysis["phishing_text_detected"]
        text_conf = text_analysis["confidence"]

        # Combined detection
        phishing_detected = url_detected or text_detected
        
        # Section 16: Compound risk if BOTH suspicious link and phishing text pattern are present
        if url_detected and text_detected:
            combined_conf = min(1.0, max(max_url_conf, text_conf) + 0.15)
        else:
            combined_conf = max(max_url_conf, text_conf)

        signals = []
        for a in analyzed_urls:
            if a["phishing_detected"]:
                signals.extend(a.get("signals", []))
        signals.extend(text_analysis.get("signals", []))

        return {
            "phishing_detected": phishing_detected,
            "phishing_confidence": round(combined_conf, 2),
            "analyzed_urls": analyzed_urls,
            "text_analysis": text_analysis,
            "signals": signals
        }
