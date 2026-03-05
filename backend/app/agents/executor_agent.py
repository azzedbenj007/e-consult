"""Agent 2 — Tool Executor: Interroge les sources de données."""

import logging
import time
from typing import Optional

from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.state import AgentState
from app.models.equipment import Equipment, Category, MaintenanceRecord

logger = logging.getLogger(__name__)


async def _search_equipment(
    db: AsyncSession,
    category: Optional[str] = None,
    keyword: Optional[str] = None,
    location: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20,
) -> list[dict]:
    """Search equipment with filters."""
    query = select(Equipment).outerjoin(Category)

    if category and category != "general":
        query = query.where(Category.code == category)

    if keyword:
        search_term = f"%{keyword}%"
        query = query.where(
            or_(
                Equipment.name.ilike(search_term),
                Equipment.description.ilike(search_term),
                Equipment.brand.ilike(search_term),
                Equipment.model.ilike(search_term),
            )
        )

    if location:
        query = query.where(Equipment.location.ilike(f"%{location}%"))

    if status:
        query = query.where(Equipment.status == status)

    query = query.limit(limit)
    result = await db.execute(query)
    rows = result.scalars().all()

    return [
        {
            "id": str(eq.id),
            "name": eq.name,
            "brand": eq.brand,
            "model": eq.model,
            "serial_number": eq.serial_number,
            "location": eq.location,
            "service": eq.service,
            "status": eq.status,
            "last_maintenance": str(eq.last_maintenance) if eq.last_maintenance else None,
            "next_maintenance": str(eq.next_maintenance) if eq.next_maintenance else None,
            "description": eq.description,
            "follow_up_link": eq.follow_up_link,
        }
        for eq in rows
    ]


async def _get_maintenance_records(
    db: AsyncSession,
    equipment_id: Optional[str] = None,
    limit: int = 20,
) -> list[dict]:
    """Get maintenance records."""
    query = select(MaintenanceRecord)

    if equipment_id:
        query = query.where(MaintenanceRecord.equipment_id == equipment_id)

    query = query.order_by(MaintenanceRecord.performed_at.desc()).limit(limit)
    result = await db.execute(query)
    rows = result.scalars().all()

    return [
        {
            "id": str(r.id),
            "equipment_id": str(r.equipment_id),
            "type": r.type,
            "description": r.description,
            "performed_at": str(r.performed_at),
            "next_due": str(r.next_due) if r.next_due else None,
            "status": r.status,
            "notes": r.notes,
        }
        for r in rows
    ]


async def _get_stats(db: AsyncSession, category: Optional[str] = None) -> dict:
    """Get equipment statistics."""
    base_query = select(func.count(Equipment.id))

    if category and category != "general":
        base_query = base_query.join(Category).where(Category.code == category)

    total = (await db.execute(base_query)).scalar() or 0
    actif = (await db.execute(base_query.where(Equipment.status == "actif"))).scalar() or 0
    en_panne = (await db.execute(base_query.where(Equipment.status == "en_panne"))).scalar() or 0
    en_maintenance = (await db.execute(base_query.where(Equipment.status == "en_maintenance"))).scalar() or 0

    return {
        "total": total,
        "actif": actif,
        "en_panne": en_panne,
        "en_maintenance": en_maintenance,
    }


async def executor_agent(state: AgentState, db: AsyncSession) -> AgentState:
    """Execute tools based on router classification."""
    start = time.time()
    logger.info(f"Executor running for intent={state.intent}, category={state.category}")

    filters = state.filters or {}
    keyword = filters.get("keyword")
    location = filters.get("location")
    eq_status = filters.get("status")

    try:
        if state.intent == "search":
            state.raw_results = await _search_equipment(
                db, category=state.category, keyword=keyword, location=location, status=eq_status
            )
            state.source = "database"

        elif state.intent == "maintenance":
            state.raw_results = await _get_maintenance_records(db)
            state.source = "database"

        elif state.intent == "stats":
            stats = await _get_stats(db, category=state.category)
            state.raw_results = [stats]
            state.source = "database"

        elif state.intent == "documentation":
            # RAG query would go here
            state.raw_results = []
            state.rag_context = "Fonctionnalité RAG en cours d'intégration."
            state.source = "rag"

        else:
            state.raw_results = []
            state.source = "none"

    except Exception as e:
        logger.error(f"Executor error: {e}")
        state.error = str(e)

    elapsed = (time.time() - start) * 1000
    state.agents_trace.append({
        "agent": "executor",
        "source": state.source,
        "results_count": len(state.raw_results),
        "time_ms": elapsed,
    })

    return state
