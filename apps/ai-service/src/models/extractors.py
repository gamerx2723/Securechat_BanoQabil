import math
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin

class LexicalUrlFeatureExtractor(BaseEstimator, TransformerMixin):
    """Extracts numerical lexical and structural features from raw URLs."""
    
    SUSPICIOUS_TLDS = {'xyz', 'top', 'tk', 'zip', 'cam', 'click', 'rest', 'gq', 'cf', 'ml', 'work', 'link', 'surf', 'loan'}
    KEYWORDS = ['login', 'verify', 'account', 'update', 'banking', 'secure', 'claim', 'wallet', 'crypto', 'auth', 'signin']
    
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
            url_str = str(url).lower()
            url_len = len(url_str)
            dot_count = url_str.count('.')
            hyphen_count = url_str.count('-')
            slash_count = url_str.count('/')
            digit_count = sum(c.isdigit() for c in url_str)
            digit_ratio = digit_count / max(1, url_len)
            entropy = self._entropy(url_str)
            
            # TLD check
            tld = url_str.split('.')[-1].split('/')[0] if '.' in url_str else ''
            has_suspicious_tld = 1.0 if tld in self.SUSPICIOUS_TLDS else 0.0
            
            # Keyword count
            keyword_hits = sum(1.0 for kw in self.KEYWORDS if kw in url_str)
            
            # IP address check
            is_ip = 1.0 if any(char.isdigit() for char in url_str.split('/')[0]) and '.' in url_str.split('/')[0] else 0.0
            
            features.append([
                url_len, dot_count, hyphen_count, slash_count,
                digit_count, digit_ratio, entropy, has_suspicious_tld,
                keyword_hits, is_ip
            ])
        return np.array(features)
