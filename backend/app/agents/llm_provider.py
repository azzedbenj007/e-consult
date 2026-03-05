"""Multi-LLM provider with fallback support."""

import logging
from typing import Optional

from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.language_models import BaseChatModel

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _parse_provider(model_string: str) -> tuple[str, str]:
    """Parse 'provider/model' string."""
    parts = model_string.split("/", 1)
    if len(parts) == 2:
        return parts[0], parts[1]
    return "openai", parts[0]


def get_llm(model_override: Optional[str] = None, temperature: float = 0.1) -> BaseChatModel:
    """Get an LLM instance based on configuration or override."""
    model_string = model_override or settings.PRIMARY_LLM
    provider, model_name = _parse_provider(model_string)

    if provider == "openai":
        return ChatOpenAI(
            model=model_name,
            temperature=temperature,
            api_key=settings.OPENAI_API_KEY,
        )
    elif provider == "anthropic":
        return ChatAnthropic(
            model=model_name,
            temperature=temperature,
            api_key=settings.ANTHROPIC_API_KEY,
        )
    else:
        raise ValueError(f"Fournisseur LLM non supporté : {provider}")


def get_llm_with_fallback(temperature: float = 0.1) -> BaseChatModel:
    """Get primary LLM with automatic fallback."""
    try:
        return get_llm(settings.PRIMARY_LLM, temperature)
    except Exception as e:
        logger.warning(f"Primary LLM failed: {e}, trying secondary")
        if settings.FALLBACK_ENABLED and settings.SECONDARY_LLM:
            try:
                return get_llm(settings.SECONDARY_LLM, temperature)
            except Exception as e2:
                logger.error(f"Secondary LLM also failed: {e2}")
                raise
        raise
