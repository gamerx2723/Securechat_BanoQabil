from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List
from ..models.adaptive_learning_engine import AdaptiveLearningEngine

router = APIRouter(prefix="/api/v1/learn", tags=["Continuous Active Learning"])

class LearnFeedbackRequest(BaseModel):
    text: str = Field(..., description="Message text or URL to learn")
    label: str = Field(..., description="'MALICIOUS' or 'BENIGN'")
    category: Optional[str] = "ADMIN_REPORTED_ZERO_DAY"
    feedbackBy: Optional[str] = "ADMIN"

@router.post("/feedback")
async def learn_feedback(req: LearnFeedbackRequest):
    result = AdaptiveLearningEngine.learn_sample(
        text=req.text,
        label=req.label,
        category=req.category or "ADMIN_REPORTED_ZERO_DAY",
        feedback_by=req.feedbackBy or "ADMIN"
    )
    return result

@router.get("/stats")
async def get_learning_stats():
    return AdaptiveLearningEngine.get_memory_stats()
