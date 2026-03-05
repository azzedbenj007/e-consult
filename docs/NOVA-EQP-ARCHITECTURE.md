# NOVA-EQP — Plateforme Agentique Hospitalière

## Vue d'ensemble

NOVA-EQP est une plateforme agentique hospitalière structurée qui transforme un simple workflow n8n en une application web autonome, scalable et sécurisée pour la gestion intelligente des équipements biomédicaux.

---

## 1. Architecture Globale

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │   Chat    │ │Dashboard │ │Historique│ │  Export PDF │ │
│  │Interface  │ │   KPI    │ │Recherches│ │  / Rapports│ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
│          Auth JWT + RBAC (Technicien/Ingénieur/Chef)    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / WebSocket
                         ▼
┌─────────────────────────────────────────────────────────┐
│                 API BACKEND (FastAPI)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │   Auth    │ │   Chat   │ │Equipment │ │   Audit    │ │
│  │  Routes   │ │  Routes  │ │  Routes  │ │   Routes   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
│              Rate Limiting + Journalisation              │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│           AGENT ORCHESTRATOR (LangGraph)                 │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│  │  Agent 1  │───▶│  Agent 2  │───▶│  Agent 3  │        │
│  │  Router   │    │ Executor  │    │ Validator │        │
│  └──────────┘    └──────────┘    └──────────┘          │
│       │                                    │            │
│       │              ┌──────────┐          │            │
│       └──────────────│  Agent 4  │◀────────┘            │
│                      │ Formatter │                      │
│                      └──────────┘                       │
│                                                          │
│  State Machine: Router → Executor → Validator → Format  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    TOOL LAYER                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │  Query    │ │  Search  │ │   RAG    │ │  External  │ │
│  │Equipment  │ │Maintenance│ │Documents │ │   APIs     │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    DATA LAYER                            │
│  ┌──────────────┐ ┌──────────┐ ┌───────────────────┐   │
│  │  PostgreSQL   │ │  Redis   │ │  ChromaDB         │   │
│  │  (Structured) │ │ (Cache)  │ │  (Vector Store)   │   │
│  │               │ │          │ │                    │   │
│  │ - equipment   │ │ - Session│ │ - Manuels PDF     │   │
│  │ - categories  │ │ - Memory │ │ - Fiches tech     │   │
│  │ - maintenance │ │ - Rate   │ │ - Rapports        │   │
│  │ - audit_logs  │ │   limits │ │ - CPS             │   │
│  │ - users       │ │          │ │                    │   │
│  └──────────────┘ └──────────┘ └───────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Stack Technologique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Frontend | Next.js 14+ (App Router) | SSR, TypeScript, performance |
| Backend API | FastAPI (Python) | Async, écosystème AI mature |
| Agent Orchestrator | LangGraph | State machine agentique |
| Base de données | PostgreSQL 16 | Robuste, full-text search |
| Cache/Mémoire | Redis | Session, rate limiting |
| Vector Store | ChromaDB | RAG, embeddings documents |
| Auth | JWT + bcrypt | Sécurité hospitalière |
| Déploiement | Docker Compose | On-premise compatible |

---

## 3. Architecture Multi-Agents

### Agent 1 — Router (Routeur d'intention)

**Rôle :**
- Détecter l'intention de l'utilisateur (recherche, maintenance, statistiques, documentation)
- Identifier la catégorie d'équipement (électricité, fluides médicaux, HVAC, etc.)
- Structurer la requête pour l'Agent Executor

**Entrée :** Message brut de l'utilisateur
**Sortie :** `{ intent, category, filters, confidence }`

### Agent 2 — Tool Executor (Exécuteur)

**Rôle :**
- Interroger la source de données appropriée (PostgreSQL, RAG)
- Appliquer les filtres structurés
- Nettoyer et normaliser les résultats

**Entrée :** Requête structurée du Router
**Sortie :** Données brutes filtrées

### Agent 3 — Validator (Validateur)

**Rôle :**
- Vérifier la cohérence des résultats
- Détecter et rejeter les hallucinations
- Appliquer les règles métier strictes (VGS hospitalier)
- Vérifier que les données correspondent à la requête

**Entrée :** Données brutes + requête originale
**Sortie :** Données validées ou signal d'erreur

### Agent 4 — Formatter (Formateur)

**Rôle :**
- Appliquer le style de réponse NOVA strict
- Limiter à 200 mots maximum
- Numérotation structurée
- Format hospitalier professionnel

**Entrée :** Données validées
**Sortie :** Réponse formatée finale

### Flux LangGraph (State Machine)

```
START → Router → Executor → Validator ─┬─→ Formatter → END
                                        │
                                        └─→ (retry/error) → Router
```

---

## 4. Modèle de Données PostgreSQL

### Table `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('technicien', 'ingenieur', 'chef_service', 'admin')),
    service VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table `categories`
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50)
);
-- Ex: electricite, fluides_medicaux, hvac, plomberie, securite_incendie
```

### Table `equipment`
```sql
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    location VARCHAR(255),
    service VARCHAR(100),
    status VARCHAR(50) DEFAULT 'actif',
    installation_date DATE,
    last_maintenance DATE,
    next_maintenance DATE,
    description TEXT,
    specifications JSONB,
    image_urls TEXT[],
    follow_up_link TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_equipment_category ON equipment(category_id);
CREATE INDEX idx_equipment_location ON equipment(location);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_fulltext ON equipment USING gin(to_tsvector('french', name || ' ' || COALESCE(description, '')));
```

### Table `maintenance_records`
```sql
CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('preventive', 'corrective', 'urgente')),
    description TEXT NOT NULL,
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP NOT NULL,
    next_due DATE,
    cost DECIMAL(10,2),
    parts_used JSONB,
    status VARCHAR(50) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Table `conversations`
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table `messages`
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Table `audit_logs`
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

---

## 5. Sécurité (Environnement Hospitalier)

### Authentification & Autorisation
- **JWT** avec refresh tokens (access: 15min, refresh: 7j)
- **bcrypt** pour le hashing des mots de passe
- **RBAC** strict :
  - `technicien` : lecture équipements, chat
  - `ingenieur` : lecture/écriture, rapports, mode expert
  - `chef_service` : tout + gestion utilisateurs service
  - `admin` : accès complet + audit

### Protection API
- Rate limiting par utilisateur (Redis)
- Validation stricte des entrées (Pydantic)
- Requêtes SQL paramétrées (SQLAlchemy)
- CORS configuré strictement
- Headers de sécurité (HSTS, CSP, X-Frame-Options)

### Journalisation
- Chaque requête API est loguée
- Chaque interaction agent est tracée
- Audit trail complet : qui, quoi, quand, résultat

### Déploiement
- Docker Compose pour isolation
- HTTPS obligatoire (Let's Encrypt ou certificat hospitalier)
- Réseau interne isolé possible
- Backups PostgreSQL automatisés

---

## 6. RAG — Retrieval Augmented Generation

### Sources indexées
- Manuels PDF des équipements
- Fiches techniques constructeurs
- Rapports de maintenance historiques
- Cahiers des Prescriptions Spéciales (CPS)
- Procédures internes

### Pipeline RAG
```
Document → Chunking (500 tokens) → Embedding (OpenAI/local) → ChromaDB
                                                                    │
User Query → Embedding → Similarity Search ────────────────────────┘
                                    │
                              Top-K chunks → Agent Context → Réponse
```

### Avantage
NOVA-EQP devient un **expert documentaire réel** capable de répondre à des questions techniques en s'appuyant sur la documentation officielle.

---

## 7. Plan de Migration

| Phase | Description | Durée estimée |
|-------|-------------|---------------|
| Phase 1 | Extraction logique agent + prompt engineering | Semaine 1 |
| Phase 2 | Backend FastAPI + LangGraph + agents | Semaine 2-3 |
| Phase 3 | Migration données Sheets → PostgreSQL | Semaine 3 |
| Phase 4 | Frontend Next.js + intégration API | Semaine 4-5 |
| Phase 5 | RAG + vector store + documents | Semaine 5-6 |
| Phase 6 | Sécurité, audit, tests | Semaine 6-7 |
| Phase 7 | Déploiement Docker (VPS/on-premise) | Semaine 7-8 |
| Phase 8 | Formation + documentation utilisateur | Semaine 8 |

---

## 8. Stratégie Multi-LLM

```
┌──────────────┐
│  LLM Router  │
├──────────────┤
│ GPT-4.1      │ ← Raisonnement complexe (défaut)
│ Claude Opus  │ ← Analyse documentaire
│ Mistral      │ ← Déploiement local/interne
│ Fallback     │ ← Rotation automatique si erreur
└──────────────┘
```

Configuration par fichier `.env` :
```
PRIMARY_LLM=openai/gpt-4.1
SECONDARY_LLM=anthropic/claude-opus-4-6
LOCAL_LLM=mistral/mistral-large
FALLBACK_ENABLED=true
```

---

## 9. Fonctionnalités Frontend

### Chat Interface
- Conversation en temps réel avec NOVA
- Historique persistant
- Suggestions de questions
- Indicateur de confiance sur les réponses

### Dashboard KPI
- Nombre d'équipements par catégorie
- Taux de maintenance préventive
- Équipements en panne
- Prochaines maintenances planifiées

### Mode Expert
- Prévisualisation SQL des requêtes
- Accès aux données brutes
- Filtres avancés

### Export & Rapports
- Export PDF des résultats
- Rapports de maintenance
- Statistiques d'utilisation

---

## 10. Endpoints API Principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login` | Authentification |
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/chat/message` | Envoyer message à NOVA |
| GET | `/api/chat/conversations` | Liste conversations |
| GET | `/api/chat/conversations/{id}` | Détail conversation |
| GET | `/api/equipment` | Liste équipements |
| GET | `/api/equipment/{id}` | Détail équipement |
| POST | `/api/equipment` | Ajouter équipement |
| GET | `/api/equipment/search` | Recherche full-text |
| GET | `/api/maintenance` | Historique maintenance |
| POST | `/api/maintenance` | Enregistrer maintenance |
| GET | `/api/dashboard/stats` | KPI dashboard |
| GET | `/api/audit/logs` | Logs d'audit |
| POST | `/api/rag/upload` | Upload document RAG |
| POST | `/api/rag/query` | Requête RAG |

---

## 11. Variables d'Environnement

```env
# Application
APP_NAME=NOVA-EQP
APP_ENV=production
SECRET_KEY=your-secret-key-here
DEBUG=false

# Database
DATABASE_URL=postgresql://nova:password@db:5432/nova_eqp
REDIS_URL=redis://redis:6379/0

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
MISTRAL_API_KEY=...
PRIMARY_LLM=openai/gpt-4.1

# ChromaDB
CHROMA_HOST=chromadb
CHROMA_PORT=8000

# Auth
JWT_SECRET=your-jwt-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
ALLOWED_ORIGINS=https://nova-eqp.hospital.local
```

---

## 12. Scalabilité

### Version "Projet Interne Discret"
- Déploiement Docker single-server
- PostgreSQL + Redis sur même machine
- 1 instance FastAPI
- Adapté pour un CHU

### Version "Plateforme Nationale Industrialisable"
- Kubernetes pour orchestration
- PostgreSQL en cluster (patroni)
- Redis Sentinel
- Load balancer (nginx/traefik)
- Multi-tenant par établissement
- API Gateway centralisée
- Monitoring (Prometheus + Grafana)

---

*Document généré pour le projet NOVA-EQP — Architecture Agentique Hospitalière*
*Version 1.0 — Mars 2026*
