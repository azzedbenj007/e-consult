// Filtre anti-données sensibles côté client (retour immédiat à l'agent).
// Miroir de public.sensitive_reason() dans supabase/schema.sql — le serveur fait foi.
(function () {
  const PHONE = /(^|\s)0[1-9]([ .-]?\d{2}){4}/;
  const RULES = [
    [/[12][ .]?\d{2}[ .]?(0[1-9]|1[0-2]|[2-9]\d)[ .]?\d[\dAB][ .]?\d{3}[ .]?\d{3}([ .]?\d{2})?/, "numéro de sécurité sociale"],
    [/\b(ipp|nda|n°\s*d.?admission|num[ée]ro\s+d.?admission|n°\s*dossier|dossier\s+patient)\b\s*[:#n°]*\s*\d{4,}/i, "identifiant patient (IPP/NDA/admission)"],
    [/(^|[^\d+])\d{7,12}(\D|$)/, "identifiant numérique long", (t) => !PHONE.test(t)],
    [/(^|[^\p{L}])(patiente?|résidente?)(?![\p{L}]).{0,30}(^|[^\p{L}])(m\.|mme|monsieur|madame|chambre|lit)(?![\p{L}])/iu, "mention nominative d'un patient"],
    [/(^|[^\p{L}])(compte[- ]rendu|ordonnance|résultats? d.?analyse|dossier médical)(?![\p{L}])/iu, "contenu médical / clinique"]
  ];
  window.sensitiveReason = function (text) {
    const t = String(text || "");
    for (const [re, label, guard] of RULES) {
      if (re.test(t) && (!guard || guard(t))) return label;
    }
    return null;
  };
})();
