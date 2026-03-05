"""LangGraph orchestrator — NOVA-EQP agent pipeline.

State machine: Router → Executor → Validator → Formatter
With retry loop on validation failure.
"""

import logging
import time

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.state import AgentState
from app.agents.router_agent import router_agent
from app.agents.executor_agent import executor_agent
from app.agents.validator_agent import validator_agent
from app.agents.formatter_agent import formatter_agent

logger = logging.getLogger(__name__)


async def run_agent_pipeline(
    user_message: str,
    user_id: str,
    conversation_id: str,
    db: AsyncSession,
) -> AgentState:
    """Run the full NOVA-EQP agent pipeline.

    Flow: Router → Executor → Validator → Formatter
    With retry loop if validation fails.
    """
    start = time.time()

    state = AgentState(
        user_message=user_message,
        user_id=user_id,
        conversation_id=conversation_id,
    )

    try:
        # Step 1: Router
        state = router_agent(state)

        # Step 2 + 3: Executor → Validator (with retry)
        while True:
            state = await executor_agent(state, db)

            if state.error:
                break

            state = validator_agent(state)

            if not state.needs_retry:
                break

            logger.info(f"Retrying pipeline (attempt {state.retry_count})")

        # Step 4: Formatter
        state = formatter_agent(state)

    except Exception as e:
        logger.error(f"Pipeline error: {e}")
        state.error = str(e)
        state.formatted_response = (
            "**Erreur NOVA-EQP**\n\n"
            "Une erreur est survenue lors du traitement de votre demande. "
            "Veuillez réessayer ou contacter le support technique."
        )

    state.execution_time_ms = (time.time() - start) * 1000
    logger.info(f"Pipeline completed in {state.execution_time_ms:.0f}ms")

    return state
