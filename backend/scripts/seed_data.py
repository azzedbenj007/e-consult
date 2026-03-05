"""Seed script to populate database with initial categories and sample data."""

import asyncio
import uuid
from datetime import date, datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session, init_db
from app.core.security import hash_password
from app.models.user import User
from app.models.equipment import Category, Equipment


CATEGORIES = [
    {"name": "Electricite", "code": "electricite", "description": "Groupes electrogenes, onduleurs, TGBT, transformateurs, eclairage", "icon": "zap"},
    {"name": "Fluides Medicaux", "code": "fluides_medicaux", "description": "Oxygene, air medical, vide, protoxyde d'azote, centrales de gaz", "icon": "wind"},
    {"name": "HVAC", "code": "hvac", "description": "Climatisation, ventilation, chauffage, CTA, groupes froids", "icon": "thermometer"},
    {"name": "Plomberie", "code": "plomberie", "description": "Reseaux eau, pompes, surpresseurs, traitement eau, assainissement", "icon": "droplet"},
    {"name": "Securite Incendie", "code": "securite_incendie", "description": "Detection incendie, sprinklers, RIA, desenfumage, extincteurs", "icon": "shield"},
    {"name": "Informatique", "code": "informatique", "description": "Reseau, serveurs, telephonie, systemes d'appel", "icon": "monitor"},
]

SAMPLE_EQUIPMENT = [
    {"name": "Groupe Electrogene Principal", "category_code": "electricite", "brand": "Caterpillar", "model": "C18", "location": "Sous-sol Batiment A", "service": "Services Techniques", "status": "actif", "description": "Groupe electrogene de secours 500 kVA"},
    {"name": "Onduleur Bloc Operatoire", "category_code": "electricite", "brand": "APC", "model": "Symmetra PX 100kW", "location": "Bloc Operatoire - Local Technique", "service": "Bloc Operatoire", "status": "actif", "description": "Onduleur assurant la continuite electrique du bloc operatoire"},
    {"name": "Centrale Oxygene Medicale", "category_code": "fluides_medicaux", "brand": "Air Liquide", "model": "ALTOP", "location": "Zone Technique Exterieure", "service": "Services Techniques", "status": "actif", "description": "Centrale de production d'oxygene medical"},
    {"name": "CTA Reanimation", "category_code": "hvac", "brand": "Carrier", "model": "39HQ", "location": "Toiture Batiment B", "service": "Reanimation", "status": "actif", "description": "Centrale de traitement d'air reanimation - filtration HEPA"},
    {"name": "Groupe Froid Principal", "category_code": "hvac", "brand": "Trane", "model": "CGAM 130", "location": "Toiture Batiment A", "service": "Services Techniques", "status": "en_maintenance", "description": "Groupe froid a condensation par air 130 kW"},
    {"name": "Surpresseur Eau", "category_code": "plomberie", "brand": "Grundfos", "model": "Hydro MPC-E", "location": "Sous-sol Batiment C", "service": "Services Techniques", "status": "actif", "description": "Station de surpression eau potable"},
    {"name": "Centrale Detection Incendie", "category_code": "securite_incendie", "brand": "Siemens", "model": "Cerberus PRO", "location": "PC Securite", "service": "Securite", "status": "actif", "description": "Centrale de detection incendie adressable - 8 boucles"},
    {"name": "Baie Serveurs Principal", "category_code": "informatique", "brand": "Dell", "model": "PowerEdge R750", "location": "Salle Serveurs - Batiment A", "service": "DSI", "status": "actif", "description": "Serveur principal hebergeant les applications hospitaliere"},
]


async def seed():
    await init_db()

    async with async_session() as db:
        # Create admin user
        admin = User(
            username="admin",
            email="admin@nova-eqp.local",
            password_hash=hash_password("Admin@2026!"),
            full_name="Administrateur NOVA",
            role="admin",
            service="Services Techniques",
        )
        db.add(admin)

        # Create sample users
        users = [
            User(username="technicien1", email="tech1@nova-eqp.local", password_hash=hash_password("Tech@2026!"), full_name="Ahmed Technicien", role="technicien", service="Services Techniques"),
            User(username="ingenieur1", email="ing1@nova-eqp.local", password_hash=hash_password("Ing@2026!"), full_name="Fatima Ingenieur", role="ingenieur", service="Services Techniques"),
            User(username="chef1", email="chef1@nova-eqp.local", password_hash=hash_password("Chef@2026!"), full_name="Mohamed Chef Service", role="chef_service", service="Services Techniques"),
        ]
        for u in users:
            db.add(u)

        # Create categories
        cat_map = {}
        for cat_data in CATEGORIES:
            cat = Category(**cat_data)
            db.add(cat)
            await db.flush()
            cat_map[cat_data["code"]] = cat.id

        # Create sample equipment
        for eq_data in SAMPLE_EQUIPMENT:
            category_code = eq_data.pop("category_code")
            eq = Equipment(
                **eq_data,
                category_id=cat_map[category_code],
                installation_date=date(2023, 1, 15),
                last_maintenance=date(2025, 12, 1),
                next_maintenance=date(2026, 6, 1),
            )
            db.add(eq)

        await db.commit()
        print("Database seeded successfully!")
        print(f"  - {len(CATEGORIES)} categories")
        print(f"  - {len(SAMPLE_EQUIPMENT)} equipment items")
        print(f"  - 4 users (admin/technicien1/ingenieur1/chef1)")


if __name__ == "__main__":
    asyncio.run(seed())
