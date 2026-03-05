# E-Consult — Plateforme de Téléconsultation Médicale

> Documentation technique complète — Version MVP + Roadmap Entreprise

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture globale](#2-architecture-globale)
3. [Modèle de base de données](#3-modèle-de-base-de-données)
4. [Modules Backend (NestJS)](#4-modules-backend-nestjs)
5. [Frontend (Next.js)](#5-frontend-nextjs)
6. [Module Téléconsultation WebRTC](#6-module-téléconsultation-webrtc)
7. [Sécurité & Conformité](#7-sécurité--conformité)
8. [Infrastructure & Déploiement](#8-infrastructure--déploiement)
9. [API Reference](#9-api-reference)
10. [Diagrammes](#10-diagrammes)
11. [Roadmap](#11-roadmap)

---

## 1. Vue d'ensemble

### Objectif

E-Consult est une plateforme web de santé numérique permettant :

| Fonctionnalité | Description |
|---|---|
| Prise de RDV en ligne | Planification intelligente selon spécialité et disponibilité |
| Téléconsultation vidéo | Appel sécurisé WebRTC peer-to-peer |
| Messagerie médicale | Communication chiffrée patient ↔ médecin |
| Dossier médical électronique | Stockage, partage et historique des données médicales |
| Prescription numérique | Ordonnances PDF signées électroniquement |
| Paiement en ligne | Paiement sécurisé via Stripe |
| Administration | Tableau de bord complet de gestion |

### Acteurs du système

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   PATIENT   │    │   MÉDECIN   │    │    ADMIN    │
│             │    │             │    │             │
│ • Prendre   │    │ • Agenda    │    │ • Valider   │
│   RDV       │    │ • Dossiers  │    │   médecins  │
│ • Consulter │    │ • Prescrire │    │ • Gérer     │
│ • Payer     │    │ • Facturer  │    │   plateforme│
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## 2. Architecture globale

### Schéma d'architecture

```
                          ┌─────────────────────────────────────────┐
                          │              INTERNET                    │
                          └──────────────────┬──────────────────────┘
                                             │ HTTPS / WSS
                          ┌──────────────────▼──────────────────────┐
                          │        CLOUDFLARE CDN / WAF             │
                          │    (DDoS protection, SSL termination)   │
                          └──────────────────┬──────────────────────┘
                                             │
                          ┌──────────────────▼──────────────────────┐
                          │           NGINX (Reverse Proxy)         │
                          │        SSL Let's Encrypt                │
                          └───┬──────────────┬───────────────┬──────┘
                              │              │               │
               ┌──────────────▼──┐  ┌────────▼────────┐  ┌──▼──────────────┐
               │  Next.js App    │  │  NestJS API     │  │  Socket.io      │
               │  (Port 3000)    │  │  (Port 3001)    │  │  Server         │
               │  Frontend SSR   │  │  REST API       │  │  (Port 3002)    │
               └─────────────────┘  └────────┬────────┘  └──┬──────────────┘
                                             │               │
                          ┌──────────────────▼───────────────▼──────┐
                          │              Redis (Cache + Sessions)   │
                          │              Port 6379                  │
                          └──────────────────────────────────────────┘
                                             │
                          ┌──────────────────▼──────────────────────┐
                          │           PostgreSQL Database           │
                          │              Port 5432                  │
                          └──────────────────────────────────────────┘
                                             │
                    ┌────────────────────────▼─────────────────────────────┐
                    │                  SERVICES EXTERNES                   │
                    │                                                      │
                    │  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
                    │  │  Stripe  │  │  Twilio  │  │  STUN/TURN Server  │ │
                    │  │ Paiement │  │ SMS/Email│  │  (Coturn)          │ │
                    │  └──────────┘  └──────────┘  └────────────────────┘ │
                    └──────────────────────────────────────────────────────┘
```

### Stack technique

| Couche | Technologie | Version | Justification |
|---|---|---|---|
| Frontend | Next.js | 14.x | SSR, SEO, performance |
| UI Kit | Tailwind CSS + shadcn/ui | Latest | Design system cohérent |
| State | Zustand + React Query | Latest | Légèreté + server state |
| Backend | NestJS | 10.x | Modulaire, TypeScript, enterprise |
| ORM | Prisma | 5.x | Type-safe, migrations |
| Base de données | PostgreSQL | 15.x | ACID, JSON, extensions médicales |
| Cache | Redis | 7.x | Sessions, queues, pub/sub |
| Temps réel | Socket.io | 4.x | WebSocket bidirectionnel |
| Vidéo | WebRTC + PeerJS | Latest | P2P chiffré |
| TURN Server | Coturn | Latest | NAT traversal |
| Paiement | Stripe | Latest | PCI-DSS compliant |
| Auth | Passport.js + JWT | Latest | Standards OAuth2 |
| 2FA | Speakeasy (TOTP) | Latest | Google Authenticator |
| Email | Nodemailer + SendGrid | Latest | Transactionnel |
| PDF | PDFKit | Latest | Ordonnances |
| Docker | Docker + Compose | Latest | Conteneurisation |
| CI/CD | GitHub Actions | Latest | Automatisation |

---

## 3. Modèle de base de données

### Diagramme ERD

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         SCHÉMA DE BASE DE DONNÉES                       │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌─────────────────────┐
│      users      │         │      doctors        │
├─────────────────┤         ├─────────────────────┤
│ id (UUID) PK   │────┐    │ id (UUID) PK        │
│ email UNIQUE   │    │    │ userId FK ──────────┼──► users
│ password_hash  │    │    │ specialityId FK     │
│ first_name     │    │    │ license_number      │
│ last_name      │    │    │ bio                 │
│ phone          │    │    │ consultation_fee    │
│ date_of_birth  │    │    │ is_verified         │
│ gender         │    │    │ rating              │
│ role           │    └───►│ total_consultations │
│ avatar_url     │         │ available_days[]    │
│ is_active      │         │ created_at          │
│ is_verified    │         └──────────┬──────────┘
│ 2fa_enabled    │                    │
│ 2fa_secret     │         ┌──────────▼──────────┐
│ created_at     │         │     specialities    │
│ updated_at     │         ├─────────────────────┤
└────────┬────────┘         │ id (UUID) PK        │
         │                 │ name                │
         │                 │ description         │
         │                 │ icon_url            │
         │                 └─────────────────────┘
         │
         │    ┌─────────────────────┐
         │    │      patients       │
         │    ├─────────────────────┤
         └───►│ id (UUID) PK        │
              │ userId FK           │
              │ blood_type          │
              │ allergies[]         │
              │ chronic_conditions[]│
              │ emergency_contact   │
              │ insurance_number    │
              └──────────┬──────────┘
                         │
         ┌───────────────┼───────────────────────┐
         │               │                       │
┌────────▼────────┐ ┌────▼────────────┐ ┌────────▼────────┐
│  appointments   │ │ medical_records │ │    messages     │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ id (UUID) PK   │ │ id (UUID) PK    │ │ id (UUID) PK    │
│ patientId FK   │ │ patientId FK    │ │ senderId FK     │
│ doctorId FK    │ │ doctorId FK     │ │ receiverId FK   │
│ specialityId   │ │ appointmentId   │ │ appointmentId   │
│ scheduled_at   │ │ chief_complaint │ │ content         │
│ duration_min   │ │ diagnosis       │ │ is_read         │
│ status         │ │ notes           │ │ attachment_url  │
│ type (video/..│ │ vitals (JSON)   │ │ created_at      │
│ room_id        │ │ attachments[]   │ │ updated_at      │
│ video_url      │ │ is_confidential │ └─────────────────┘
│ notes          │ │ access_log[]    │
│ payment_status │ │ created_at      │
│ amount         │ │ updated_at      │
│ created_at     │ └────────┬────────┘
│ updated_at     │          │
└────────┬────────┘          │
         │         ┌─────────▼────────┐
         │         │  prescriptions   │
         │         ├──────────────────┤
         │         │ id (UUID) PK     │
         └────────►│ appointmentId FK │
                   │ patientId FK     │
                   │ doctorId FK      │
                   │ medications[]    │
                   │ instructions     │
                   │ validity_days    │
                   │ pdf_url          │
                   │ is_signed        │
                   │ created_at       │
                   └─────────────────┘

┌─────────────────┐         ┌─────────────────────┐
│    payments     │         │    audit_logs       │
├─────────────────┤         ├─────────────────────┤
│ id (UUID) PK   │         │ id (UUID) PK        │
│ appointmentId  │         │ userId FK           │
│ patientId FK   │         │ action              │
│ doctorId FK    │         │ resource            │
│ amount         │         │ resource_id         │
│ currency       │         │ ip_address          │
│ status         │         │ user_agent          │
│ stripe_id      │         │ metadata (JSON)     │
│ method         │         │ created_at          │
│ receipt_url    │         └─────────────────────┘
│ refund_amount  │
│ created_at     │         ┌─────────────────────┐
└─────────────────┘         │  availabilities     │
                            ├─────────────────────┤
                            │ id (UUID) PK        │
                            │ doctorId FK         │
                            │ day_of_week (0-6)   │
                            │ start_time          │
                            │ end_time            │
                            │ is_active           │
                            └─────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   ÉNUMÉRATIONS                      │
├──────────────────┬──────────────────────────────────┤
│ UserRole         │ PATIENT, DOCTOR, ADMIN            │
│ AppointmentStatus│ PENDING, CONFIRMED, CANCELLED,    │
│                  │ COMPLETED, NO_SHOW                │
│ AppointmentType  │ VIDEO, IN_PERSON, PHONE           │
│ PaymentStatus    │ PENDING, PAID, REFUNDED, FAILED   │
│ Gender           │ MALE, FEMALE, OTHER               │
│ BloodType        │ A+, A-, B+, B-, AB+, AB-, O+, O- │
└──────────────────┴──────────────────────────────────┘
```

---

## 4. Modules Backend (NestJS)

### Structure des modules

```
backend/src/
├── app.module.ts
├── main.ts
│
├── auth/                          # Authentification
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   ├── local.strategy.ts
│   │   └── refresh-token.strategy.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── two-factor.guard.ts
│   └── dto/
│       ├── login.dto.ts
│       ├── register.dto.ts
│       └── two-factor.dto.ts
│
├── users/                         # Gestion utilisateurs
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
│
├── doctors/                       # Profils médecins
│   ├── doctors.module.ts
│   ├── doctors.controller.ts
│   ├── doctors.service.ts
│   └── dto/
│
├── patients/                      # Profils patients
│   ├── patients.module.ts
│   ├── patients.controller.ts
│   ├── patients.service.ts
│   └── dto/
│
├── appointments/                  # Rendez-vous
│   ├── appointments.module.ts
│   ├── appointments.controller.ts
│   ├── appointments.service.ts
│   └── dto/
│
├── medical-records/               # Dossiers médicaux
│   ├── medical-records.module.ts
│   ├── medical-records.controller.ts
│   ├── medical-records.service.ts
│   └── dto/
│
├── prescriptions/                 # Ordonnances
│   ├── prescriptions.module.ts
│   ├── prescriptions.controller.ts
│   ├── prescriptions.service.ts
│   └── dto/
│
├── payments/                      # Paiements Stripe
│   ├── payments.module.ts
│   ├── payments.controller.ts
│   ├── payments.service.ts
│   └── dto/
│
├── messages/                      # Messagerie
│   ├── messages.module.ts
│   ├── messages.controller.ts
│   ├── messages.service.ts
│   └── dto/
│
├── notifications/                 # Notifications
│   ├── notifications.module.ts
│   ├── notifications.service.ts
│   └── templates/
│
├── teleconsultation/              # WebRTC + Signaling
│   ├── teleconsultation.module.ts
│   ├── teleconsultation.gateway.ts
│   └── teleconsultation.service.ts
│
├── audit/                         # Logs d'audit
│   ├── audit.module.ts
│   ├── audit.service.ts
│   └── audit.interceptor.ts
│
├── admin/                         # Administration
│   ├── admin.module.ts
│   ├── admin.controller.ts
│   └── admin.service.ts
│
├── upload/                        # Upload fichiers
│   ├── upload.module.ts
│   └── upload.service.ts
│
├── specialities/                  # Spécialités médicales
│   ├── specialities.module.ts
│   ├── specialities.controller.ts
│   └── specialities.service.ts
│
└── common/                        # Utilitaires partagés
    ├── decorators/
    ├── filters/
    ├── interceptors/
    ├── pipes/
    └── utils/
```

### Endpoints API principaux

```
AUTH
POST   /api/auth/register          Inscription
POST   /api/auth/login             Connexion
POST   /api/auth/refresh           Refresh token
POST   /api/auth/logout            Déconnexion
POST   /api/auth/2fa/enable        Activer 2FA
POST   /api/auth/2fa/verify        Vérifier code 2FA
POST   /api/auth/forgot-password   Mot de passe oublié
POST   /api/auth/reset-password    Réinitialiser mot de passe

USERS
GET    /api/users/me               Profil actuel
PATCH  /api/users/me               Modifier profil
DELETE /api/users/me               Supprimer compte

DOCTORS
GET    /api/doctors                Liste médecins (filtres)
GET    /api/doctors/:id            Profil médecin
GET    /api/doctors/:id/slots      Créneaux disponibles
PATCH  /api/doctors/profile        Modifier profil médecin
POST   /api/doctors/availability   Gérer disponibilités

APPOINTMENTS
GET    /api/appointments           Mes rendez-vous
POST   /api/appointments           Créer RDV
GET    /api/appointments/:id       Détail RDV
PATCH  /api/appointments/:id       Modifier RDV
DELETE /api/appointments/:id       Annuler RDV
POST   /api/appointments/:id/join  Rejoindre la salle vidéo

MEDICAL RECORDS
GET    /api/medical-records        Mes dossiers
POST   /api/medical-records        Créer dossier
GET    /api/medical-records/:id    Détail dossier
PATCH  /api/medical-records/:id    Modifier dossier

PRESCRIPTIONS
GET    /api/prescriptions          Mes ordonnances
POST   /api/prescriptions          Créer ordonnance
GET    /api/prescriptions/:id      Détail ordonnance
GET    /api/prescriptions/:id/pdf  Télécharger PDF

PAYMENTS
POST   /api/payments/intent        Créer PaymentIntent Stripe
POST   /api/payments/confirm       Confirmer paiement
GET    /api/payments/history       Historique paiements
POST   /api/payments/refund/:id    Rembourser

MESSAGES
GET    /api/messages/conversations Liste conversations
GET    /api/messages/:userId       Messages avec un utilisateur
POST   /api/messages               Envoyer message

ADMIN
GET    /api/admin/dashboard        Statistiques globales
GET    /api/admin/doctors/pending  Médecins en attente
PATCH  /api/admin/doctors/:id/verify  Valider médecin
GET    /api/admin/users            Liste utilisateurs
GET    /api/admin/payments         Toutes les transactions
```

---

## 5. Frontend (Next.js)

### Structure des pages

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── two-factor/page.tsx
│   │
│   ├── (patient)/
│   │   ├── dashboard/page.tsx
│   │   ├── doctors/
│   │   │   ├── page.tsx              # Liste médecins
│   │   │   └── [id]/page.tsx         # Profil médecin
│   │   ├── appointments/
│   │   │   ├── page.tsx              # Mes RDV
│   │   │   ├── new/page.tsx          # Nouveau RDV
│   │   │   └── [id]/page.tsx         # Détail RDV
│   │   ├── consultation/
│   │   │   └── [roomId]/page.tsx     # Salle vidéo
│   │   ├── medical-records/page.tsx
│   │   ├── prescriptions/page.tsx
│   │   ├── messages/page.tsx
│   │   └── profile/page.tsx
│   │
│   ├── (doctor)/
│   │   ├── dashboard/page.tsx
│   │   ├── agenda/page.tsx
│   │   ├── patients/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── consultation/
│   │   │   └── [roomId]/page.tsx
│   │   ├── prescriptions/
│   │   │   ├── page.tsx
│   │   │   └── new/page.tsx
│   │   ├── messages/page.tsx
│   │   └── profile/page.tsx
│   │
│   ├── (admin)/
│   │   ├── dashboard/page.tsx
│   │   ├── doctors/page.tsx
│   │   ├── patients/page.tsx
│   │   ├── payments/page.tsx
│   │   ├── specialities/page.tsx
│   │   └── settings/page.tsx
│   │
│   └── api/                          # Next.js API routes proxy
│
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── appointments/
│   │   ├── AppointmentCard.tsx
│   │   ├── BookingCalendar.tsx
│   │   └── TimeSlotPicker.tsx
│   ├── consultation/
│   │   ├── VideoRoom.tsx             # Composant vidéo principal
│   │   ├── VideoControls.tsx
│   │   ├── ChatPanel.tsx
│   │   └── WaitingRoom.tsx
│   ├── medical-records/
│   ├── prescriptions/
│   ├── messages/
│   │   ├── ConversationList.tsx
│   │   └── MessageThread.tsx
│   └── admin/
│
├── hooks/
│   ├── useAuth.ts
│   ├── useWebRTC.ts
│   ├── useSocket.ts
│   ├── useAppointments.ts
│   └── useMessages.ts
│
├── stores/
│   ├── authStore.ts
│   └── notificationStore.ts
│
├── lib/
│   ├── api.ts                        # Axios instance
│   ├── socket.ts                     # Socket.io client
│   ├── webrtc.ts                     # WebRTC utilities
│   └── utils.ts
│
└── types/
    ├── user.ts
    ├── appointment.ts
    ├── medical-record.ts
    └── api.ts
```

---

## 6. Module Téléconsultation WebRTC

### Flux de connexion vidéo

```
Patient                    Serveur WebSocket              Médecin
   │                             │                           │
   │──── join-room(roomId) ─────►│                           │
   │                             │◄─── join-room(roomId) ───│
   │                             │                           │
   │◄─── user-joined ────────────│                           │
   │                             │──── user-joined ─────────►│
   │                             │                           │
   │── offer(SDP) ──────────────►│                           │
   │                             │──── offer(SDP) ──────────►│
   │                             │                           │
   │                             │◄─── answer(SDP) ─────────│
   │◄── answer(SDP) ─────────────│                           │
   │                             │                           │
   │── ice-candidate ───────────►│                           │
   │                             │──── ice-candidate ───────►│
   │                             │                           │
   │◄──────── Connexion P2P établie (WebRTC) ───────────────►│
   │                             │                           │
   │◄══════ Audio/Vidéo chiffré (DTLS-SRTP) ═══════════════►│
   │                             │                           │
   │── leave-room ──────────────►│                           │
   │                             │──── user-left ───────────►│
```

### Configuration STUN/TURN

```javascript
// Configuration ICE Servers
const iceServers = [
  // Serveurs STUN publics (gratuits)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },

  // Serveur TURN auto-hébergé (Coturn)
  {
    urls: 'turn:your-turn-server.com:3478',
    username: process.env.TURN_USERNAME,
    credential: process.env.TURN_PASSWORD
  },

  // TURN over TLS (pour contourner les firewalls)
  {
    urls: 'turns:your-turn-server.com:5349',
    username: process.env.TURN_USERNAME,
    credential: process.env.TURN_PASSWORD
  }
]
```

### Sécurité de la vidéo

- Chiffrement DTLS-SRTP obligatoire (WebRTC standard)
- Room ID aléatoire cryptographiquement sécurisé (UUID v4)
- Token d'accès valide 5 minutes avant la consultation
- Authentification JWT vérifiée à l'entrée de la room
- Destruction automatique de la room après la consultation

---

## 7. Sécurité & Conformité

### 7.1 Authentification & Autorisation

```
┌─────────────────────────────────────────────────────────┐
│                    FLUX D'AUTHENTIFICATION               │
└─────────────────────────────────────────────────────────┘

1. Login (email + password)
   ├── Vérification bcrypt (12 rounds)
   ├── Vérification compte actif
   ├── Si 2FA activé → Demander code TOTP
   └── Génération Access Token (15min) + Refresh Token (7j)

2. Requête authentifiée
   ├── Bearer token dans header Authorization
   ├── Vérification signature JWT
   ├── Vérification expiration
   ├── Chargement rôle utilisateur
   └── Vérification permissions (RBAC)

3. Refresh Token
   ├── Stocké en base de données (hashé)
   ├── Rotation automatique à chaque refresh
   └── Révocation sur logout ou compromission détectée
```

### 7.2 Protection des données

| Mesure | Implémentation |
|---|---|
| Chiffrement en transit | HTTPS/TLS 1.3 obligatoire |
| Chiffrement au repos | Champs sensibles chiffrés AES-256 |
| Hash mots de passe | bcrypt, cost factor 12 |
| Clés API | Variables d'environnement uniquement |
| Données vidéo | DTLS-SRTP (WebRTC standard) |
| Fichiers médicaux | Stockage chiffré S3/MinIO |

### 7.3 RGPD & Conformité médicale

- **Consentement explicite** : Checkbox obligatoire lors de l'inscription
- **Droit à l'oubli** : Endpoint DELETE /api/users/me avec anonymisation
- **Portabilité** : Export des données au format JSON/PDF
- **Accès aux données** : Log de chaque accès au dossier médical
- **Minimisation** : Collecte des données strictement nécessaires
- **DPO** : Email dédié rgpd@e-consult.ma

### 7.4 Logs d'audit

```sql
-- Chaque accès à un dossier médical est enregistré
INSERT INTO audit_logs (userId, action, resource, resource_id, ip_address, created_at)
VALUES ('uuid', 'READ', 'medical_record', 'uuid', '192.168.1.1', NOW());
```

### 7.5 Rate Limiting

```javascript
// Limites par endpoint
/api/auth/login          → 5 req/min par IP
/api/auth/register       → 3 req/min par IP
/api/auth/forgot-password → 3 req/heure par email
/api/                    → 100 req/min par utilisateur authentifié
```

---

## 8. Infrastructure & Déploiement

### Docker Compose (Production)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: econsult
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}

  backend:
    build: ./backend
    depends_on: [postgres, redis]
    environment:
      DATABASE_URL: postgresql://...
      JWT_SECRET: ${JWT_SECRET}
      STRIPE_KEY: ${STRIPE_SECRET_KEY}

  frontend:
    build: ./frontend
    depends_on: [backend]

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on: [frontend, backend]

  coturn:
    image: coturn/coturn
    ports:
      - "3478:3478/udp"
      - "3478:3478/tcp"
      - "5349:5349/tcp"
      - "49152-65535:49152-65535/udp"
    environment:
      TURN_USER: ${TURN_USERNAME}
      TURN_PASSWORD: ${TURN_PASSWORD}

volumes:
  postgres_data:
```

### Pipeline CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
stages:
  1. Lint & Format check (ESLint, Prettier)
  2. Type check (TypeScript)
  3. Tests unitaires (Jest)
  4. Tests d'intégration (Supertest)
  5. Build Docker images
  6. Push vers registry
  7. Deploy staging (automatique)
  8. Tests E2E staging (Playwright)
  9. Deploy production (manuel avec approbation)
  10. Smoke tests production
```

### Monitoring

| Outil | Usage |
|---|---|
| Uptime Robot | Monitoring disponibilité |
| Sentry | Gestion des erreurs |
| Grafana + Prometheus | Métriques systèmes |
| PostgreSQL logs | Queries lentes |
| Nginx logs | Accès et erreurs HTTP |

---

## 9. API Reference

### Format des réponses

```json
// Succès
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "total": 100,
    "totalPages": 10
  }
}

// Erreur
{
  "success": false,
  "error": {
    "code": "APPOINTMENT_NOT_FOUND",
    "message": "Le rendez-vous n'existe pas",
    "statusCode": 404
  }
}
```

### Codes d'erreur

| Code | HTTP | Description |
|---|---|---|
| UNAUTHORIZED | 401 | Non authentifié |
| FORBIDDEN | 403 | Non autorisé |
| USER_NOT_FOUND | 404 | Utilisateur introuvable |
| APPOINTMENT_NOT_FOUND | 404 | RDV introuvable |
| SLOT_UNAVAILABLE | 409 | Créneau déjà pris |
| PAYMENT_FAILED | 402 | Paiement échoué |
| INVALID_2FA_CODE | 401 | Code 2FA invalide |
| DOCTOR_NOT_VERIFIED | 403 | Médecin non validé |
| RATE_LIMIT_EXCEEDED | 429 | Trop de requêtes |

---

## 10. Diagrammes

### Flux de prise de rendez-vous

```
Patient                  API                  DB              Stripe
  │                       │                    │                 │
  │── GET /doctors ───────►│                    │                 │
  │◄── Liste médecins ─────│                    │                 │
  │                       │                    │                 │
  │── GET /doctors/:id/slots ►│                 │                 │
  │◄── Créneaux dispo ─────│── Query RDV ──────►│                 │
  │                       │◄── Disponibilités ─│                 │
  │                       │                    │                 │
  │── POST /appointments ─►│                    │                 │
  │                       │── Créer RDV ───────►│                 │
  │                       │◄── RDV créé ───────│                 │
  │                       │                    │                 │
  │── POST /payments/intent ►│                  │                 │
  │                       │──────────────────────────────────────►│
  │◄── client_secret ──────│◄─────── PaymentIntent ──────────────│
  │                       │                    │                 │
  │── [Stripe.js confirme le paiement] ────────────────────────► │
  │◄── Paiement confirmé ──────────────────────────────────────── │
  │                       │                    │                 │
  │── POST /payments/confirm ►│                 │                 │
  │                       │── Update RDV ──────►│                 │
  │                       │── Email confirmation │                │
  │◄── RDV confirmé ───────│                    │                 │
```

### Flux de téléconsultation

```
  Patient          Next.js           NestJS API        Socket.io
     │                │                   │                 │
     │── Accède /consultation/[roomId] ──►│                 │
     │               │── Vérif token ────►│                 │
     │               │◄── Token valide ───│                 │
     │               │                   │                 │
     │── connect WebSocket ──────────────────────────────► │
     │── join-room(roomId, token) ────────────────────────►│
     │                                   │◄── Vérif JWT ───│
     │◄─── room-joined ───────────────────────────────────│
     │                                   │                 │
     │ [Médecin fait de même]            │                 │
     │◄─── user-joined(doctorId) ─────────────────────────│
     │                                   │                 │
     │── createOffer (WebRTC SDP) ───────────────────────►│
     │                                   │                 │
     │         [Échange ICE candidates]  │                 │
     │                                   │                 │
     │◄══════════ P2P WEBRTC ÉTABLI ════════════════════► │
     │                                   │                 │
     │   [Audio/Vidéo chiffré DTLS-SRTP directement P2P]  │
```

---

## 11. Roadmap

### MVP (Mois 1-2)

- [x] Authentification complète (JWT + 2FA)
- [x] Profils patients et médecins
- [x] Prise de rendez-vous
- [x] Téléconsultation WebRTC basique
- [x] Paiement Stripe
- [x] Ordonnances PDF simples
- [x] Notifications email

### Phase 2 (Mois 3-4)

- [ ] Messagerie temps réel
- [ ] Dossier médical complet
- [ ] Upload documents (IRM, analyses...)
- [ ] Application mobile (React Native)
- [ ] Notifications push
- [ ] Multi-langues (FR/AR/EN)

### Phase 3 — Enterprise (Mois 5-6)

- [ ] Architecture multi-cliniques (SaaS)
- [ ] Intégration HL7/FHIR (interopérabilité)
- [ ] IA pour aide au diagnostic
- [ ] Télésurveillance (IoT)
- [ ] Module pharmacie
- [ ] Facturation CNSS/assurances
- [ ] Conformité HDS (Hébergeur Données de Santé)

---

## Variables d'environnement

```env
# Backend
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@postgres:5432/econsult
REDIS_URL=redis://:pass@redis:6379
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SENDGRID_API_KEY=SG.xxx
MAIL_FROM=noreply@e-consult.ma

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE=+212...

# TURN Server
TURN_SERVER_URL=turn:turn.e-consult.ma:3478
TURN_USERNAME=econsult
TURN_PASSWORD=secure-turn-password

# Storage (MinIO/S3)
S3_ENDPOINT=https://minio.e-consult.ma
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx
S3_BUCKET=econsult-medical

# Frontend
NEXT_PUBLIC_API_URL=https://api.e-consult.ma
NEXT_PUBLIC_SOCKET_URL=wss://api.e-consult.ma
NEXT_PUBLIC_STRIPE_KEY=pk_live_...
```

---

## Licence & Contact

- **Licence** : Propriétaire — Tous droits réservés
- **Conformité** : RGPD, Code de déontologie médicale marocain
- **Support technique** : tech@e-consult.ma
- **DPO** : rgpd@e-consult.ma

---

*Documentation générée le 2026-03-05 — Version 1.0.0*
