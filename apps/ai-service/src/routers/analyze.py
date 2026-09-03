from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List
from ..models.phishing_detector import PhishingDetector
from ..models.social_engineering_detector import SocialEngineeringDetector
from ..models.urdu_scam_detector import UrduScamDetector
from ..models.blackmail_detector import BlackmailDetector
from ..models.zero_day_cognitive_engine import ZeroDayCognitiveEngine
from ..models.deep_cognitive_engine import DeepCognitiveEngine
from ..models.adaptive_learning_engine import AdaptiveLearningEngine
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
    deep_cognitive = DeepCognitiveEngine.analyze_deep_intent(req.text)
    adaptive_mem = AdaptiveLearningEngine.query_adaptive_memory(req.text)
    blackmail = BlackmailDetector.scan(req.text)
    dlp = DlpDetector.scan(req.text)

    # Compute risk score 0 - 100
    accumulated_risk = 0.0
    accumulated_risk += phishing["phishing_confidence"] * 60
    
    if social["social_engineering_index"] >= 0.25:
        accumulated_risk += social["social_engineering_index"] * 45

    if blackmail["blackmail_detected"]:
        accumulated_risk = max(accumulated_risk, float(blackmail["risk_score"]))

    if zero_day["zero_day_threat_detected"]:
        accumulated_risk = max(accumulated_risk, float(zero_day["cognitive_risk_score"]))

    if deep_cognitive["cognitive_threat_detected"]:
        accumulated_risk = max(accumulated_risk, float(deep_cognitive["deep_cognitive_score"]))

    if urdu_scam["scam_detected"]:
        accumulated_risk = max(accumulated_risk, float(urdu_scam["risk_score"]))

    # Dynamic Active Learning Override:
    # If dynamic memory confirmed a malicious pattern, boost risk. If confirmed benign, clamp risk.
    if adaptive_mem["has_memory_match"] and adaptive_mem["matched_exemplar"]:
        ex_label = adaptive_mem["matched_exemplar"]["label"]
        if ex_label == "MALICIOUS":
            accumulated_risk = max(accumulated_risk, float(adaptive_mem["adaptive_risk_score"]))
        elif ex_label == "BENIGN":
            accumulated_risk = min(accumulated_risk, 0.0)
    elif adaptive_mem["online_model_score"] >= 65.0:
        accumulated_risk = max(accumulated_risk, float(adaptive_mem["online_model_score"]))

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
    if blackmail["is_blackmail_threat"]:
        primary_threat = "BLACKMAIL_SEXTORTION"
    elif blackmail["is_coercive_solicitation"]:
        primary_threat = "COERCIVE_INTIMATE_SOLICITATION"
    elif phishing["phishing_detected"]:
        primary_threat = "PHISHING"
    elif adaptive_mem["has_memory_match"] and adaptive_mem["matched_exemplar"] and adaptive_mem["matched_exemplar"]["label"] == "MALICIOUS":
        primary_threat = "SOCIAL_ENGINEERING"
    elif deep_cognitive["cognitive_threat_detected"] and final_score >= 50:
        primary_threat = "SOCIAL_ENGINEERING"
    elif zero_day["zero_day_threat_detected"] and final_score >= 50:
        primary_threat = "SOCIAL_ENGINEERING"
    elif urdu_scam["scam_detected"] and final_score >= 45:
        primary_threat = "SOCIAL_ENGINEERING"
    elif social["social_engineering_index"] > 0.3:
        primary_threat = "SOCIAL_ENGINEERING"
    elif dlp["has_sensitive_data"]:
        primary_threat = "DLP_SECRET_EXPOSURE"

    explanation = ExplainabilityEngine.generate_explanation(final_score, color, phishing, social, dlp, urdu_scam)
    if blackmail["blackmail_detected"] and color == "RED":
        explanation = "CRITICAL ALERT: Non-consensual image leak extortion or coercive blackmail threat detected. Protect your private media and access legal assistance immediately."

    return {
        "risk_score": final_score,
        "indicator_color": color,
        "primary_threat": primary_threat,
        "confidence": 98 if final_score == 0 else min(99, 65 + final_score // 3),
        "phishing_analysis": phishing,
        "social_engineering_analysis": social,
        "urdu_scam_analysis": urdu_scam,
        "blackmail_analysis": blackmail,
        "zero_day_analysis": zero_day,
        "deep_cognitive_analysis": deep_cognitive,
        "adaptive_memory_analysis": adaptive_mem,
        "dlp_analysis": dlp,
        "explanation": explanation
    }
