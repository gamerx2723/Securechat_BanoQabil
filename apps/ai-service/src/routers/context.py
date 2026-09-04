from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional
from ..models.context_engine import ConversationContextEngine
from ..models.grooming_behavior_tracker import GroomingBehaviorTracker

router = APIRouter(prefix="/api/v1/context", tags=["Context Engine"])

class ContextEvaluationRequest(BaseModel):
    conversationId: str
    messages: List[str] = Field(..., description="Chronological message sequence in the conversation")

@router.post("/evaluate")
async def evaluate_context(req: ContextEvaluationRequest):
    result = ConversationContextEngine.evaluate_history(req.messages)
    behavior = GroomingBehaviorTracker.analyze_behavior(req.messages)
    return {
        "conversationId": req.conversationId,
        "behavior": behavior,
        **result
    }

@router.post("/behavior")
async def evaluate_behavior(req: ContextEvaluationRequest):
    behavior = GroomingBehaviorTracker.analyze_behavior(req.messages)
    return {
        "conversationId": req.conversationId,
        **behavior
    }
