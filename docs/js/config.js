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
  SUPABASE_URL: "https://vpfifzztznzogdzabxga.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZmlmenp0em56b2dkemFieGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQwNTQxNDIsImV4cCI6MjEwOTYzMDE0Mn0.C-zf-F8GergiM7vK4kF8V7OQxaAdBuKXr5OeuQ6xCRU", // clé publique anon (sécurité = RLS)
  ALLOWED_EMAIL_DOMAINS: [], // ex : ["chu-exemple.fr"] — vide = tous
  N8N_WEBHOOK_REPORT: "",    // facultatif : webhook n8n alerté à chaque signalement
  KIOSK_SLIDE_SECONDS: 12
};
