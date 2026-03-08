"""Agent 1 — Router: Détecte l'intention et structure la requête."""

import json
import logging
import time

from langchain_core.messages import SystemMessage, HumanMessage

from app.agents.state import AgentState
from app.agents.llm_provider import get_llm_with_fallback

logger = logging.getLogger(__name__)

ROUTER_SYSTEM_PROMPT = """Tu es le Router de NOVA-EQP, un système hospitalier de gestion d'équipements biomédicaux.

Ton rôle UNIQUE : analyser le message utilisateur et produire une classification structurée.

CATÉGORIES disponibles :
- electricite : Groupes électrogènes, onduleurs, TGBT, transformateurs, éclairage
- fluides_medicaux : Oxygène, air médical, vide, protoxyde d'azote, centrales de gaz
- hvac : Climatisation, ventilation, chauffage, CTA, groupes froids
- plomberie : Réseaux eau, pompes, surpresseurs, traitement eau, assainissement
- securite_incendie : Détection incendie, sprinklers, RIA, désenfumage, extincteurs
- informatique : Réseau, serveurs, téléphonie, systèmes d'appel
- general : Question générale ne correspondant à aucune catégorie spécifique

INTENTIONS possibles :
- search : Recherche d'équipement ou d'information
- maintenance : Question sur maintenance, entretien, réparation
- stats : Demande de statistiques ou KPI
- documentation : Demande de documentation technique, manuels, fiches
- general : Conversation générale, salutation, aide

Réponds UNIQUEMENT en JSON valide :
{
    "intent": "search|maintenance|stats|documentation|general",
    "category": "electricite|fluides_medicaux|hvac|plomberie|securite_incendie|informatique|general",
    "filters": {
        "keyword": "mot clé extrait ou null",
        "location": "localisation extraite ou null",
        "status": "statut extrait ou null"
    },
    "confidence": 0.0-1.0
}"""


def router_agent(state: AgentState) -> AgentState:
    """Route user message to appropriate intent and category."""
    start = time.time()
    logger.info(f"Router processing: {state.user_message[:100]}")

    llm = get_llm_with_fallback(temperature=0.0)

    messages = [
        SystemMessage(content=ROUTER_SYSTEM_PROMPT),
        HumanMessage(content=state.user_message),
    ]

    response = llm.invoke(messages)
    content = response.content.strip()

    # Parse JSON response
    # Handle markdown code blocks
    if content.startswith("```"):
        content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    try:
        parsed = json.loads(content)
        state.intent = parsed.get("intent", "general")
        state.category = parsed.get("category", "general")
        state.filters = parsed.get("filters", {})
        state.confidence = parsed.get("confidence", 0.5)
    except json.JSONDecodeError:
        logger.warning(f"Router failed to parse JSON: {content}")
        state.intent = "general"
        state.category = "general"
        state.filters = {}
        state.confidence = 0.3

    elapsed = (time.time() - start) * 1000
    state.agents_trace.append({
        "agent": "router",
        "intent": state.intent,
        "category": state.category,
        "confidence": state.confidence,
        "time_ms": elapsed,
    })

    logger.info(f"Router result: intent={state.intent}, category={state.category}, confidence={state.confidence}")
    return state
