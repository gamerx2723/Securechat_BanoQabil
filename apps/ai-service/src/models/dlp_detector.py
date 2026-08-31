import re
from typing import Dict, Any, List

class DlpDetector:
    """
    Data Leak Prevention detector for high-value secrets, credentials, and API keys.
    """
    
    PATTERNS = [
        ("AWS_KEY", r'\b(AKIA[0-9A-Z]{16})\b', "AWS Access Key"),
        ("GITHUB_TOKEN", r'\b(ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})\b', "GitHub Access Token"),
        ("JWT", r'\b(eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*)\b', "JSON Web Token"),
        ("PRIVATE_KEY", r'-----BEGIN (?:RSA|EC|OPENSSH|DSA|PGP|ENCRYPTED)? ?PRIVATE KEY-----', "Private Cryptographic Key"),
        ("DATABASE_URL", r'\b(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis)://[a-zA-Z0-9_\-\.]+:[^@\s]+@[a-zA-Z0-9_\-\.]+', "Database URL with credentials"),
        ("PASSWORD", r'(?:password|pass|pwd|secret)\s*[:=]\s*["\']?([^\s"\';,]{6,})["\']?', "Plaintext Password"),
        ("OTP", r'(?:otp|verification code|security code|passcode|code is|tasdeeqi code)\s*[:=]?\s*(\b\d{4,8}\b)', "One-Time Password / 2FA Code")
    ]

    @classmethod
    def scan(cls, text: str) -> Dict[str, Any]:
        detected = []
        for ptype, regex_str, desc in cls.PATTERNS:
            matches = re.findall(regex_str, text, re.IGNORECASE)
            if matches:
                for m in matches:
                    raw_val = m if isinstance(m, str) else m[0]
                    masked = cls._mask(raw_val)
                    detected.append({
                        "type": ptype,
                        "description": desc,
                        "masked_value": masked
                    })

        return {
            "has_sensitive_data": len(detected) > 0,
            "detected_secrets": detected
        }

    @staticmethod
    def _mask(secret: str) -> str:
        if len(secret) <= 6:
            return "*" * len(secret)
        return f"{secret[:3]}...{secret[-3:]}"
