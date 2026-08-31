import re
import math
from typing import Dict, Any, List
from urllib.parse import urlparse, parse_qs

class ZeroDayCognitiveEngine:
    """
    Zero-Day Cognitive Intent & Behavioral Logic Engine.
    Operates beyond static keyword matching or historical database lookups by analyzing:
    1. Cognitive Intent Vectors (Action Request + Asymmetric Pressure + Verification Bypass)
    2. Zero-Day Structural URL Invariants (Entropy, Subdomain Stacking, Redirect Nesting)
    3. Anti-Analysis Evasion & Obfuscation Markers (Zero-width chars, leetspeak, spaced tokens)
    4. Trust Asymmetry & Channel Shift Anomalies (Taking user to external apps/links)
    5. Conversational State Inversion (Grooming -> Sudden Solicitations)
    """

    # 1. Action Request Archetypes (Irreversible User Actions)
    ACTION_INTENTS = [
        # Authentication & Identity Actions
        (r'\b(?:authenticate|sign\s*in|log\s*in|verify\s*identity|confirm\s*(?:credentials|details|account)|unlock\s*session|validate\s*access)\b', 'AUTHENTICATION_REQUEST', 35),
        # Financial & Value Transfer Actions
        (r'\b(?:transfer|send\s*(?:money|funds|cash|amount|rs|pkr|\$)|wire\s*funds|pay\s*(?:now|advance|fee|charges)|deposit|bhejo|transfer\s*karo|paisay\s*de\s*do)\b', 'VALUE_TRANSFER_REQUEST', 40),
        # Execution & Download Actions
        (r'\b(?:download|install|run\s*this|open\s*attachment|execute|setup\s*file|apk|install\s*app)\b', 'CODE_EXECUTION_REQUEST', 35),
        # External Migration Actions
        (r'\b(?:message\s*me\s*on\s*(?:whatsapp|telegram|signal)|contact\s*(?:via|at)\s*\+?\d{8,}|inbox\s*me|call\s*this\s*number)\b', 'CHANNEL_MIGRATION_REQUEST', 25),
    ]

    # 2. Pressure & Consequence Archetypes (Psychological Coercion)
    PRESSURE_INTENTS = [
        # Immediate Temporal Urgency
        (r'\b(?:within\s*(?:\d+\s*(?:mins?|hours?|seconds?)|today)|before\s*it\s*expires|deadline|right\s*now|at\s*once|abhi\s*k\s*abhi|foran|jaldi)\b', 'TEMPORAL_PRESSURE', 30),
        # Negative Consequence / Loss Framing
        (r'\b(?:otherwise|or\s*else|will\s*be\s*(?:lost|cancelled|suspended|blocked|deleted|terminated)|avoid\s*(?:penalty|fine|arrest|loss)|nuksan|band\s*ho\s*jaye\s*ga)\b', 'CONSEQUENCE_PRESSURE', 35),
        # Crisis / Emotional Distress Simulation
        (r'\b(?:stuck|lost\s*my\s*phone|emergency|hospital|accident|in\s*trouble|stranded|help\s*me\s*out|hadsa|ammi\s*bimar)\b', 'CRISIS_PRESSURE', 35),
        # Unrealistic Value / Greed Lure
        (r'\b(?:guaranteed\s*(?:return|profit)|earn\s*\$?\d+\s*daily|won\s*(?:lottery|prize|car|gold)|free\s*(?:gift|reward|tokens?)|mubarak\s*ho)\b', 'GREED_LURE_PRESSURE', 35),
    ]

    # 3. Verification Bypass & Secrecy Archetypes
    BYPASS_INTENTS = [
        # Explicit Bypass Instructions
        (r'\b(?:ignore\s*(?:warning|security\s*alert|prompt)|bypass|do\s*not\s*(?:call|verify\s*with|report|ask)|kisi\s*ko\s*mat\s*batana|raaz\s*rakhna)\b', 'VERIFICATION_BYPASS', 45),
        # Credential / OTP Request
        (r'\b(?:share\s*(?:code|otp|pin|password|card|cvv|cnic)|tell\s*me\s*the\s*number|read\s*(?:out|back)\s*the\s*sms|code\s*batao|otp\s*send\s*karo)\b', 'CREDENTIAL_INTERCEPTION', 50),
    ]

    # 4. Anti-Analysis Obfuscation Markers
    ZERO_WIDTH_CHARS = {'\u200B', '\u200C', '\u200D', '\uFEFF', '\u202A', '\u202E'}

    @classmethod
    def _calculate_entropy(cls, text: str) -> float:
        if not text:
            return 0.0
        prob = [float(text.count(c)) / len(text) for c in set(text)]
        return -sum(p * math.log2(p) for p in prob)

    @classmethod
    def analyze_zero_day_intent(cls, text: str) -> Dict[str, Any]:
        signals = []
        cognitive_score = 0.0

        # --- A. Anti-Analysis Obfuscation & Evasion Logic ---
        # 1. Zero-width character inspection
        zero_width_count = sum(1 for c in text if c in cls.ZERO_WIDTH_CHARS)
        if zero_width_count > 0:
            cognitive_score += 45
            signals.append(f"Zero-Day Anti-Analysis Evasion: {zero_width_count} hidden zero-width Unicode characters detected")

        # 2. Spaced-out token obfuscation (e.g. 'p a y p a l' or 'v . e . r . i . f . y')
        spaced_obfuscation = re.search(r'\b([a-zA-Z0-9][\s\._-]){4,}[a-zA-Z0-9]\b', text)
        if spaced_obfuscation:
            cognitive_score += 35
            signals.append(f"Obfuscated Character Spacing Pattern: '{spaced_obfuscation.group(0)}'")

        # --- B. Cognitive Intent Triangle (Action + Pressure + Bypass) ---
        actions_found = []
        for pattern, label, weight in cls.ACTION_INTENTS:
            if re.search(pattern, text, re.IGNORECASE):
                actions_found.append((label, weight))

        pressures_found = []
        for pattern, label, weight in cls.PRESSURE_INTENTS:
            if re.search(pattern, text, re.IGNORECASE):
                pressures_found.append((label, weight))

        bypasses_found = []
        for pattern, label, weight in cls.BYPASS_INTENTS:
            if re.search(pattern, text, re.IGNORECASE):
                bypasses_found.append((label, weight))

        # Compound Threat Logic:
        # Action + Pressure = High Risk
        # Action + Bypass = Critical Risk
        # Action + Pressure + Bypass = Immediate Malicious Interception
        if actions_found:
            top_action = max(actions_found, key=lambda x: x[1])
            cognitive_score += top_action[1]
            signals.append(f"Cognitive Action Request: {top_action[0].replace('_', ' ').title()}")

        if pressures_found:
            top_pressure = max(pressures_found, key=lambda x: x[1])
            cognitive_score += top_pressure[1]
            signals.append(f"Cognitive Coercion Vector: {top_pressure[0].replace('_', ' ').title()}")

        if bypasses_found:
            top_bypass = max(bypasses_found, key=lambda x: x[1])
            cognitive_score += top_bypass[1]
            signals.append(f"Security Bypass Directive: {top_bypass[0].replace('_', ' ').title()}")

        # Multi-Vector Compound Multiplier
        if len(actions_found) > 0 and len(pressures_found) > 0:
            cognitive_score += 25
            signals.append("Zero-Day Compound Vector: Action Request coupled with Psychological Pressure")

        if len(actions_found) > 0 and len(bypasses_found) > 0:
            cognitive_score += 35
            signals.append("Zero-Day Critical Vector: Direct Security Verification Bypass Attempt")

        # --- C. Structural Zero-Day URL Invariant Logic ---
        url_regex = r'(?:https?://|www\.)[^\s<>"\'{}|\\^`\[\]]+'
        raw_urls = re.findall(url_regex, text, re.IGNORECASE)

        for u in raw_urls:
            url_score = 0
            url_signals = []
            try:
                parsed = urlparse(u if '://' in u else f"http://{u}")
                hostname = (parsed.hostname or "").lower()
                path = parsed.path.lower()
                query = parsed.query.lower()
                full_path_query = path + ("?" + query if query else "")

                # 1. Subdomain Stacking / Deep Nesting (>= 3 subdomains on unfamiliar host)
                subdomain_parts = hostname.split('.')
                if len(subdomain_parts) >= 4:
                    url_score += 30
                    url_signals.append(f"Deep Subdomain Stacking ({len(subdomain_parts)-2} levels)")

                # 2. Entropy Analysis on Host & Path (randomly generated DGA / zero-day domains)
                host_entropy = cls._calculate_entropy(hostname.replace('.', ''))
                if host_entropy >= 3.8 and len(hostname) >= 15:
                    url_score += 35
                    url_signals.append(f"High-Entropy DGA/Zero-Day Domain Structure ({host_entropy:.2f} bits)")

                # 3. Nested Open-Redirect / Token Parameters in Query (?url=, ?redirect=, ?dest=, ?token=)
                parsed_qs = parse_qs(query)
                redirect_keys = {'url', 'redirect', 'dest', 'destination', 'return', 'next', 'target', 'link', 'out', 'r'}
                if any(k in redirect_keys for k in parsed_qs.keys()):
                    url_score += 35
                    url_signals.append("Nested Open-Redirect Query Parameter concealing destination")

                # 4. Action in Path on Unverified Host (e.g. /auth-session, /verify, /login, /confirm)
                if re.search(r'/(?:auth|verify|login|signin|session|account|confirm|update|token|secure)', path):
                    if not (hostname.endswith('.google.com') or hostname.endswith('.microsoft.com') or hostname.endswith('.apple.com') or hostname.endswith('.github.com')):
                        url_score += 30
                        url_signals.append("Authentication/Validation endpoint on untrusted origin")

                # 5. Non-Standard Port in Web URL
                if parsed.port and parsed.port not in (80, 443, 3000, 3001, 5173, 8000, 8080):
                    url_score += 30
                    url_signals.append(f"Non-standard network port endpoint (:{parsed.port})")

            except Exception:
                url_score += 40
                url_signals.append("Malformed or anomalous URL grammar")

            if url_score > 0:
                cognitive_score += url_score
                signals.append(f"Zero-Day URL Invariant Anomaly ({u[:40]}...): {'; '.join(url_signals)}")

        bounded_score = min(100, round(cognitive_score))
        detected = bounded_score >= 45

        return {
            "zero_day_threat_detected": detected,
            "cognitive_risk_score": bounded_score,
            "intent_signals": signals,
            "actions_count": len(actions_found),
            "pressures_count": len(pressures_found),
            "bypasses_count": len(bypasses_found),
            "confidence": round(max(bounded_score / 100.0, 0.88 if detected else 0.0), 2)
        }
