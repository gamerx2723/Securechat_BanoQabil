import re
from typing import Dict, Any, List

class DlpDetector:
    """
    Data Leak Prevention detector for high-value secrets, credentials, PII, and financial identifiers.
    """
    
    PATTERNS = [
        ("AWS_KEY", r'\b(AKIA[0-9A-Z]{16})\b', "AWS Access Key"),
        ("GITHUB_TOKEN", r'\b(ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})\b', "GitHub Access Token"),
        ("JWT", r'\b(eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*)\b', "JSON Web Token"),
        ("PRIVATE_KEY", r'-----BEGIN (?:RSA|EC|OPENSSH|DSA|PGP|ENCRYPTED)? ?PRIVATE KEY-----', "Private Cryptographic Key"),
        ("DATABASE_URL", r'\b(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis)://[a-zA-Z0-9_\-\.]+:[^@\s]+@[a-zA-Z0-9_\-\.]+', "Database URL with credentials"),
        ("PASSWORD", r'(?:password|pass|pwd|secret|passcode|creds)\s*[:=]\s*["\']?([^\s"\';,]{4,})["\']?|(?:my\s+(?:password|pin|passcode)\s+is\s+([^\s"\';,]{4,}))', "Plaintext Password / Passcode"),
        ("OTP", r'(?:otp|verification\s*code|security\s*code|passcode|login\s*code|code\s*is|tasdeeqi\s*code)\s*[:=]?\s*(\b\d{4,8}\b)', "One-Time Password / 2FA Code"),
        ("CNIC_PII", r'\b(\d{5}-\d{7}-\d|\d{13})\b', "National Identity Card (CNIC / PII)"),
        ("BANK_ACCOUNT", r'\b(PK\d{2}[A-Z]{4}\d{16}|(?:account|acc|ac|khata)\s*#?\s*[:=]?\s*\d{10,16})\b', "Bank Account / IBAN Number"),
        ("CREDIT_CARD", r'\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b', "Credit / Debit Card Number"),
        ("CVV_CARD", r'(?:cvv|cvc|security\s*code|card\s*pin)\s*[:=]?\s*(\b\d{3,4}\b)', "Card Security Code (CVV/CVC)")
    ]

    @classmethod
    def scan(cls, text: str) -> Dict[str, Any]:
        detected = []
        for ptype, regex_str, desc in cls.PATTERNS:
            matches = re.findall(regex_str, text, re.IGNORECASE)
            if matches:
                for m in matches:
                    raw_val = m if isinstance(m, str) else next((x for x in m if x), "")
                    if raw_val:
                        masked = cls._mask(raw_val)
                        detected.append({
                            "type": ptype,
                            "description": desc,
                            "raw_val": raw_val,
                            "masked_value": masked
                        })

        return {
            "has_sensitive_data": len(detected) > 0,
            "detected_secrets": detected
        }

    @classmethod
    def redact_text(cls, text: str) -> str:
        redacted = text
        for _, regex_str, _ in cls.PATTERNS:
            redacted = re.sub(regex_str, "[CONFIDENTIAL DATA REDACTED]", redacted, flags=re.IGNORECASE)
        return redacted

    @staticmethod
    def _mask(secret: str) -> str:
        if len(secret) <= 6:
            return "*" * len(secret)
        return f"{secret[:3]}...{secret[-3:]}"
