from typing import Dict, Any, List
from .phishing_detector import PhishingDetector
from .social_engineering_detector import SocialEngineeringDetector
from .dlp_detector import DlpDetector

class ConversationContextEngine:
    """
    Tracks multi-turn conversational security state across isolated sessions.
    Evaluates sequences: Normal -> Urgent claim -> Verification link -> Credential solicitation -> Critical Phishing.
    """
    
    @classmethod
    def evaluate_history(cls, messages: List[str]) -> Dict[str, Any]:
        if not messages:
            return {
                "risk_score": 0,
                "security_state": "GREEN",
                "summary": "Empty conversation.",
                "timeline": []
            }
            
        timeline = []
        accumulated_risk = 0.0
        observed_signals = set()

        for idx, msg in enumerate(messages):
            p_res = PhishingDetector.analyze_text_and_urls(msg)
            s_res = SocialEngineeringDetector.classify(msg)
            d_res = DlpDetector.scan(msg)

            step_risk = 0.0
            signals = []

            if p_res["phishing_detected"]:
                step_risk += max(50.0, p_res["phishing_confidence"] * 75.0)
                signals.append("Suspicious URL / Phishing pattern")
                observed_signals.add("PHISHING_LINK")

            if s_res["social_engineering_index"] > 0.25:
                step_risk += s_res["social_engineering_index"] * 55.0
                signals.extend(s_res["detected_categories"])
                for cat in s_res["detected_categories"]:
                    observed_signals.add(cat.upper())

            if d_res["has_sensitive_data"]:
                step_risk += 45.0
                signals.append("Sensitive data leak attempt")
                observed_signals.add("DLP_LEAK")

            # Risk accumulation: current step adds to history with compounding
            if step_risk > 0:
                accumulated_risk = min(100.0, accumulated_risk * 0.85 + step_risk)
            else:
                accumulated_risk = max(0.0, accumulated_risk * 0.8)

            color = "GREEN"
            if accumulated_risk >= 80:
                color = "RED"
            elif accumulated_risk >= 25:
                color = "ORANGE"

            timeline.append({
                "step": idx + 1,
                "message_snippet": msg[:40] + "..." if len(msg) > 40 else msg,
                "risk_score": round(accumulated_risk),
                "indicator_color": color,
                "signals": signals
            })

        final_score = round(accumulated_risk)
        final_color = "GREEN"
        if final_score >= 80:
            final_color = "RED"
        elif final_score >= 25:
            final_color = "ORANGE"

        # Generate summary description
        if final_color == "GREEN":
            summary = "Normal conversational interaction. No deceptive patterns or credential requests observed."
        elif final_color == "ORANGE":
            summary = f"Suspicious interaction pattern detected ({', '.join(observed_signals)}). Sender may be attempting social engineering."
        else:
            summary = f"CRITICAL THREAT: High-confidence phishing or credential harvesting attack chain confirmed ({', '.join(observed_signals)})."

        return {
            "risk_score": final_score,
            "security_state": final_color,
            "summary": summary,
            "observed_signals": list(observed_signals),
            "timeline": timeline
        }
