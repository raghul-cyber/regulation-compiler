import logging
from sqlalchemy.orm import Session
from app.models.audit import LLMLog

logger = logging.getLogger(__name__)

def log_llm_call(
    db: Session,
    pipeline_stage: str,
    model_used: str,
    prompt_tokens: int,
    completion_tokens: int,
    latency_ms: int,
    estimated_cost: float
) -> None:
    """
    Persists LLM usage metrics to the database for observability and billing compliance.
    """
    total_tokens = prompt_tokens + completion_tokens
    
    # Also log to stdout for real-time observability
    logger.info(
        f"LLM Call [{pipeline_stage}]: model={model_used}, tokens={total_tokens} "
        f"({prompt_tokens} prompt + {completion_tokens} completion), "
        f"latency={latency_ms}ms, cost=${estimated_cost:.5f}"
    )
    
    try:
        log_entry = LLMLog(
            pipeline_stage=pipeline_stage,
            model_used=model_used,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            latency_ms=latency_ms,
            estimated_cost=estimated_cost
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to persist LLMLog to database: {str(e)}")
        db.rollback()
