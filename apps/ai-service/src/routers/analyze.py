from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List
from ..models.phishing_detector import PhishingDetector
from ..models.social_engineering_detector import SocialEngineeringDetector
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
    dlp = DlpDetector.scan(req.text)

    # Compute risk score 0 - 100
    accumulated_risk = 0.0
    accumulated_risk += phishing["phishing_confidence"] * 60
    accumulated_risk += social["social_engineering_index"] * 45
    if dlp["has_sensitive_data"]:
        accumulated_risk += 40

    final_score = min(100, round(accumulated_risk))
    color = "GREEN"
    if final_score >= 80:
        color = "RED"
    elif final_score >= 25:
        color = "ORANGE"

    explanation = ExplainabilityEngine.generate_explanation(final_score, color, phishing, social, dlp)

    return {
        "risk_score": final_score,
        "indicator_color": color,
        "primary_threat": "PHISHING" if phishing["phishing_detected"] else ("SOCIAL_ENGINEERING" if social["social_engineering_index"] > 0.3 else ("DLP_SECRET_EXPOSURE" if dlp["has_sensitive_data"] else "SAFE")),
        "confidence": 98 if final_score == 0 else min(99, 50 + final_score // 2),
        "phishing_analysis": phishing,
        "social_engineering_analysis": social,
        "dlp_analysis": dlp,
        "explanation": explanation
    }
