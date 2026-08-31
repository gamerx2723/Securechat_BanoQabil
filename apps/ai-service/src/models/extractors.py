import math
import re
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin

PROTECTED_BRANDS = [
    'paypal', 'binance', 'whatsapp', 'google', 'apple', 'microsoft',
    'chase', 'bank', 'hbl', 'easypaisa', 'nayapay', 'sadapay', 'meezan',
    'instagram', 'facebook', 'skype', 'netflix', 'amazon', 'wellsfargo',
    'citibank', 'americanexpress', 'barclays', 'outlook', 'yahoo', 'steam'
]

SUSPICIOUS_TLDS = {
    'xyz', 'top', 'tk', 'zip', 'cam', 'click', 'rest', 'gq', 'cf', 'ml',
    'work', 'link', 'surf', 'loan', 'club', 'info', 'online', 'site',
    'fun', 'live', 'support', 'vip', 'icu', 'buzz', 'ga', 'space', 'gdn',
    'fit', 'kim', 'bid', 'country', 'stream', 'download', 'racing', 'trade', 'accountant'
}

KEYWORDS = [
    'login', 'verify', 'account', 'update', 'banking', 'secure', 'claim',
    'wallet', 'crypto', 'auth', 'signin', 'webscr', 'cgi-bin', 'dispatch',
    'cmd=', 'loading.php', 'confirm', 'security', 'session', 'password',
    'reset', 'payment', 'unlock', 'alert', 'reward', 'free', 'bonus', 'fidelidade'
]

class LexicalUrlFeatureExtractor(BaseEstimator, TransformerMixin):
    """Extracts high-dimensional numerical lexical and structural features from raw URLs."""
    
    def fit(self, X, y=None):
        return self
    
    def _entropy(self, s: str) -> float:
        if not s:
            return 0.0
        prob = [float(s.count(c)) / len(s) for c in set(s)]
        return -sum(p * math.log2(p) for p in prob)

    def transform(self, X):
        features = []
        for url in X:
            url_str = str(url).lower().strip()
            # Normalize scheme if missing for parsing
            clean_url = url_str if '://' in url_str else f"http://{url_str}"
            url_len = len(url_str)
            dot_count = url_str.count('.')
            hyphen_count = url_str.count('-')
            slash_count = url_str.count('/')
            digit_count = sum(c.isdigit() for c in url_str)
            digit_ratio = digit_count / max(1, url_len)
            entropy = self._entropy(url_str)
            
            # Domain and TLD extraction
            host = clean_url.split('/')[2] if len(clean_url.split('/')) > 2 else url_str
            tld = host.split('.')[-1].split(':')[0] if '.' in host else ''
            has_suspicious_tld = 1.0 if tld in SUSPICIOUS_TLDS else 0.0
            
            # Subdomains count
            subdomain_count = float(max(0, host.count('.') - 1))
            
            # Keyword count
            keyword_hits = sum(1.0 for kw in KEYWORDS if kw in url_str)
            
            # IP address check
            is_ip = 1.0 if re.match(r'^(\d{1,3}\.){3}\d{1,3}', host) else 0.0
            
            # Brand impersonation in subdomains or deep paths
            brand_impersonation = 0.0
            for b in PROTECTED_BRANDS:
                if b in url_str:
                    # Legitimate only if root domain is official (e.g. paypal.com or skype.com)
                    if not (host == f"{b}.com" or host.endswith(f".{b}.com") or host == f"{b}.pk" or host.endswith(f".{b}.pk")):
                        brand_impersonation = 1.0
                        break
            
            # Hex token hash pattern (e.g. 70ffb52d079109dca5664cce6f317373782)
            has_hex_hash = 1.0 if re.search(r'[0-9a-fA-F]{16,}', url_str) else 0.0
            
            # Phishing script endpoint pattern (.php, .cgi, .asp, etc.)
            has_script_endpoint = 1.0 if re.search(r'\.(?:php|cgi|asp|aspx|jsp|htm|html)', url_str) else 0.0

            features.append([
                url_len, dot_count, hyphen_count, slash_count,
                digit_count, digit_ratio, entropy, has_suspicious_tld,
                subdomain_count, keyword_hits, is_ip, brand_impersonation,
                has_hex_hash, has_script_endpoint
            ])
        return np.array(features)
