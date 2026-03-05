"""Equipment query tool for LangChain integration."""

from typing import Optional

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.equipment import Equipment, Category


async def query_equipment(
    db: AsyncSession,
    category: Optional[str] = None,
    location: Optional[str] = None,
    keyword: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20,
) -> list[dict]:
    """Query equipment from PostgreSQL with filters.

    This replaces the GoogleSheetTool approach with proper SQL queries.
    """
    query = select(Equipment).outerjoin(Category)

    conditions = []

    if category and category != "general":
        conditions.append(Category.code == category)

    if keyword:
        search = f"%{keyword}%"
        conditions.append(
            or_(
                Equipment.name.ilike(search),
                Equipment.description.ilike(search),
                Equipment.brand.ilike(search),
                Equipment.model.ilike(search),
                Equipment.serial_number.ilike(search),
            )
        )

    if location:
        conditions.append(Equipment.location.ilike(f"%{location}%"))

    if status:
        conditions.append(Equipment.status == status)

    for condition in conditions:
        query = query.where(condition)

    query = query.order_by(Equipment.name).limit(limit)

    result = await db.execute(query)
    equipment_list = result.scalars().all()

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
            "installation_date": str(eq.installation_date) if eq.installation_date else None,
            "last_maintenance": str(eq.last_maintenance) if eq.last_maintenance else None,
            "next_maintenance": str(eq.next_maintenance) if eq.next_maintenance else None,
            "description": eq.description,
            "specifications": eq.specifications,
            "follow_up_link": eq.follow_up_link,
        }
        for eq in equipment_list
    ]
