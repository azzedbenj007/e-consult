// =====================================================================
// Couche de données : même interface en mode DÉMO (localStorage) et
// en mode SUPABASE. L'interface utilisateur (app.js) ne voit que `Store`.
// =====================================================================
(function () {
  const C = window.AGORA_CONFIG;
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
  const days = (n) => new Date(Date.now() + n * 864e5).toISOString();

  function guard(title, body) {
    const r = window.sensitiveReason(`${title || ""} ${body || ""}`);
    if (r) throw new Error(`Publication bloquée : ${r} détecté. Aucune donnée patient sur L'Agora.`);
  }

  // -------------------------------------------------------------------
  // MODE DÉMO
  // -------------------------------------------------------------------
  function demoSeed() {
    const monday = new Date(); monday.setHours(12, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const menu = [
      ["Carottes râpées", "Poulet basquaise", "Curry de légumes", "Yaourt"],
      ["Velouté potiron", "Lasagnes", "Lasagnes végé", "Tarte aux pommes"],
      ["Taboulé", "Poisson pané, riz", "Falafels", "Fruit de saison"],
      ["Salade grecque", "Couscous", "Couscous légumes", "Mousse chocolat", "Saveurs d'Orient"],
      ["Œuf mimosa", "Bœuf bourguignon", "Gratin dauphinois", "Crème brûlée"]
    ].map((m, i) => {
      const d = new Date(monday); d.setDate(d.getDate() + i);
      return { day: d.toISOString().slice(0, 10), starter: m[0], main: m[1], veggie: m[2], dessert: m[3], theme: m[4] || null };
    });
    const P = (o) => ({ id: uid(), author_id: null, author_name: "Communication interne", author_service: "Direction", status: "published", pinned: false, created_at: days(-Math.random() * 6), ...o });
    return {
      posts: [
        P({ kind: "news", category: "equipement", pinned: true, title: "Un nouvel IRM 3 Tesla arrive au pôle imagerie", body: "Installation prévue la semaine prochaine. Les manipulateurs seront formés par le constructeur. Merci aux services techniques et biomédical pour la préparation de la salle !" }),
        P({ kind: "news", category: "qvt", title: "Semaine de la QVT : programme complet", body: "Ateliers sophrologie, massages assis, stand nutrition au self et tournoi de pétanque inter-services. Inscriptions dans l'onglet Pratique > Bien-être." }),
        P({ kind: "news", category: "sante", title: "Vaccination antigrippale du personnel", body: "Permanence sans rendez-vous du service de santé au travail, lundi au jeudi 11h-14h, bâtiment B." }),
        P({ kind: "portrait", category: "vis-ma-vie", title: "Vis ma vie : une journée en stérilisation centrale", body: "Chaque jour, l'équipe traite plus de 2 000 dispositifs. Rencontre avec ces professionnels de l'ombre sans qui aucun bloc ne pourrait tourner." }),
        P({ kind: "event", category: "sport", title: "Tournoi de foot inter-services", body: "Équipes de 7, mixtes bienvenues. Inscription auprès de l'Amicale.", event_date: days(9), location: "Stade municipal" }),
        P({ kind: "event", category: "depart", title: "Pot de départ en retraite de Martine (lingerie)", body: "35 ans de maison ! Venez nombreux la remercier.", event_date: days(3), location: "Salle du personnel, bât. A" }),
        P({ kind: "event", category: "qvt", title: "Atelier sophrologie (30 min)", body: "Places limitées à 12 personnes.", event_date: days(5), location: "Salle Zen, 2e étage" }),
        P({ kind: "annonce", category: "covoiturage", author_name: "Karim", author_service: "Urgences", title: "Covoiturage Villeneuve → Hôpital, poste 7h-19h", body: "Trajet en 12h jour, du lundi au jeudi. 2 places, participation aux frais." }),
        P({ kind: "annonce", category: "troc", author_name: "Collègue anonyme", author_service: "Maternité", title: "Donne poussette + siège auto", body: "Très bon état, à récupérer sur le parking P2." }),
        P({ kind: "annonce", category: "logement", author_name: "Léa", author_service: "Internat", title: "Interne cherche studio pour le semestre de mai", body: "Proche hôpital ou tram, budget 550 € CC." }),
        P({ kind: "kudos", to_team: "Logistique", author_name: "Sophie", author_service: "Urgences", title: "Merci la logistique !", body: "Merci pour le réassort express pendant le pic de vendredi soir. Vous avez assuré !" }),
        P({ kind: "kudos", to_team: "Brancardage", author_name: "Équipe de nuit", author_service: "Cardiologie", title: "Bravo au brancardage", body: "Toujours le sourire, même à 3h du matin. Merci !" })
      ],
      likes: {}, comments: [], reports: [],
      resources: [
        ["procedure", "RH", "Poser un congé", "Logiciel de gestion des temps, rubrique « Mes absences ». Délai de prévenance : 15 jours.", null, "conge rh absence"],
        ["procedure", "RH", "Déclarer un accident de trajet", "Prévenez votre cadre sous 24h, puis remplissez le formulaire AT/MP auprès de la DRH.", null, "accident trajet"],
        ["procedure", "Formation", "Demander une formation", "Formulaire à remplir avec votre cadre lors de l'entretien annuel ou en cours d'année.", null, "formation dpc"],
        ["procedure", "RH", "Badgeage : oubli ou anomalie", "Signalez l'oubli à votre cadre le jour même via le formulaire de régularisation.", null, "badge pointage"],
        ["procedure", "Sécurité", "Protocole incendie : les 4 réflexes", "Donner l'alerte (poste 18), évacuer horizontalement, fermer les portes, ne pas prendre les ascenseurs.", "18", "incendie feu securite"],
        ["procedure", "Hygiène", "Tri des déchets (DASRI / DAOM)", "Sac jaune : DASRI. Sac noir : ordures ménagères. Carton : collecteur dédié.", null, "dechets tri"],
        ["procedure", "Hygiène", "Hygiène des mains : rappel", "Friction hydro-alcoolique 30 s, ongles courts, pas de bijoux.", null, "mains sha"],
        ["annuaire", "Urgences techniques", "Astreinte technique (fuite, panne électrique)", null, "4444", "panne fuite"],
        ["annuaire", "Urgences techniques", "Sécurité incendie", null, "18", "incendie"],
        ["annuaire", "Services", "Standard", null, "9", "standard"],
        ["annuaire", "Services", "Hotline informatique", null, "5000", "informatique dsi"],
        ["annuaire", "Services", "Santé au travail", null, "3210", "medecine travail"],
        ["annuaire", "Services", "DRH — Gestion des carrières", null, "3100", "rh paie"],
        ["accueil", "Plan", "Vestiaires du personnel", "Bâtiment A, sous-sol -1. Badge requis.", null, "vestiaire"],
        ["accueil", "Plan", "Self du personnel", "Bâtiment C, RDC. 11h15-14h30 et 18h30-20h.", null, "self repas"],
        ["accueil", "Plan", "Parkings personnel", "P2 et P4 réservés au personnel (badge). Navette depuis P4.", null, "parking"],
        ["accueil", "Intégration", "Checklist nouvel arrivant", "Badge, tenues, accès informatique, visite du service, formation incendie.", null, "accueil integration"],
        ["avantage", "Loisirs", "Cinéma Le Rex : -30 %", "Sur présentation du badge professionnel.", null, "cinema"],
        ["avantage", "Sport", "FitClub : 19 €/mois", "Sans engagement, accès 24h/24, idéal en horaires décalés.", null, "sport salle"],
        ["avantage", "Parcs", "Parc d'attractions : -25 %", "Billets à retirer à l'Amicale.", null, "parc"],
        ["avantage", "Vacances", "Chèques vacances Amicale", "Dossier à déposer avant le 31 mars.", null, "vacances"],
        ["pratique", "Crèche", "Crèche du personnel", "6h15 - 21h30, 7j/7. Inscriptions auprès de la DRH.", "2100", "creche enfants"],
        ["pratique", "Navettes", "Navette P4 ↔ Hall principal", "Toutes les 15 min de 6h à 22h.", null, "navette bus"],
        ["pratique", "Permanences", "Permanence mutuelle", "1er mardi du mois, 12h-14h, salle B12.", null, "mutuelle"],
        ["pratique", "Permanences", "Permanences syndicales", "Planning affiché au local syndical, bât. D.", null, "syndicat"],
        ["bienetre", "Sport", "Yoga du midi", "Mardi et jeudi 12h30-13h15, salle Zen.", null, "yoga"],
        ["bienetre", "Ergonomie", "5 étirements pour le dos en fin de poste", "Fiche du service de santé au travail.", null, "dos tms"],
        ["bienetre", "Écoute", "Soutien psychologique du personnel", "Consultation confidentielle et gratuite, sur rendez-vous.", "3333", "psy ecoute"]
      ].map(([section, category, title, body, phone, tags]) => ({ id: uid(), section, category, title, body, phone, tags: tags.split(" ") })),
      menus: menu,
      clubs: [
        { id: uid(), name: "Running", emoji: "🏃", description: "Sorties du dimanche matin et préparation du semi-marathon.", members: 23 },
        { id: uid(), name: "Club lecture", emoji: "📚", description: "Un livre par mois, échange autour d'un café.", members: 11 },
        { id: uid(), name: "Jardinage", emoji: "🌱", description: "Potager partagé derrière le bâtiment D.", members: 8 },
        { id: uid(), name: "Cuisine", emoji: "🍳", description: "Recettes rapides compatibles horaires décalés.", members: 15 }
      ],
      joined: {},
      polls: [{ id: uid(), question: "Quel menu thématique souhaitez-vous au self pour la fin du mois ?", options: ["Cuisine italienne", "Street food", "Antillais", "Brunch"], closes_at: days(14), votes: [12, 19, 8, 15] }],
      myVotes: {}
    };
  }

  function DemoStore() {
    const KEY = "agora-demo-v1";
    let db;
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
    if (!db) db = demoSeed();
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
    const me = () => db.profile;
    const decorate = (p) => ({
      ...p,
      likes: (db.likes[p.id] || []).length,
      liked: (db.likes[p.id] || []).includes("me"),
      comments_count: db.comments.filter((c) => c.post_id === p.id).length
    });

    return {
      mode: "demo",
      async session() { return db.profile ? { profile: db.profile } : null; },
      async signIn(email) {
        db.profile = { id: "me", email, display_name: email.split("@")[0], service: "Non renseigné", job: "", anonymous: false, role: "admin" };
        save(); return { ready: true };
      },
      async signOut() { delete db.profile; save(); },
      async saveProfile(p) { Object.assign(db.profile, p); save(); },
      async posts({ kind } = {}) {
        return db.posts
          .filter((p) => (!kind || p.kind === kind) && (p.status === "published" || me().role === "admin"))
          .sort((a, b) => (b.pinned - a.pinned) || b.created_at.localeCompare(a.created_at))
          .map(decorate);
      },
      async createPost(p) {
        guard(p.title, p.body);
        const pr = me();
        db.posts.push({ id: uid(), author_id: "me", status: "published", pinned: false, created_at: new Date().toISOString(),
          author_name: pr.anonymous ? "Collègue anonyme" : pr.display_name, author_service: pr.service, ...p });
        save();
      },
      async toggleLike(id) {
        const l = db.likes[id] || (db.likes[id] = []);
        const i = l.indexOf("me"); i >= 0 ? l.splice(i, 1) : l.push("me"); save();
      },
      async comments(postId) { return db.comments.filter((c) => c.post_id === postId); },
      async addComment(postId, body) {
        guard("", body);
        const pr = me();
        db.comments.push({ id: uid(), post_id: postId, body, created_at: new Date().toISOString(), author_name: pr.anonymous ? "Collègue anonyme" : pr.display_name });
        save();
      },
      async report(postId, reason) { db.reports.push({ id: uid(), post_id: postId, reason, status: "open", created_at: new Date().toISOString() }); save(); },
      async reports() {
        return db.reports.filter((r) => r.status === "open").map((r) => ({ ...r, post: db.posts.find((p) => p.id === r.post_id) }));
      },
      async setPostStatus(id, status) { const p = db.posts.find((x) => x.id === id); if (p) p.status = status; save(); },
      async resolveReport(id) { const r = db.reports.find((x) => x.id === id); if (r) r.status = "resolved"; save(); },
      async resources(section) { return db.resources.filter((r) => !section || r.section === section); },
      async menus() { return db.menus; },
      async clubs() { return db.clubs.map((c) => ({ ...c, joined: !!db.joined[c.id], members: c.members + (db.joined[c.id] ? 1 : 0) })); },
      async toggleClub(id) { db.joined[id] = !db.joined[id]; save(); },
      async polls() {
        return db.polls.map((p) => {
          const v = p.votes.slice(); const mine = db.myVotes[p.id];
          if (mine != null) v[mine]++;
          return { ...p, results: v, myVote: mine };
        });
      },
      async vote(pollId, idx) { if (db.myVotes[pollId] == null) { db.myVotes[pollId] = idx; save(); } },
      async reset() { localStorage.removeItem(KEY); }
    };
  }

  // -------------------------------------------------------------------
  // MODE SUPABASE
  // -------------------------------------------------------------------
  function SupabaseStore() {
    const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
    let profile = null;
    const ok = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

    async function loadProfile() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return (profile = null);
      profile = ok(await sb.from("profiles").select("*").eq("id", user.id).single());
      profile.email = user.email;
      return profile;
    }
    async function myLikes(ids) {
      if (!ids.length) return new Set();
      const rows = ok(await sb.from("reactions").select("post_id").eq("user_id", profile.id).in("post_id", ids));
      return new Set(rows.map((r) => r.post_id));
    }
    const fromName = (rows) => rows.map((r) => ({ ...r, author_name: r.author_name || "Communication interne", author_service: r.author_service || "Direction" }));

    return {
      mode: "supabase",
      client: sb,
      async session() { return (await loadProfile()) ? { profile } : null; },
      async signIn(email) {
        ok(await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } }));
        return { ready: false };
      },
      async signOut() { await sb.auth.signOut(); profile = null; },
      async saveProfile(p) { ok(await sb.from("profiles").update(p).eq("id", profile.id)); Object.assign(profile, p); },
      async posts({ kind } = {}) {
        let q = sb.from("posts_feed").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(100);
        if (kind) q = q.eq("kind", kind);
        const rows = fromName(ok(await q));
        const liked = await myLikes(rows.map((r) => r.id));
        return rows.map((r) => ({ ...r, liked: liked.has(r.id) }));
      },
      async createPost(p) { guard(p.title, p.body); ok(await sb.from("posts").insert({ ...p, author_id: profile.id })); },
      async toggleLike(id) {
        const liked = await myLikes([id]);
        if (liked.has(id)) ok(await sb.from("reactions").delete().eq("post_id", id).eq("user_id", profile.id));
        else ok(await sb.from("reactions").insert({ post_id: id, user_id: profile.id }));
      },
      async comments(postId) {
        const rows = ok(await sb.from("comments").select("id, body, created_at, profiles(display_name, anonymous)").eq("post_id", postId).order("created_at"));
        return rows.map((c) => ({ ...c, author_name: c.profiles ? (c.profiles.anonymous ? "Collègue anonyme" : c.profiles.display_name) : "Collègue" }));
      },
      async addComment(postId, body) { guard("", body); ok(await sb.from("comments").insert({ post_id: postId, body, author_id: profile.id })); },
      async report(postId, reason) {
        ok(await sb.from("reports").insert({ post_id: postId, reason, reporter_id: profile.id }));
        if (C.N8N_WEBHOOK_REPORT) fetch(C.N8N_WEBHOOK_REPORT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ post_id: postId, reason }) }).catch(() => {});
      },
      async reports() {
        const rows = ok(await sb.from("reports").select("*, post:posts(*)").eq("status", "open").order("created_at", { ascending: false }));
        return rows;
      },
      async setPostStatus(id, status) { ok(await sb.from("posts").update({ status }).eq("id", id)); },
      async resolveReport(id) { ok(await sb.from("reports").update({ status: "resolved" }).eq("id", id)); },
      async resources(section) {
        let q = sb.from("resources").select("*").order("category").order("title");
        if (section) q = q.eq("section", section);
        return ok(await q);
      },
      async menus() {
        const from = new Date(); from.setDate(from.getDate() - ((from.getDay() + 6) % 7));
        return ok(await sb.from("menus").select("*").gte("day", from.toISOString().slice(0, 10)).order("day").limit(7));
      },
      async clubs() {
        const clubs = ok(await sb.from("clubs").select("*, club_members(user_id)").order("name"));
        return clubs.map((c) => ({ ...c, members: c.club_members.length, joined: c.club_members.some((m) => m.user_id === profile.id) }));
      },
      async toggleClub(id) {
        const c = (await this.clubs()).find((x) => x.id === id);
        if (c.joined) ok(await sb.from("club_members").delete().eq("club_id", id).eq("user_id", profile.id));
        else ok(await sb.from("club_members").insert({ club_id: id, user_id: profile.id }));
      },
      async polls() {
        const polls = ok(await sb.from("polls").select("*").order("created_at", { ascending: false }).limit(10));
        const res = ok(await sb.from("poll_results").select("*"));
        const mine = ok(await sb.from("poll_votes").select("poll_id, option_idx").eq("user_id", profile.id));
        return polls.map((p) => ({
          ...p,
          results: p.options.map((_, i) => (res.find((r) => r.poll_id === p.id && r.option_idx === i) || { votes: 0 }).votes),
          myVote: (mine.find((m) => m.poll_id === p.id) || {}).option_idx
        }));
      },
      async vote(pollId, idx) { ok(await sb.from("poll_votes").insert({ poll_id: pollId, option_idx: idx, user_id: profile.id })); },
    };
  }

  // ?demo=1 force le mode démo (présentation sans compte) ; ?demo=0 revient au mode réel
  let forceDemo = false;
  try {
    const d = new URLSearchParams(location.search).get("demo");
    if (d === "1") sessionStorage.setItem("agora-demo", "1");
    if (d === "0") sessionStorage.removeItem("agora-demo");
    forceDemo = sessionStorage.getItem("agora-demo") === "1";
  } catch (e) {}
  window.Store = !forceDemo && C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase ? SupabaseStore() : DemoStore();
})();
