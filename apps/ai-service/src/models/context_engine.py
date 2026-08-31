import re
from typing import Dict, Any, List
from .phishing_detector import PhishingDetector
from .social_engineering_detector import SocialEngineeringDetector
from .urdu_scam_detector import UrduScamDetector
from .zero_day_cognitive_engine import ZeroDayCognitiveEngine
from .dlp_detector import DlpDetector

class ConversationContextEngine:
    """
    Evaluates whole-conversation context, extracts the conversational topic,
    summarizes intent narrative, and computes multi-turn security risk timelines.
    """

    @classmethod
    def extract_topic(cls, messages: List[str], timeline: List[Dict[str, Any]]) -> Dict[str, Any]:
        combined_text = " ".join(messages).lower()
        
        has_phishing = any("phishing" in str(step.get("signals", [])).lower() for step in timeline)
        has_bisp = any("bisp" in str(step.get("signals", [])).lower() or "ehsaas" in combined_text for step in timeline)
        has_banking = any("easypaisa" in combined_text or "jazzcash" in combined_text or "account" in combined_text for step in timeline)
        has_credentials = any("credential" in str(step.get("signals", [])).lower() or "otp" in combined_text or "password" in combined_text for step in timeline)
        has_dlp = any("dlp" in str(step.get("signals", [])).lower() or "api_key" in combined_text for step in timeline)
        has_code_work = any("code" in combined_text or "project" in combined_text or "meeting" in combined_text or "build" in combined_text or "git" in combined_text for step in timeline)
        has_social = any("salam" in combined_text or "hello" in combined_text or "kal" in combined_text or "bhai" in combined_text for step in timeline)

        topic_title = "General Conversation"
        topic_category = "CASUAL_CHAT"
        topic_summary = "General discussion between participants."
        key_entities = []

        # Find URLs
        urls = re.findall(r'(?:https?://|www\.)[^\s<>"\'{}|\\^`\[\]]+', " ".join(messages))
        if urls:
            key_entities.append(f"External Links: {len(urls)} link(s) shared")

        # Find potential phone numbers or amounts
        amounts = re.findall(r'\b(?:rs\.?|pkr|\$)\s*\d+(?:,\d+)?|\b\d{4,6}\s*(?:rupees|pkr|rs)\b', combined_text, re.IGNORECASE)
        if amounts:
            key_entities.append(f"Monetary Values: {', '.join(amounts[:2])}")

        if has_phishing and has_credentials:
            topic_title = "Credential Harvesting & Phishing Attack"
            topic_category = "CYBER_THREAT"
            topic_summary = "An external link paired with urgency pressure was transmitted attempting to collect sensitive authentication credentials."
        elif has_bisp or (has_banking and has_credentials):
            topic_title = "Regional Financial Fraud / Account Takeover"
            topic_category = "FINANCIAL_FRAUD"
            topic_summary = "The conversation contains patterns mimicking Easypaisa/JazzCash or BISP welfare relief fund verification to solicit OTPs or money transfers."
        elif has_phishing:
            topic_title = "Suspicious Link & Phishing Investigation"
            topic_category = "PHISHING_INVESTIGATION"
            topic_summary = "The dialogue involves unverified external URLs with potential typosquatting or destination redirect markers."
        elif has_dlp:
            topic_title = "Sensitive Secret / Access Key Exposure"
            topic_category = "DATA_LEAK"
            topic_summary = "Outbound communication containing API keys, passwords, or configuration secrets was detected."
        elif has_code_work:
            topic_title = "Project Collaboration & Technical Coordination"
            topic_category = "PRODUCTIVITY"
            topic_summary = "Participants are coordinating on software development, project deadlines, technical tasks, or team deliverables."
        elif has_social:
            topic_title = "Social Check-in & Casual Planning"
            topic_category = "SOCIAL"
            topic_summary = "Everyday friendly exchange, greetings, and casual plans."

        return {
            "title": topic_title,
            "category": topic_category,
            "summary": topic_summary,
            "key_entities": key_entities
        }

    @classmethod
    def evaluate_history(cls, messages: List[str]) -> Dict[str, Any]:
        if not messages:
            return {
                "risk_score": 0,
                "security_state": "GREEN",
                "topic": {
                    "title": "New Channel",
                    "category": "EMPTY",
                    "summary": "No messages have been sent in this channel yet.",
                    "key_entities": []
                },
                "summary": "Channel is empty and in a clean Zero-Trust baseline state.",
                "timeline": [],
                "recommendations": ["Channel is ready for end-to-end encrypted messaging."]
            }
            
        timeline = []
        accumulated_risk = 0.0
        observed_signals = set()

        for idx, msg in enumerate(messages):
            p_res = PhishingDetector.analyze_text_and_urls(msg)
            s_res = SocialEngineeringDetector.classify(msg)
            u_res = UrduScamDetector.scan(msg)
            z_res = ZeroDayCognitiveEngine.analyze_zero_day_intent(msg)
            d_res = DlpDetector.scan(msg)

            step_risk = 0.0
            signals = []

            if p_res["phishing_detected"]:
                step_risk += max(60.0, p_res["phishing_confidence"] * 85.0)
                signals.append("Deceptive Phishing URL detected")
                observed_signals.add("PHISHING_LINK")

            if z_res["zero_day_threat_detected"]:
                step_risk += float(z_res["cognitive_risk_score"]) * 0.85
                signals.extend(z_res["intent_signals"][:2])
                observed_signals.add("ZERO_DAY_COGNITIVE_INTENT")

            if u_res["scam_detected"]:
                step_risk += float(u_res["risk_score"]) * 0.8
                signals.extend(u_res["signals"][:2])
                observed_signals.add("URDU_REGIONAL_FRAUD")

            if s_res["social_engineering_index"] > 0.25:
                step_risk += s_res["social_engineering_index"] * 55.0
                signals.extend([cat.replace('_', ' ').title() for cat in s_res["detected_categories"]])
                for cat in s_res["detected_categories"]:
                    observed_signals.add(cat.upper())

            if d_res["has_sensitive_data"]:
                step_risk += 50.0
                signals.append("Sensitive API Key / Secret exposure")
                observed_signals.add("DLP_SECRET_EXPOSURE")

            # Risk accumulation: current step adds to history with compounding
            if step_risk > 0:
                accumulated_risk = min(100.0, accumulated_risk * 0.75 + step_risk)
            else:
                accumulated_risk = max(0.0, accumulated_risk * 0.7)

            color = "GREEN"
            if accumulated_risk >= 75:
                color = "RED"
            elif accumulated_risk >= 25:
                color = "ORANGE"

            timeline.append({
                "step": idx + 1,
                "message_snippet": msg[:45] + "..." if len(msg) > 45 else msg,
                "risk_score": round(accumulated_risk),
                "indicator_color": color,
                "signals": signals if signals else ["Clean message"]
            })

        final_score = round(accumulated_risk)
        final_color = "GREEN"
        if final_score >= 75:
            final_color = "RED"
        elif final_score >= 25:
            final_color = "ORANGE"

        topic_info = cls.extract_topic(messages, timeline)

        recommendations = []
        if final_color == "RED":
            recommendations.append("Do not click any unverified links or open external portals.")
            recommendations.append("Never share one-time PINs (OTPs), passwords, or CNIC.")
            recommendations.append("Block the sender or report this conversation to administrator.")
        elif final_color == "ORANGE":
            recommendations.append("Exercise caution regarding requested actions or unverified statements.")
            recommendations.append("Verify the contact's identity over a secondary channel before proceeding.")
        else:
            recommendations.append("Channel is healthy with standard Double Ratchet Zero-Trust encryption active.")

        return {
            "risk_score": final_score,
            "security_state": final_color,
            "topic": topic_info,
            "summary": f"Topic: {topic_info['title']}. {topic_info['summary']}",
            "observed_signals": list(observed_signals),
            "timeline": timeline,
            "recommendations": recommendations,
            "total_messages": len(messages)
        }
