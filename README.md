# L'Agora — intranet social hospitalier (MVP)

C'est un tiers-lieu numérique pour **tout le personnel** de l'hôpital : soignants, administratifs, techniques, logistique et médico-technique. On y trouve les actualités, l'entraide, la vie pratique et la cohésion d'équipe. **Il ne contient aucune donnée patient ni aucune donnée confidentielle.**

Le MVP n'utilise que des outils gratuits :

| Brique | Rôle | Offre gratuite |
|---|---|---|
| **GitHub Pages** | Héberge l'application web (PWA mobile-first) | Gratuit |
| **Supabase** | Authentification par lien magique, base PostgreSQL, sécurité RLS, filtre anti-données sensibles | Free tier (500 Mo, 50 000 utilisateurs actifs par mois) |
| **n8n** | Automatisations : alertes de modération, lettre hebdomadaire, saisie des menus du self | Auto-hébergé gratuit (Docker) ou n8n Cloud |
| jsDelivr | CDN de `supabase-js` | Gratuit |

```
 Smartphone / PC / borne ──► GitHub Pages (docs/)  ──►  Supabase (Auth + Postgres + RLS)
                                                              │  Database Webhook
                                                              ▼
                                   n8n : modération · lettre hebdo · formulaire menus ──► e-mail
```

---

## Fonctionnalités du MVP

| Module | Contenu |
|---|---|
| 🏠 **Fil d'actualité** | Actualités institutionnelles (éditeurs), portraits « Vis ma vie », événements, mercis, actualités épinglées, filtres par thème, encart « menu du jour » et sondage en cours |
| 📅 **Agenda** | Journées thématiques, pots de départ, tournois. Tout agent peut proposer un événement |
| 🧰 **Boîte à outils** | Fiches réflexes (congés, accident de trajet, formation, badgeage, incendie, déchets), annuaire utile (postes fixes, urgences techniques), guide d'accueil (vestiaires, self, parkings, checklist) |
| 🍽️ **Vie pratique & avantages** | Menus du self de la semaine, avantages Amicale/CE, crèche, navettes, permanences, bien-être |
| 🤝 **Petites annonces** | Covoiturage (postes en 12 h ou 8 h), troc, logement pour internes et stagiaires |
| 💐 **Mur des mercis** | Remercier publiquement une équipe |
| ⭐ **Clubs** | Running, lecture, jardinage, cuisine… (rejoindre ou quitter) |
| 📊 **Baromètre** | Micro-sondages, un vote par agent, résultats affichés après le vote |
| 🔎 **Recherche unifiée** | Une seule recherche sur les outils, les contacts et les publications, sans tenir compte des accents |
| 👤 **Profil** | Prénom, service, métier, **mode anonyme** (« Collègue anonyme »), thème clair ou sombre |
| 🛡️ **Modération** | Signalement d'une publication, file de traitement (masquer ou classer), masquage automatique par n8n au-delà de N signalements |
| 🖥️ **Mode borne** | `?borne=1` : diaporama en lecture seule pour les salles de pause et le self (menu du jour, actualités, agenda, horloge) |
| 📱 **PWA** | Installable sur smartphone et utilisable hors poste fixe ; l'interface reste disponible hors ligne |

### Étanchéité : comment on évite les données patients

1. **Charte à accepter** à chaque connexion, avec un rappel visible dans chaque formulaire.
2. **Filtre côté client** (`docs/js/filter.js`) : l'agent est averti pendant qu'il tape.
3. **Filtre côté serveur** (fonction `public.sensitive_reason()` et déclencheurs sur `posts` et `comments`). C'est lui qui fait foi : même un appel direct à l'API est refusé. Il détecte :
   - les numéros de sécurité sociale (NIR) ;
   - les mentions IPP, NDA, n° d'admission ou n° de dossier suivies d'un numéro ;
   - les suites de 7 à 12 chiffres ;
   - les mentions du type « patient(e) … Mme / chambre / lit » ;
   - le vocabulaire clinique (« compte rendu », « ordonnance », « dossier médical », « résultats d'analyse »).
4. **Rôles** : `agent` / `editor` (communication interne) / `moderator` / `admin`. Seuls les éditeurs publient des actualités et des portraits.
5. **RLS** sur toutes les tables : rien n'est lisible sans être connecté. Les signalements ne sont visibles que par les modérateurs.
6. **Authentification** : lien magique envoyé à l'adresse professionnelle, avec une liste de domaines autorisés. Le SSO de l'hôpital (SAML ou Azure AD) peut être branché ensuite sur Supabase Auth.

---

## 1. Essayer tout de suite (mode démo)

Sans configuration, l'application tourne en **mode démo** : les données fictives sont stockées dans le navigateur et vous êtes administrateur.

```bash
cd docs && python3 -m http.server 8000
# ouvrir http://localhost:8000  (borne : http://localhost:8000/?borne=1)
```

## 2. Publier sur GitHub Pages

1. Fusionnez ce code sur `main`.
2. Dans le dépôt, ouvrez **Settings → Pages → Source : GitHub Actions**.
3. Le workflow `.github/workflows/pages.yml` publie le dossier `docs/` à chaque push.
   URL : `https://<compte>.github.io/e-consult/`

## 3. Brancher Supabase (gratuit)

1. Créez un projet sur [supabase.com](https://supabase.com), région UE (Francfort ou Paris).
2. Dans **SQL Editor**, exécutez `supabase/schema.sql`, puis, si vous voulez des données de démonstration, `supabase/seed.sql`.
3. Dans **Authentication → URL Configuration**, indiquez l'URL GitHub Pages comme *Site URL* et comme *Redirect URL*.
4. Dans **Project Settings → API**, copiez l'URL du projet et la clé *anon / publishable* dans `docs/js/config.js` :

   ```js
   SUPABASE_URL: "https://xxxx.supabase.co",
   SUPABASE_ANON_KEY: "eyJ…",
   ALLOWED_EMAIL_DOMAINS: ["chu-exemple.fr"],
   ```

   La clé anon est publique par conception : c'est la RLS qui protège les données. **Ne mettez jamais la clé `service_role` dans le front.**
5. Nommez les premiers administrateurs :

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'communication@chu-exemple.fr');
   ```

6. **Bornes** : créez un compte dédié (par exemple `borne-self@…`, rôle `agent`), connectez-le sur l'écran, puis ouvrez `…/?borne=1`.

> Pour bloquer côté serveur les adresses hors domaine, activez un *Auth Hook* « Before User Created » dans Supabase, ou désactivez les inscriptions publiques et invitez les agents.

## 4. Brancher n8n

Les workflows à importer (**Workflows → Import from file**) se trouvent dans `n8n/` :

| Fichier | Déclencheur | Rôle |
|---|---|---|
| `01-moderation-signalements.json` | Webhook `POST /agora-signalement` | Lit la publication signalée et compte les signalements. **Au-delà du seuil (3 par défaut), la publication est masquée automatiquement.** Les modérateurs reçoivent un e-mail. |
| `02-lettre-hebdo.json` | Chaque lundi à 7 h 10 | Envoie par e-mail une lettre « La semaine à l'hôpital » : actualités, portraits, événements, mercis, menus. Elle touche aussi les agents qui n'ouvrent pas l'appli. |
| `03-menus-self-formulaire.json` | Formulaire n8n | L'équipe du self saisit les menus de la semaine sans compte ni code. Ils sont publiés directement dans Supabase. |

Configuration :

1. Créez un identifiant **Header Auth** nommé « Supabase service key (header apikey) ». Le *Name* est `apikey` et la *Value* est la clé **service_role / secret** (elle reste côté serveur, dans n8n).
2. Créez un identifiant **SMTP** : messagerie de l'hôpital, ou Gmail avec un mot de passe d'application.
3. Dans chaque workflow, remplissez le nœud **Config** : `supabase_url`, `app_url`, destinataires.
4. Branchez les signalements. Choisissez **une seule** des deux options pour éviter les doublons :
   - **Recommandé :** Supabase → **Database → Webhooks** → table `reports`, événement `INSERT`, envoi vers l'URL du webhook n8n.
   - Ou bien : renseignez `N8N_WEBHOOK_REPORT` dans `docs/js/config.js`.
5. Activez les workflows.

---

## Structure

```
docs/                    → site statique publié sur GitHub Pages
  index.html             → point d'entrée PWA
  css/style.css          → design mobile-first, thème clair/sombre, mode borne
  js/config.js           → configuration (Supabase, domaines, n8n)
  js/filter.js           → filtre anti-données sensibles (client)
  js/store.js            → couche de données : mode démo ⇄ Supabase
  js/app.js              → interface (routage, pages, composants)
  sw.js, manifest.webmanifest, icons/
supabase/schema.sql      → tables, RLS, rôles, filtre serveur
supabase/seed.sql        → contenus d'exemple
n8n/*.json               → workflows importables
.github/workflows/pages.yml
```

## Pistes après le MVP

- SSO de l'hôpital (SAML ou Azure AD via Supabase Auth, offre payante) ou passerelle LDAP.
- Notifications push paramétrables (Web Push via n8n) avec une plage « repos » sans notification.
- Plan interactif de l'hôpital (SVG cliquable).
- Upload de photos dans Supabase Storage avec validation par un modérateur (aucune photo prise en zone de soins).
- Back-office éditeur pour les ressources et les sondages. En attendant, on les gère depuis le Table Editor de Supabase.
- Statistiques d'usage anonymes pour le comité de pilotage.
- **Co-construction** : faire valider les rubriques par un panel représentant chaque corps de métier avant le lancement.
