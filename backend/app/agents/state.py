"""LangGraph state definitions for the NOVA-EQP agent pipeline."""

from typing import Any, Optional
from dataclasses import dataclass, field


@dataclass
class AgentState:
    """Shared state that flows through the agent pipeline."""

    # Input
    user_message: str = ""
    user_id: str = ""
    conversation_id: str = ""

    # Router output
    intent: str = ""  # search, maintenance, stats, documentation, general
    category: str = ""  # electricite, fluides, hvac, plomberie, securite_incendie
    filters: dict = field(default_factory=dict)
    confidence: float = 0.0

    # Executor output
    raw_results: list[dict[str, Any]] = field(default_factory=list)
    rag_context: str = ""
    source: str = ""  # database, rag, both

    # Validator output
    validated: bool = False
    validation_errors: list[str] = field(default_factory=list)
    needs_retry: bool = False
    retry_count: int = 0

    # Formatter output
    formatted_response: str = ""

    # Metadata
    error: Optional[str] = None
    execution_time_ms: float = 0.0
    agents_trace: list[dict[str, Any]] = field(default_factory=list)
