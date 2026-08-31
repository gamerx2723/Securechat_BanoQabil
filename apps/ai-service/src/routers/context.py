from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional
from ..models.context_engine import ConversationContextEngine

router = APIRouter(prefix="/api/v1/context", tags=["Context Engine"])

class ContextEvaluationRequest(BaseModel):
    conversationId: str
    messages: List[str] = Field(..., description="Chronological message sequence in the conversation")

@router.post("/evaluate")
async def evaluate_context(req: ContextEvaluationRequest):
    result = ConversationContextEngine.evaluate_history(req.messages)
    return {
        "conversationId": req.conversationId,
        **result
    }
