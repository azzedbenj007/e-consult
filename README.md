# E-Consult — Plateforme de Téléconsultation Médicale

> Plateforme web complète de santé numérique avec téléconsultation vidéo WebRTC, gestion de dossiers médicaux, ordonnances PDF et paiement en ligne.

[![CI/CD](https://github.com/your-org/e-consult/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-org/e-consult/actions)

## Démarrage rapide

### Prérequis

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15 (ou via Docker)

### 1. Installation

```bash
# Cloner le projet
git clone https://github.com/your-org/e-consult.git
cd e-consult

# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés API
```

### 2. Démarrage avec Docker (recommandé)

```bash
docker compose up -d
```

L'application sera disponible sur :
- **Frontend** : http://localhost:3000
- **API** : http://localhost:3001/api
- **Swagger** : http://localhost:3001/api/docs

### 3. Démarrage en développement

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# Frontend (nouveau terminal)
cd frontend
npm install
npm run dev
```

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@e-consult.ma | Admin@1234 |
| Médecin | dr.benali@e-consult.ma | Doctor@1234 |
| Patient | patient@e-consult.ma | Patient@1234 |

## Documentation

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour la documentation technique complète.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14 + Tailwind CSS |
| Backend | NestJS + TypeScript |
| BDD | PostgreSQL + Prisma ORM |
| Cache | Redis |
| Vidéo | WebRTC + Socket.io |
| Paiement | Stripe |
| Auth | JWT + 2FA (TOTP) |
| PDF | PDFKit |
| Déploiement | Docker + Nginx |

## Licence

Propriétaire — Tous droits réservés.