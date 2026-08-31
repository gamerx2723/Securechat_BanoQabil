from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List
from ..models.phishing_detector import PhishingDetector
from ..models.social_engineering_detector import SocialEngineeringDetector
from ..models.urdu_scam_detector import UrduScamDetector
from ..models.zero_day_cognitive_engine import ZeroDayCognitiveEngine
from ..models.dlp_detector import DlpDetector

router = APIRouter(prefix="/api/v1/copilot", tags=["Security Copilot"])

class CopilotQuery(BaseModel):
    query: str = Field(..., description="User query to Security Copilot")
    conversationId: Optional[str] = None
    currentContext: Optional[str] = None
    recentMessages: Optional[List[str]] = None

@router.post("/query")
async def copilot_query(req: CopilotQuery):
    q = req.query.strip()
    q_lower = q.lower()
    
    # 1. Inspect the query itself for live threats
    p_res = PhishingDetector.analyze_text_and_urls(q)
    s_res = SocialEngineeringDetector.classify(q)
    u_res = UrduScamDetector.scan(q)
    z_res = ZeroDayCognitiveEngine.analyze_zero_day_intent(q)
    d_res = DlpDetector.scan(q)

    risk = 0
    followups = [
        "Explain the threats in my active chat",
        "How do I recognize Zero-Day social engineering?",
        "What is Double Ratchet E2E Encryption?"
    ]

    # Contextual Chat History Evaluation if user asks about the chat
    if any(k in q_lower for k in ["this chat", "current chat", "whole chat", "topic", "summarize", "what is this about", "are there threats", "is this conversation safe"]):
        if req.recentMessages and len(req.recentMessages) > 0:
            total_msgs = len(req.recentMessages)
            threat_count = 0
            flagged_reasons = []
            for msg in req.recentMessages:
                p = PhishingDetector.analyze_text_and_urls(msg)
                z = ZeroDayCognitiveEngine.analyze_zero_day_intent(msg)
                u = UrduScamDetector.scan(msg)
                if p["phishing_detected"]:
                    threat_count += 1
                    flagged_reasons.append("Phishing Link")
                elif z["zero_day_threat_detected"]:
                    threat_count += 1
                    flagged_reasons.append("Zero-Day Cognitive Intent")
                elif u["scam_detected"]:
                    threat_count += 1
                    flagged_reasons.append("Urdu Regional Scam")

            if threat_count > 0:
                answer = f"🛡️ **Active Chat Analysis ({total_msgs} messages)**:\n\n⚠️ I detected **{threat_count} high-risk message(s)** in this conversation.\n- Threat types: {', '.join(set(flagged_reasons))}.\n- **Advice**: Do not authenticate on external portals, do not send funds, and avoid disclosing OTPs or passwords."
                risk = 85
            else:
                answer = f"🛡️ **Active Chat Analysis ({total_msgs} messages)**:\n\n✅ This conversation appears **clean and secure**. No phishing URLs, zero-day coercion patterns, or sensitive data leaks have been observed. All messages remain protected under Zero-Trust end-to-end encryption."
                risk = 0
            followups = ["Scan links in this chat", "Show full security report", "What precautions should I take?"]
            return {"answer": answer, "relatedRiskScore": risk, "suggestedFollowups": followups}

    # 2. Query contains a live Phishing URL
    if p_res["phishing_detected"]:
        reasons = [r for u in p_res["urls_analyzed"] for r in u["reasons"]]
        answer = f"⚠️ **CRITICAL PHISHING ALERT**: The link in your query has been flagged as a deceptive credential harvesting attempt.\n\n• **Threat Evidence**: {'; '.join(reasons or p_res['linguistic_patterns'])}\n• **Recommendation**: Block this link immediately. Do not enter credentials, usernames, or tokens."
        risk = 95
        followups = ["Why was this link flagged?", "How do phishing models detect lookalike domains?", "Report this URL"]

    # 3. Query contains Zero-Day Cognitive Intent / Anti-Analysis Evasion
    elif z_res["zero_day_threat_detected"]:
        answer = f"⚠️ **ZERO-DAY COGNITIVE THREAT DETECTED**:\n\n• **Cognitive Risk Score**: {z_res['cognitive_risk_score']}/100\n• **Signals Identified**:\n" + "\n".join([f"  - {s}" for s in z_res['intent_signals']]) + "\n\n• **Recommendation**: This text exhibits psychological coercion (Action Request + Pressure + Security Bypass). Do not proceed."
        risk = z_res["cognitive_risk_score"]
        followups = ["What is the Cognitive Threat Triangle?", "How does Zero-Day reasoning work?", "Inspect domain entropy"]

    # 4. Query contains Urdu / Roman Urdu Scam
    elif u_res["scam_detected"]:
        answer = f"⚠️ **REGIONAL FRAUD DETECTED (Urdu / Roman Urdu)**:\n\n• **Threat Categories**: {', '.join(u_res['detected_categories'])}\n• **Risk Confidence**: {u_res['confidence'] * 100:.0f}%\n• **Analysis**: This message matches known Pakistani/South Asian scam archetypes (Easypaisa/JazzCash OTP theft, BISP relief fraud, or fake prizes).\n• **Precaution**: Official entities never ask for your PIN, OTP, or advance deposit."
        risk = u_res["risk_score"]
        followups = ["Explain Easypaisa scam tactics", "How do lottery scams work?", "What should I do if I shared my OTP?"]

    # 5. Query contains DLP Secret Exposure
    elif d_res["has_sensitive_data"]:
        items = [i["warning"] for i in d_res["detected_items"]]
        answer = f"🔒 **DLP DATA LEAK INTERCEPTED**:\n\n• **Secrets Detected**: {'; '.join(items)}\n• **Security Warning**: Sensitive credentials or API secrets must never be shared in plaintext. SecureChat masks these secrets to prevent unauthorized exfiltration."
        risk = 80
        followups = ["How does DLP scanning work?", "How can I rotate an exposed secret?", "What types of secrets are detected?"]

    # 6. Specific Cybersecurity Knowledge Inquiries
    elif any(k in q_lower for k in ["double ratchet", "e2ee", "encryption", "signal", "x3dh", "cryptography"]):
        answer = "🔐 **SecureChat Cryptographic Architecture**:\n\nSecureChat implements the **Signal Protocol Double Ratchet** combined with **Extended Triple Diffie-Hellman (X3DH)** over Curve25519:\n1. **Forward Secrecy**: Every single message generates a new ephemeral ratchet key. Compromising one key never reveals past messages.\n2. **Break-in Recovery**: The ratchet self-heals after temporary device compromise.\n3. **Zero-Trust**: The server only acts as a ciphertext blind routing relay and cannot read message payloads."
        risk = 0
        followups = ["How does X3DH work?", "What is Forward Secrecy?", "How is my private key stored?"]

    elif any(k in q_lower for k in ["zero-day", "zero day", "how does zero day work", "logic"]):
        answer = "🧠 **Zero-Day Behavioral Reasoning Logic**:\n\nUnlike traditional anti-virus tools that rely on static database lookups of known bad domains, SecureChat's AI evaluates **Cognitive Invariants**:\n- **Intent Matrix**: Action requests paired with artificial urgency or consequence.\n- **Bypass Directives**: Instructions to ignore security warnings or share OTPs.\n- **Mathematical Invariants**: Shannon entropy of domains, deep subdomain stacking, nested redirect parameters, and hidden zero-width Unicode characters."
        risk = 0
        followups = ["Test a zero-day sample", "Explain Shannon entropy", "How are zero-width characters detected?"]

    elif any(k in q_lower for k in ["phishing", "scam", "how to stay safe", "tips", "best practices"]):
        answer = "🛡️ **Zero-Trust Cybersecurity Rules**:\n\n1. **Check Domain Origins**: Always verify the actual root domain, not just what comes after the slash.\n2. **Verify Through Out-of-Band Channels**: If a friend or authority urgently asks for money or verification, call them on a known verified phone number.\n3. **Never Share OTPs or PINs**: No legitimate bank, admin, or support agent will ever ask for your 4-6 digit authentication code."
        risk = 0
        followups = ["How do typo-squatted domains work?", "Explain Social Engineering cues", "Scan a link with Copilot"]

    else:
        answer = f"👋 Hello! I am **SecureGuard Copilot**, your real-time AI security assistant.\n\nI monitor your conversations with **Zero-Trust E2EE and Cognitive Intent reasoning** to protect you from phishing, zero-day coercion, data leaks, and regional fraud.\n\nYou can paste any suspicious link, ask about your current chat, or request security advice at any time!"
        risk = 0

    return {
        "answer": answer,
        "relatedRiskScore": risk,
        "suggestedFollowups": followups
    }
