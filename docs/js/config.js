// =====================================================================
// Configuration L'Agora
// Laissez SUPABASE_URL vide pour lancer le MVP en MODE DÉMO
// (données stockées dans le navigateur, aucun serveur nécessaire).
// La clé "anon / publishable" Supabase est publique par conception :
// la sécurité repose sur les règles RLS de supabase/schema.sql.
// =====================================================================
window.AGORA_CONFIG = {
  APP_NAME: "L'Agora",
  HOSPITAL_NAME: "Centre Hospitalier",
  SUPABASE_URL: "",          // ex : "https://abcd1234.supabase.co"
  SUPABASE_ANON_KEY: "",     // clé publishable / anon
  ALLOWED_EMAIL_DOMAINS: [], // ex : ["chu-exemple.fr"] — vide = tous
  N8N_WEBHOOK_REPORT: "",    // facultatif : webhook n8n alerté à chaque signalement
  KIOSK_SLIDE_SECONDS: 12
};
