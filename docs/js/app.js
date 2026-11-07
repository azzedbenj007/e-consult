// =====================================================================
// L'Agora — interface (routage par hash, rendu sans framework)
// =====================================================================
(function () {
  const C = window.AGORA_CONFIG;
  const S = window.Store;
  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = (d, opt = { day: "numeric", month: "short" }) => new Date(d).toLocaleDateString("fr-FR", opt);
  const fmtDateTime = (d) => new Date(d).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const ago = (d) => {
    const m = Math.round((Date.now() - new Date(d)) / 6e4);
    if (m < 60) return `il y a ${Math.max(m, 1)} min`;
    if (m < 1440) return `il y a ${Math.round(m / 60)} h`;
    return fmtDate(d);
  };
  const KIND = { news: "Actu", portrait: "Vis ma vie", event: "Événement", annonce: "Annonce", kudos: "Merci", club: "Club" };
  const ANNONCE_CAT = { covoiturage: "🚗 Covoiturage", troc: "🔁 Troc / don", logement: "🏠 Logement", autre: "📌 Autre" };
  const SECTIONS = { procedure: "Fiches réflexes", annuaire: "Annuaire utile", accueil: "Guide d'accueil", avantage: "Avantages", pratique: "Vie pratique", bienetre: "Bien-être" };

  let state = { profile: null };

  function toast(msg) {
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 3500);
  }
  async function run(fn) {
    try { await fn(); } catch (e) { toast(e.message || String(e)); console.error(e); }
  }

  // ----------------------------- Composants -----------------------------
  function postCard(p, { compact } = {}) {
    const tag = p.kind === "annonce" && p.category ? ANNONCE_CAT[p.category] || p.category : KIND[p.kind];
    const extra = [
      p.event_date ? `📅 ${fmtDateTime(p.event_date)}` : "",
      p.location ? `📍 ${esc(p.location)}` : "",
      p.to_team ? `💐 Pour : <b>${esc(p.to_team)}</b>` : ""
    ].filter(Boolean).join(" · ");
    return `<article class="card" data-post="${p.id}">
      <div><span class="tag ${p.kind}">${esc(tag)}</span> ${p.pinned ? '<span class="pin">📌 Épinglé</span>' : ""}
      ${p.status === "hidden" ? '<span class="tag soft">Masqué</span>' : ""}</div>
      <h3>${esc(p.title)}</h3>
      ${extra ? `<div class="meta" style="margin-bottom:6px">${extra}</div>` : ""}
      <p>${esc(compact && p.body.length > 220 ? p.body.slice(0, 220) + "…" : p.body)}</p>
      <div class="meta">${esc(p.author_name)} · ${esc(p.author_service)} · ${ago(p.created_at)}</div>
      <div class="actions">
        <button class="btn small ${p.liked ? "on" : ""}" data-act="like">${p.kind === "kudos" ? "💐" : "👍"} ${p.likes || 0}</button>
        <button class="btn small" data-act="comments">💬 ${p.comments_count || 0}</button>
        <button class="btn small danger" data-act="report" title="Signaler un contenu inapproprié">⚑ Signaler</button>
      </div>
      <div class="comments hidden"></div>
    </article>`;
  }

  async function bindPosts(root, rerender) {
    root.querySelectorAll("[data-post]").forEach((card) => {
      const id = card.dataset.post;
      card.addEventListener("click", (e) => {
        const act = e.target.closest("[data-act]")?.dataset.act;
        if (act === "like") run(async () => { await S.toggleLike(id); rerender(); });
        if (act === "report") run(async () => {
          const reason = prompt("Motif du signalement (ex : donnée patient, propos inapproprié) :");
          if (reason) { await S.report(id, reason); toast("Merci, l'équipe de modération est prévenue."); }
        });
        if (act === "comments") run(() => toggleComments(card, id));
      });
    });
  }

  async function toggleComments(card, id) {
    const box = $(".comments", card);
    if (!box.classList.contains("hidden")) return box.classList.add("hidden");
    const list = await S.comments(id);
    box.innerHTML = list.map((c) => `<div class="comment"><b>${esc(c.author_name)}</b> ${esc(c.body)} <span class="meta">${ago(c.created_at)}</span></div>`).join("")
      + `<form class="row" style="margin-top:6px"><input type="text" name="body" placeholder="Votre commentaire…" maxlength="1000" required><button class="btn primary small">Envoyer</button></form>`;
    box.classList.remove("hidden");
    $("form", box).addEventListener("submit", (e) => {
      e.preventDefault();
      run(async () => { await S.addComment(id, e.target.body.value); box.classList.add("hidden"); await toggleComments(card, id); });
    });
  }

  function composer({ kind, fields = [], label = "Publier", cats }) {
    return `<details class="card"><summary><b>＋ ${esc(label)}</b></summary>
      <form data-kind="${kind}">
        <div class="warning">⚠️ Aucune donnée patient (nom, IPP, n° de chambre, photo en zone de soins…). Le filtre bloque automatiquement les formats sensibles.</div>
        ${cats ? `<label>Catégorie</label><select name="category">${Object.entries(cats).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("")}</select>` : ""}
        ${fields.includes("to_team") ? `<label>Équipe / service remercié</label><input type="text" name="to_team" required maxlength="80">` : ""}
        <label>Titre</label><input type="text" name="title" required minlength="3" maxlength="140">
        <label>Message</label><textarea name="body" required maxlength="4000"></textarea>
        ${fields.includes("event_date") ? `<div class="row"><div><label>Date</label><input type="datetime-local" name="event_date" required></div><div><label>Lieu</label><input type="text" name="location" maxlength="120"></div></div>` : ""}
        <div class="error hidden"></div>
        <div class="actions"><button class="btn primary">${esc(label)}</button></div>
      </form></details>`;
  }

  function bindComposer(root, after) {
    root.querySelectorAll("form[data-kind]").forEach((f) => {
      const err = $(".error", f);
      f.addEventListener("input", () => {
        const r = window.sensitiveReason(`${f.title.value} ${f.body.value}`);
        err.classList.toggle("hidden", !r);
        if (r) err.textContent = `⛔ ${r} détecté : retirez cette information avant de publier.`;
      });
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        run(async () => {
          const data = Object.fromEntries(new FormData(f));
          Object.keys(data).forEach((k) => data[k] === "" && delete data[k]);
          if (data.event_date) data.event_date = new Date(data.event_date).toISOString();
          await S.createPost({ kind: f.dataset.kind, ...data });
          toast("Publié !"); after();
        });
      });
    });
  }

  // ------------------------------- Pages -------------------------------
  const pages = {
    async fil(main, params) {
      const filter = params.get("f") || "";
      const canEdit = ["editor", "moderator", "admin"].includes(state.profile.role);
      const posts = (await S.posts()).filter((p) => ["news", "portrait", "event", "kudos"].includes(p.kind) && (!filter || p.kind === filter));
      const polls = (await S.polls()).filter((p) => p.myVote == null).slice(0, 1);
      const menus = await S.menus(); const today = new Date().toISOString().slice(0, 10);
      const m = menus.find((x) => x.day === today);
      main.innerHTML = `<h1>Bonjour ${esc(state.profile.display_name)} 👋</h1><p class="sub">La vie de l'établissement, en un coup d'œil.</p>
        ${m ? `<a href="#/pratique" class="card" style="display:block;text-decoration:none;color:inherit"><span class="tag soft">🍽️ Au self aujourd'hui</span> <b>${esc(m.main)}</b> · végé : ${esc(m.veggie)}${m.theme ? ` · <i>${esc(m.theme)}</i>` : ""}</a>` : ""}
        ${polls.map((p) => `<a href="#/sondages" class="card" style="display:block;text-decoration:none;color:inherit"><span class="tag soft">📊 Baromètre</span> <b>${esc(p.question)}</b> → Donnez votre avis</a>`).join("")}
        <div class="chips">${[["", "Tout"], ["news", "Actualités"], ["portrait", "Vis ma vie"], ["event", "Événements"], ["kudos", "Mercis"]]
          .map(([k, v]) => `<a class="chip ${filter === k ? "on" : ""}" href="#/fil${k ? "?f=" + k : ""}">${v}</a>`).join("")}</div>
        ${canEdit ? composer({ kind: "news", label: "Publier une actualité" }) + composer({ kind: "portrait", label: "Publier un portrait « Vis ma vie »" }) : ""}
        <div id="list">${posts.map((p) => postCard(p, { compact: true })).join("") || '<p class="sub">Rien pour le moment.</p>'}</div>`;
      bindComposer(main, () => route()); bindPosts(main, () => route());
    },

    async agenda(main) {
      const now = Date.now();
      const events = (await S.posts({ kind: "event" })).filter((e) => new Date(e.event_date) > now - 864e5)
        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
      main.innerHTML = `<h1>Agenda</h1><p class="sub">Journées thématiques, pots de départ, tournois, événements associatifs.</p>
        ${composer({ kind: "event", label: "Proposer un événement", fields: ["event_date"] })}
        ${events.map((p) => postCard(p)).join("") || '<p class="sub">Aucun événement à venir.</p>'}`;
      bindComposer(main, () => route()); bindPosts(main, () => route());
    },

    async outils(main, params) {
      const tab = params.get("t") || "procedure";
      const items = await S.resources(tab);
      const groups = items.reduce((g, r) => ((g[r.category || "Divers"] ||= []).push(r), g), {});
      main.innerHTML = `<h1>Boîte à outils</h1><p class="sub">Procédures transverses non confidentielles, contacts utiles et guide d'accueil.</p>
        <div class="chips">${["procedure", "annuaire", "accueil"].map((k) => `<a class="chip ${tab === k ? "on" : ""}" href="#/outils?t=${k}">${SECTIONS[k]}</a>`).join("")}</div>
        ${Object.entries(groups).map(([g, list]) => `<h2>${esc(g)}</h2><div class="grid">${list.map(resourceCard).join("")}</div>`).join("")}`;
    },

    async pratique(main, params) {
      const tab = params.get("t") || "menus";
      let html = `<h1>Vie pratique & avantages</h1><p class="sub">Self, crèche, navettes, avantages Amicale et bien-être au travail.</p>
        <div class="chips">${[["menus", "🍽️ Menus du self"], ["avantage", "🎟️ Avantages"], ["pratique", "🚌 Services"], ["bienetre", "🧘 Bien-être"]]
          .map(([k, v]) => `<a class="chip ${tab === k ? "on" : ""}" href="#/pratique?t=${k}">${v}</a>`).join("")}</div>`;
      if (tab === "menus") {
        const today = new Date().toISOString().slice(0, 10);
        const menus = await S.menus();
        html += `<div class="grid">${menus.map((m) => `<div class="card menu-day ${m.day === today ? "today" : ""}">
          <h3>${fmtDate(m.day, { weekday: "long", day: "numeric", month: "short" })}</h3>
          ${m.theme ? `<span class="tag event">${esc(m.theme)}</span>` : ""}
          <dl><dt>Entrée</dt><dd>${esc(m.starter)}</dd><dt>Plat</dt><dd>${esc(m.main)}</dd><dt>Végé</dt><dd>${esc(m.veggie)}</dd><dt>Dessert</dt><dd>${esc(m.dessert)}</dd></dl>
        </div>`).join("") || '<p class="sub">Menu pas encore publié.</p>'}</div>`;
      } else {
        const items = await S.resources(tab);
        html += `<div class="grid">${items.map(resourceCard).join("")}</div>`;
      }
      main.innerHTML = html;
    },

    async communaute(main, params) {
      const cat = params.get("c") || "";
      const list = (await S.posts({ kind: "annonce" })).filter((p) => !cat || p.category === cat);
      main.innerHTML = `<h1>Petites annonces</h1><p class="sub">Covoiturage (postes 12h / 8h), troc, logement pour internes et stagiaires.</p>
        <div class="chips"><a class="chip ${!cat ? "on" : ""}" href="#/communaute">Toutes</a>${Object.entries(ANNONCE_CAT)
          .map(([k, v]) => `<a class="chip ${cat === k ? "on" : ""}" href="#/communaute?c=${k}">${v}</a>`).join("")}</div>
        ${composer({ kind: "annonce", label: "Déposer une annonce", cats: ANNONCE_CAT })}
        ${list.map((p) => postCard(p)).join("") || '<p class="sub">Aucune annonce.</p>'}
        <p class="meta">Pour répondre, utilisez les commentaires ou la messagerie professionnelle. Ne publiez pas votre adresse personnelle.</p>`;
      bindComposer(main, () => route()); bindPosts(main, () => route());
    },

    async kudos(main) {
      const list = await S.posts({ kind: "kudos" });
      main.innerHTML = `<h1>Mur des mercis 💐</h1><p class="sub">Remerciez publiquement une équipe pour son soutien.</p>
        ${composer({ kind: "kudos", label: "Dire merci", fields: ["to_team"] })}
        ${list.map((p) => postCard(p)).join("") || '<p class="sub">Soyez le premier à dire merci !</p>'}`;
      bindComposer(main, () => route()); bindPosts(main, () => route());
    },

    async clubs(main) {
      const clubs = await S.clubs();
      main.innerHTML = `<h1>Clubs & passions</h1><p class="sub">Rejoignez des collègues qui partagent vos centres d'intérêt.</p>
        <div class="grid">${clubs.map((c) => `<div class="card"><div style="font-size:2rem">${esc(c.emoji)}</div><h3>${esc(c.name)}</h3>
          <p>${esc(c.description)}</p><div class="meta">${c.members} membre(s)</div>
          <div class="actions"><button class="btn ${c.joined ? "on" : "primary"}" data-club="${c.id}">${c.joined ? "✓ Membre" : "Rejoindre"}</button></div></div>`).join("")}</div>`;
      main.querySelectorAll("[data-club]").forEach((b) => b.addEventListener("click", () => run(async () => { await S.toggleClub(b.dataset.club); route(); })));
    },

    async sondages(main) {
      const polls = await S.polls();
      main.innerHTML = `<h1>Baromètre d'écoute</h1><p class="sub">Micro-sondages rapides : votre avis compte.</p>
        ${polls.map((p) => {
          const total = p.results.reduce((a, b) => a + b, 0) || 1; const voted = p.myVote != null;
          return `<div class="card"><h3>${esc(p.question)}</h3>${p.closes_at ? `<div class="meta">Clôture le ${fmtDate(p.closes_at)}</div>` : ""}
            <div style="margin-top:10px">${p.options.map((o, i) => `<button class="btn poll-opt ${p.myVote === i ? "on" : ""}" data-poll="${p.id}" data-i="${i}" ${voted ? "disabled" : ""}>
              ${voted ? `<div class="poll-bar" style="width:${Math.round((p.results[i] / total) * 100)}%"></div>` : ""}
              <span>${esc(o)}${voted ? ` — ${Math.round((p.results[i] / total) * 100)} %` : ""}</span></button>`).join("")}</div>
            <div class="meta">${voted ? `${total} vote(s) · merci pour votre participation` : "Vote anonyme, un seul vote par agent."}</div></div>`;
        }).join("") || '<p class="sub">Aucun sondage en cours.</p>'}`;
      main.querySelectorAll("[data-poll]").forEach((b) => b.addEventListener("click", () => run(async () => { await S.vote(b.dataset.poll, +b.dataset.i); route(); })));
    },

    async recherche(main, params) {
      const q = (params.get("q") || "").trim().toLowerCase();
      const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      const nq = norm(q);
      const hit = (...f) => f.some((x) => norm(Array.isArray(x) ? x.join(" ") : x).includes(nq));
      const [res, posts] = await Promise.all([S.resources(), S.posts()]);
      const r = q ? res.filter((x) => hit(x.title, x.body, x.category, x.tags)) : [];
      const p = q ? posts.filter((x) => hit(x.title, x.body, x.category, x.to_team)) : [];
      main.innerHTML = `<h1>Recherche</h1><p class="sub">${q ? `${r.length + p.length} résultat(s) pour « ${esc(q)} »` : "Tapez un mot-clé : congé, parking, crèche, incendie…"}</p>
        ${r.length ? `<h2>Outils & infos pratiques</h2><div class="grid">${r.map(resourceCard).join("")}</div>` : ""}
        ${p.length ? `<h2>Publications</h2>${p.map((x) => postCard(x, { compact: true })).join("")}` : ""}`;
      bindPosts(main, () => route());
    },

    async profil(main) {
      const p = state.profile;
      main.innerHTML = `<h1>Mon profil</h1><p class="sub">${esc(p.email || "")} · rôle : ${esc(p.role)}</p>
        <form class="card" id="pf">
          <label>Prénom affiché</label><input type="text" name="display_name" value="${esc(p.display_name)}" required maxlength="60">
          <label>Service de rattachement</label><input type="text" name="service" value="${esc(p.service)}" maxlength="80">
          <label>Métier</label><input type="text" name="job" value="${esc(p.job || "")}" maxlength="80" placeholder="ex : IDE, ASH, technicien biomédical…">
          <label style="display:flex;gap:8px;align-items:center;font-weight:400"><input type="checkbox" name="anonymous" ${p.anonymous ? "checked" : ""}> Publier et commenter de façon anonyme (« Collègue anonyme »)</label>
          <div class="actions"><button class="btn primary">Enregistrer</button></div>
        </form>
        <div class="card"><h3>Affichage</h3><div class="actions">
          <button class="btn" data-theme="light">☀️ Clair</button><button class="btn" data-theme="dark">🌙 Sombre</button><button class="btn" data-theme="">Auto</button>
          <a class="btn" href="?borne=1" target="_blank">🖥️ Mode borne</a></div></div>
        ${["moderator", "admin"].includes(p.role) ? `<a class="btn" href="#/moderation">🛡️ Modération</a> ` : ""}
        <button class="btn danger" id="logout">Se déconnecter</button>
        ${S.mode === "demo" ? `<button class="btn" id="reset">Réinitialiser la démo</button>` : ""}`;
      $("#pf").addEventListener("submit", (e) => {
        e.preventDefault();
        const f = e.target;
        run(async () => { await S.saveProfile({ display_name: f.display_name.value, service: f.service.value, job: f.job.value, anonymous: f.anonymous.checked }); toast("Profil enregistré"); renderShell(); });
      });
      main.querySelectorAll("[data-theme]").forEach((b) => b.addEventListener("click", () => setTheme(b.dataset.theme)));
      $("#logout").addEventListener("click", () => run(async () => { await S.signOut(); boot(); }));
      $("#reset")?.addEventListener("click", () => run(async () => { await S.reset(); location.reload(); }));
    },

    async moderation(main) {
      if (!["moderator", "admin"].includes(state.profile.role)) { main.innerHTML = "<p>Accès réservé aux référents de modération.</p>"; return; }
      const reports = await S.reports();
      main.innerHTML = `<h1>Modération</h1><p class="sub">${reports.length} signalement(s) ouvert(s).</p>
        ${reports.map((r) => `<div class="card"><span class="tag soft">Signalé ${ago(r.created_at)}</span><p><b>Motif :</b> ${esc(r.reason)}</p>
          ${r.post ? `<div class="card" style="background:var(--surface-2)"><b>${esc(r.post.title)}</b><p>${esc(r.post.body)}</p><span class="meta">Statut : ${esc(r.post.status)}</span></div>` : "<p class='meta'>Publication supprimée.</p>"}
          <div class="actions">
            ${r.post ? `<button class="btn danger" data-hide="${r.post.id}" data-r="${r.id}">Masquer la publication</button>` : ""}
            <button class="btn" data-ok="${r.id}">Classer sans suite</button></div></div>`).join("") || "<p class='sub'>Rien à traiter 🎉</p>"}`;
      main.querySelectorAll("[data-hide]").forEach((b) => b.addEventListener("click", () => run(async () => { await S.setPostStatus(b.dataset.hide, "hidden"); await S.resolveReport(b.dataset.r); route(); })));
      main.querySelectorAll("[data-ok]").forEach((b) => b.addEventListener("click", () => run(async () => { await S.resolveReport(b.dataset.ok); route(); })));
    },

    async plus(main) {
      main.innerHTML = `<h1>Plus</h1><div class="grid">
        ${[["#/agenda", "📅", "Agenda", "Événements internes"], ["#/kudos", "💐", "Mur des mercis", "Remercier une équipe"], ["#/clubs", "⭐", "Clubs", "Centres d'intérêt"],
          ["#/sondages", "📊", "Baromètre", "Micro-sondages"], ["#/profil", "👤", "Mon profil", "Anonymat, thème, borne"]]
          .map(([h, i, t, d]) => `<a class="card" href="${h}" style="text-decoration:none;color:inherit"><div style="font-size:1.8rem">${i}</div><h3>${t}</h3><div class="meta">${d}</div></a>`).join("")}
      </div>`;
    }
  };

  function resourceCard(r) {
    return `<div class="card"><span class="tag soft">${esc(r.category || SECTIONS[r.section])}</span><h3>${esc(r.title)}</h3>
      ${r.body ? `<p>${esc(r.body)}</p>` : ""}
      ${r.phone ? `<div>☎️ Poste <b>${esc(r.phone)}</b></div>` : ""}
      ${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">Ouvrir le formulaire ↗</a>` : ""}</div>`;
  }

  // ------------------------------ Coquille ------------------------------
  const NAV = [["fil", "🏠", "Accueil"], ["outils", "🧰", "Outils"], ["pratique", "🍽️", "Pratique"], ["communaute", "🤝", "Annonces"], ["plus", "☰", "Plus"]];
  const NAV_DESKTOP_EXTRA = [["agenda", "📅", "Agenda"], ["kudos", "💐", "Mercis"], ["clubs", "⭐", "Clubs"], ["sondages", "📊", "Baromètre"]];

  function renderShell() {
    const wide = matchMedia("(min-width: 900px)").matches;
    const items = wide ? NAV.filter((n) => n[0] !== "plus").concat(NAV_DESKTOP_EXTRA) : NAV;
    document.getElementById("app").innerHTML = `
      <header class="topbar">
        <a class="brand" href="#/fil"><img src="icons/icon.svg" alt="">${esc(C.APP_NAME)}</a>
        <form class="search" id="search"><input type="search" name="q" placeholder="Rechercher un formulaire, un contact…" aria-label="Rechercher"></form>
        <button class="avatar-btn" id="me" title="Mon profil">${esc((state.profile.display_name || "?")[0].toUpperCase())}</button>
      </header>
      <div class="layout">
        <nav class="nav">${items.map(([k, i, l]) => `<a href="#/${k}" data-nav="${k}"><span class="ico">${i}</span>${l}</a>`).join("")}</nav>
        <main id="main"></main>
      </div>`;
    $("#search").addEventListener("submit", (e) => { e.preventDefault(); location.hash = `#/recherche?q=${encodeURIComponent(e.target.q.value)}`; });
    $("#me").addEventListener("click", () => (location.hash = "#/profil"));
    route();
  }

  async function route() {
    const main = $("#main"); if (!main) return;
    const [path, qs] = location.hash.replace(/^#\/?/, "").split("?");
    const name = pages[path] ? path : "fil";
    document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === name ||
      (a.dataset.nav === "plus" && ["agenda", "kudos", "clubs", "sondages", "profil", "moderation"].includes(name))));
    main.innerHTML = '<p class="sub">Chargement…</p>';
    await run(() => pages[name](main, new URLSearchParams(qs || "")));
    window.scrollTo(0, 0);
  }

  // ------------------------------ Connexion ------------------------------
  function renderLogin(info) {
    const demo = S.mode === "demo";
    document.getElementById("app").innerHTML = `<div class="login"><div class="card">
      <div class="brand"><img src="icons/icon.svg" alt="">${esc(C.APP_NAME)}</div>
      <p class="sub" style="text-align:center">L'intranet social de ${esc(C.HOSPITAL_NAME)} : actus, entraide, vie pratique.</p>
      <div class="rules"><b>⛔ Espace sans données patients</b><ul>
        <li>Aucun dossier, compte rendu, nom ou identifiant de patient (IPP, NDA, n° de sécu).</li>
        <li>Aucune photo prise en zone de soins.</li>
        <li>Les publications sont modérées et filtrées automatiquement.</li></ul></div>
      <form id="login" style="margin-top:16px">
        <label for="email" style="font-weight:600;font-size:.9rem">Adresse e-mail professionnelle</label>
        <input type="email" id="email" name="email" required placeholder="prenom.nom@hopital.fr" style="margin-top:4px">
        <label style="display:flex;gap:8px;align-items:flex-start;margin-top:10px;font-size:.88rem"><input type="checkbox" required> J'ai lu et j'accepte la charte : je ne publierai aucune donnée patient ou confidentielle.</label>
        ${info ? `<div class="warning">${info}</div>` : ""}
        <button class="btn primary" style="width:100%;margin-top:12px">${demo ? "Entrer (mode démo)" : "Recevoir mon lien de connexion"}</button>
      </form>
      ${!demo ? '<p class="meta" style="margin-top:10px;text-align:center"><a href="?demo=1">Découvrir la démo sans compte →</a></p>' : ""}
      ${demo ? '<p class="meta" style="margin-top:10px">Mode démo : données fictives stockées dans votre navigateur, vous êtes administrateur pour tester toutes les fonctions.</p>' : ""}
    </div></div>`;
    $("#login").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = e.target.email.value.trim().toLowerCase();
      const dom = email.split("@")[1];
      if (C.ALLOWED_EMAIL_DOMAINS.length && !C.ALLOWED_EMAIL_DOMAINS.includes(dom)) return renderLogin(`Seules les adresses ${C.ALLOWED_EMAIL_DOMAINS.map((d) => "@" + d).join(", ")} sont acceptées.`);
      run(async () => {
        const r = await S.signIn(email);
        if (r.ready) boot(); else renderLogin(`📧 Lien envoyé à <b>${esc(email)}</b>. Ouvrez-le sur cet appareil pour vous connecter.`);
      });
    });
  }

  // ------------------------------ Mode borne ------------------------------
  async function renderKiosk() {
    document.body.classList.add("kiosk");
    const app = document.getElementById("app");
    const slides = [];
    const today = new Date().toISOString().slice(0, 10);
    const menus = await S.menus().catch(() => []);
    const m = menus.find((x) => x.day === today);
    if (m) slides.push(`<span class="tag event">🍽️ Au self aujourd'hui</span><h2>${esc(m.main)}</h2><p>Entrée : ${esc(m.starter)}<br>Végétarien : ${esc(m.veggie)}<br>Dessert : ${esc(m.dessert)}</p>${m.theme ? `<p><b>${esc(m.theme)}</b></p>` : ""}`);
    const posts = await S.posts().catch(() => []);
    posts.filter((p) => ["news", "portrait", "kudos"].includes(p.kind)).slice(0, 8)
      .forEach((p) => slides.push(`<span class="tag ${p.kind}">${KIND[p.kind]}</span><h2>${esc(p.title)}</h2><p>${esc(p.body.slice(0, 320))}</p>${p.to_team ? `<p>💐 Pour : <b>${esc(p.to_team)}</b></p>` : ""}`));
    const ev = posts.filter((p) => p.kind === "event" && new Date(p.event_date) > Date.now()).sort((a, b) => new Date(a.event_date) - new Date(b.event_date)).slice(0, 4);
    if (ev.length) slides.push(`<span class="tag event">📅 À venir</span><h2>Agenda</h2>${ev.map((e) => `<p><b>${fmtDateTime(e.event_date)}</b> — ${esc(e.title)}${e.location ? ` (${esc(e.location)})` : ""}</p>`).join("")}`);
    if (!slides.length) slides.push(`<h2>${esc(C.APP_NAME)}</h2><p>Connectez cette borne avec un compte « borne » en lecture seule pour afficher les actualités.</p>`);
    let i = 0;
    app.innerHTML = `<div class="kiosk-wrap"><div class="kiosk-head"><div class="brand"><img src="icons/icon.svg" alt="">${esc(C.APP_NAME)}</div><div class="clock" id="clock"></div></div>
      <div class="kiosk-slide" id="slide"></div><div class="kiosk-foot">Retrouvez tout sur votre smartphone : ${esc(location.host + location.pathname)}</div></div>`;
    const tick = () => { $("#clock").textContent = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); };
    const next = () => { $("#slide").innerHTML = slides[i++ % slides.length]; };
    tick(); next(); setInterval(tick, 15000); setInterval(next, C.KIOSK_SLIDE_SECONDS * 1000);
    setTimeout(() => location.reload(), 30 * 60 * 1000); // rafraîchit le contenu toutes les 30 min
  }

  // ------------------------------ Démarrage ------------------------------
  function setTheme(t) {
    if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
    try { t ? localStorage.setItem("agora-theme", t) : localStorage.removeItem("agora-theme"); } catch (e) {}
  }
  try { const t = localStorage.getItem("agora-theme"); if (t) document.documentElement.dataset.theme = t; } catch (e) {}

  async function boot() {
    if (new URLSearchParams(location.search).has("borne")) return renderKiosk();
    const s = await S.session().catch(() => null);
    if (!s) return renderLogin();
    state.profile = s.profile;
    renderShell();
  }

  window.addEventListener("hashchange", route);
  let wasWide = matchMedia("(min-width: 900px)").matches;
  window.addEventListener("resize", () => { const w = matchMedia("(min-width: 900px)").matches; if (w !== wasWide && state.profile) { wasWide = w; renderShell(); } });
  if (S.client) S.client.auth.onAuthStateChange((ev) => { if (ev === "SIGNED_IN" && !state.profile) boot(); });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  boot();
})();
