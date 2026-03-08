"""Agent 4 — Formatter: Applique le style NOVA strict."""

import logging
import time

from langchain_core.messages import SystemMessage, HumanMessage

from app.agents.state import AgentState
from app.agents.llm_provider import get_llm_with_fallback

logger = logging.getLogger(__name__)

FORMATTER_SYSTEM_PROMPT = """Tu es le Formateur de NOVA-EQP, assistant hospitalier de gestion d'équipements biomédicaux.

RÈGLES STRICTES :
1. Maximum 200 mots
2. Utilise une numérotation structurée (1. 2. 3.)
3. Style professionnel hospitalier
4. Précis et factuel — JAMAIS d'invention
5. Si aucun résultat : dis-le clairement
6. Termine par une proposition d'aide complémentaire

FORMAT de réponse :
- Titre court en gras
- Liste numérotée des informations
- Conclusion courte

Tu reçois des données structurées. Formate-les en réponse claire pour un professionnel hospitalier."""


def formatter_agent(state: AgentState) -> AgentState:
    """Format validated results into a professional hospital response."""
    start = time.time()
    logger.info("Formatter processing response")

    llm = get_llm_with_fallback(temperature=0.2)

    # Build context for the formatter
    context_parts = []

    if state.intent == "general" and not state.raw_results:
        state.formatted_response = (
            "**NOVA-EQP — Assistant Équipements Hospitaliers**\n\n"
            "Bonjour ! Je suis NOVA, votre assistant de gestion des équipements biomédicaux.\n\n"
            "Je peux vous aider avec :\n"
            "1. **Recherche d'équipements** — par catégorie, localisation ou mot-clé\n"
            "2. **Suivi de maintenance** — historique et planification\n"
            "3. **Statistiques** — KPI et tableaux de bord\n"
            "4. **Documentation technique** — manuels et fiches\n\n"
            "Comment puis-je vous aider ?"
        )
    else:
        context_parts.append(f"Intent: {state.intent}")
        context_parts.append(f"Catégorie: {state.category}")

        if state.raw_results:
            context_parts.append(f"Résultats ({len(state.raw_results)}):")
            for i, r in enumerate(state.raw_results[:10], 1):
                context_parts.append(f"  {i}. {r}")

        if state.rag_context:
            context_parts.append(f"Contexte documentaire: {state.rag_context}")

        if state.validation_errors:
            context_parts.append(f"Avertissements: {', '.join(state.validation_errors)}")

        context = "\n".join(context_parts)

        messages = [
            SystemMessage(content=FORMATTER_SYSTEM_PROMPT),
            HumanMessage(content=f"Question utilisateur: {state.user_message}\n\nDonnées:\n{context}"),
        ]

        response = llm.invoke(messages)
        state.formatted_response = response.content.strip()

    elapsed = (time.time() - start) * 1000
    state.agents_trace.append({
        "agent": "formatter",
        "response_length": len(state.formatted_response),
        "time_ms": elapsed,
    })

    return state
