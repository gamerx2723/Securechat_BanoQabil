from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List
from ..models.phishing_detector import PhishingDetector
from ..models.social_engineering_detector import SocialEngineeringDetector
from ..models.dlp_detector import DlpDetector

router = APIRouter(prefix="/api/v1/copilot", tags=["Security Copilot"])

class CopilotQuery(BaseModel):
    query: str = Field(..., description="User query to Security Copilot")
    conversationId: Optional[str] = None
    currentContext: Optional[str] = None

@router.post("/query")
async def copilot_query(req: CopilotQuery):
    q = req.query.lower()
    
    # Analyze if the query itself contains a test link or payload
    p_res = PhishingDetector.analyze_text_and_urls(req.query)
    s_res = SocialEngineeringDetector.classify(req.query)
    d_res = DlpDetector.scan(req.query)

    followups = [
        "How does Zero-Trust messaging work in SecureChat?",
        "What are the indicators of a homoglyph attack?",
        "How do I safely verify a contact's identity?"
    ]

    if p_res["phishing_detected"]:
        answer = f"⚠️ Warning: The link or snippet in your query has suspicious indicators: {', '.join(p_res['linguistic_patterns'] + [r for u in p_res['urls_analyzed'] for r in u['reasons']])}. Do not open it."
        risk = 85
    elif d_res["has_sensitive_data"]:
        answer = "⚠️ Warning: The text you asked about contains confidential secrets or API keys. Do not send this in unencrypted or untrusted channels."
        risk = 75
    elif "safe" in q or "link" in q or "url" in q:
        answer = "SecureGuard inspects URLs for domain lookalikes, unicode homoglyphs (like Cyrillic lookalikes), direct IP hosts, and urgency keywords. Always verify the domain name spelling and check the green/orange/red badge."
        risk = 15
    elif "secret" in q or "otp" in q or "password" in q:
        answer = "SecureChat DLP continuously protects you against sharing passwords, OTPs, recovery keys, and API tokens. Never share one-time passcodes, even if the person claims to be technical support."
        risk = 10
    else:
        answer = f"I am your personal AI Security Guardian. {req.currentContext or 'Your active conversation is currently protected with Zero-Trust E2EE and real-time cascaded threat evaluation.'}"
        risk = 5

    return {
        "answer": answer,
        "relatedRiskScore": risk,
        "suggestedFollowups": followups
    }
