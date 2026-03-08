"""Equipment management routes."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.equipment import Equipment, Category
from app.api.schemas import EquipmentCreate, EquipmentResponse

router = APIRouter(prefix="/equipment", tags=["equipment"])


@router.get("", response_model=list[EquipmentResponse])
async def list_equipment(
    category: str = Query(None),
    location: str = Query(None),
    status: str = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List equipment with optional filters."""
    query = select(Equipment).outerjoin(Category)

    if category:
        query = query.where(Category.code == category)
    if location:
        query = query.where(Equipment.location.ilike(f"%{location}%"))
    if status:
        query = query.where(Equipment.status == status)

    query = query.order_by(Equipment.name).offset(offset).limit(limit)
    result = await db.execute(query)

    return [
        EquipmentResponse(
            id=str(eq.id), name=eq.name, brand=eq.brand, model=eq.model,
            serial_number=eq.serial_number, location=eq.location, service=eq.service,
            status=eq.status, installation_date=eq.installation_date,
            last_maintenance=eq.last_maintenance, next_maintenance=eq.next_maintenance,
            description=eq.description, specifications=eq.specifications,
            follow_up_link=eq.follow_up_link,
        )
        for eq in result.scalars().all()
    ]


@router.get("/search", response_model=list[EquipmentResponse])
async def search_equipment(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Full-text search on equipment."""
    search = f"%{q}%"
    query = (
        select(Equipment)
        .where(
            or_(
                Equipment.name.ilike(search),
                Equipment.description.ilike(search),
                Equipment.brand.ilike(search),
                Equipment.model.ilike(search),
            )
        )
        .limit(limit)
    )
    result = await db.execute(query)

    return [
        EquipmentResponse(
            id=str(eq.id), name=eq.name, brand=eq.brand, model=eq.model,
            serial_number=eq.serial_number, location=eq.location, service=eq.service,
            status=eq.status, installation_date=eq.installation_date,
            last_maintenance=eq.last_maintenance, next_maintenance=eq.next_maintenance,
            description=eq.description, specifications=eq.specifications,
            follow_up_link=eq.follow_up_link,
        )
        for eq in result.scalars().all()
    ]


@router.get("/{equipment_id}", response_model=EquipmentResponse)
async def get_equipment(
    equipment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get equipment details by ID."""
    try:
        eq_uuid = uuid.UUID(equipment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID invalide")

    result = await db.execute(select(Equipment).where(Equipment.id == eq_uuid))
    eq = result.scalar_one_or_none()
    if not eq:
        raise HTTPException(status_code=404, detail="Équipement non trouvé")

    return EquipmentResponse(
        id=str(eq.id), name=eq.name, brand=eq.brand, model=eq.model,
        serial_number=eq.serial_number, location=eq.location, service=eq.service,
        status=eq.status, installation_date=eq.installation_date,
        last_maintenance=eq.last_maintenance, next_maintenance=eq.next_maintenance,
        description=eq.description, specifications=eq.specifications,
        follow_up_link=eq.follow_up_link,
    )


@router.post("", response_model=EquipmentResponse)
async def create_equipment(
    req: EquipmentCreate,
    current_user: User = Depends(require_role("ingenieur", "chef_service", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Create new equipment (ingenieur+ role required)."""
    eq = Equipment(**req.model_dump(exclude_none=True))
    db.add(eq)
    await db.flush()

    return EquipmentResponse(
        id=str(eq.id), name=eq.name, brand=eq.brand, model=eq.model,
        serial_number=eq.serial_number, location=eq.location, service=eq.service,
        status=eq.status, installation_date=eq.installation_date,
        last_maintenance=eq.last_maintenance, next_maintenance=eq.next_maintenance,
        description=eq.description, specifications=eq.specifications,
        follow_up_link=eq.follow_up_link,
    )
