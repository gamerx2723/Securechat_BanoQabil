from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List
from ..models.phishing_detector import PhishingDetector
from ..models.social_engineering_detector import SocialEngineeringDetector
from ..models.urdu_scam_detector import UrduScamDetector
from ..models.zero_day_cognitive_engine import ZeroDayCognitiveEngine
from ..models.dlp_detector import DlpDetector
from ..models.explainability_engine import ExplainabilityEngine

router = APIRouter(prefix="/api/v1", tags=["Analysis"])

class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="Message text to analyze")
    conversationId: Optional[str] = None
    senderId: Optional[str] = None
    language: Optional[str] = "auto"

@router.post("/analyze")
async def analyze_message(req: AnalyzeRequest):
    phishing = PhishingDetector.analyze_text_and_urls(req.text)
    social = SocialEngineeringDetector.classify(req.text)
    urdu_scam = UrduScamDetector.scan(req.text)
    zero_day = ZeroDayCognitiveEngine.analyze_zero_day_intent(req.text)
    dlp = DlpDetector.scan(req.text)

    # Compute risk score 0 - 100
    accumulated_risk = 0.0
    accumulated_risk += phishing["phishing_confidence"] * 60
    accumulated_risk += social["social_engineering_index"] * 45
    if zero_day["zero_day_threat_detected"]:
        accumulated_risk = max(accumulated_risk, float(zero_day["cognitive_risk_score"]))
    if urdu_scam["scam_detected"]:
        accumulated_risk = max(accumulated_risk, float(urdu_scam["risk_score"]))
    if dlp["has_sensitive_data"]:
        accumulated_risk += 40

    final_score = min(100, round(accumulated_risk))
    color = "GREEN"
    if final_score >= 75:
        color = "RED"
    elif final_score >= 25:
        color = "ORANGE"

    # Determine primary threat
    primary_threat = "SAFE"
    if phishing["phishing_detected"]:
        primary_threat = "PHISHING"
    elif zero_day["zero_day_threat_detected"] and final_score >= 50:
        primary_threat = "SOCIAL_ENGINEERING"
    elif urdu_scam["scam_detected"] and final_score >= 45:
        primary_threat = "SOCIAL_ENGINEERING"
    elif social["social_engineering_index"] > 0.3:
        primary_threat = "SOCIAL_ENGINEERING"
    elif dlp["has_sensitive_data"]:
        primary_threat = "DLP_SECRET_EXPOSURE"

    explanation = ExplainabilityEngine.generate_explanation(final_score, color, phishing, social, dlp, urdu_scam)

    return {
        "risk_score": final_score,
        "indicator_color": color,
        "primary_threat": primary_threat,
        "confidence": 98 if final_score == 0 else min(99, 65 + final_score // 3),
        "phishing_analysis": phishing,
        "social_engineering_analysis": social,
        "urdu_scam_analysis": urdu_scam,
        "zero_day_analysis": zero_day,
        "dlp_analysis": dlp,
        "explanation": explanation
    }
