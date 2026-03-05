"""Agent 3 — Validator: Vérifie cohérence et rejette les hallucinations."""

import logging
import time

from app.agents.state import AgentState

logger = logging.getLogger(__name__)

MAX_RETRIES = 2


def validator_agent(state: AgentState) -> AgentState:
    """Validate executor results for consistency and correctness."""
    start = time.time()
    logger.info(f"Validator checking {len(state.raw_results)} results")

    state.validation_errors = []
    state.validated = True

    # Rule 1: Check if we have results for non-general queries
    if state.intent != "general" and not state.raw_results and not state.rag_context:
        state.validation_errors.append("Aucun résultat trouvé pour cette requête.")

    # Rule 2: Check result consistency
    if state.intent == "search" and state.raw_results:
        for result in state.raw_results:
            if not result.get("name"):
                state.validation_errors.append("Résultat sans nom d'équipement détecté.")
                state.validated = False
                break

    # Rule 3: Check stats consistency
    if state.intent == "stats" and state.raw_results:
        stats = state.raw_results[0] if state.raw_results else {}
        total = stats.get("total", 0)
        actif = stats.get("actif", 0)
        en_panne = stats.get("en_panne", 0)
        en_maintenance = stats.get("en_maintenance", 0)
        if actif + en_panne + en_maintenance > total:
            state.validation_errors.append("Incohérence dans les statistiques.")
            state.validated = False

    # Rule 4: Check confidence threshold
    if state.confidence < 0.3:
        state.validation_errors.append("Confiance faible dans la classification de la requête.")

    # Handle retry logic
    if not state.validated and state.retry_count < MAX_RETRIES:
        state.needs_retry = True
        state.retry_count += 1
        logger.warning(f"Validation failed, retry {state.retry_count}/{MAX_RETRIES}")
    else:
        state.needs_retry = False

    elapsed = (time.time() - start) * 1000
    state.agents_trace.append({
        "agent": "validator",
        "validated": state.validated,
        "errors": state.validation_errors,
        "retry_count": state.retry_count,
        "time_ms": elapsed,
    })

    return state
