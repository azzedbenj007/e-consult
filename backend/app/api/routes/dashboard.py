"""Dashboard KPI routes."""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.equipment import Equipment, Category, MaintenanceRecord
from app.api.schemas import DashboardStatsResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard KPIs."""
    # Total counts
    total = (await db.execute(select(func.count(Equipment.id)))).scalar() or 0
    active = (await db.execute(
        select(func.count(Equipment.id)).where(Equipment.status == "actif")
    )).scalar() or 0
    broken = (await db.execute(
        select(func.count(Equipment.id)).where(Equipment.status == "en_panne")
    )).scalar() or 0
    in_maintenance = (await db.execute(
        select(func.count(Equipment.id)).where(Equipment.status == "en_maintenance")
    )).scalar() or 0

    # By category
    cat_result = await db.execute(
        select(Category.name, Category.code, func.count(Equipment.id))
        .outerjoin(Equipment)
        .group_by(Category.id)
        .order_by(func.count(Equipment.id).desc())
    )
    categories = [
        {"name": name, "code": code, "count": count}
        for name, code, count in cat_result.all()
    ]

    # Upcoming maintenance
    upcoming_result = await db.execute(
        select(Equipment.name, Equipment.next_maintenance, Equipment.location)
        .where(Equipment.next_maintenance.isnot(None))
        .order_by(Equipment.next_maintenance)
        .limit(10)
    )
    upcoming = [
        {"name": name, "next_maintenance": str(dt), "location": loc}
        for name, dt, loc in upcoming_result.all()
    ]

    return DashboardStatsResponse(
        total_equipment=total,
        active=active,
        broken=broken,
        in_maintenance=in_maintenance,
        categories=categories,
        upcoming_maintenance=upcoming,
    )
