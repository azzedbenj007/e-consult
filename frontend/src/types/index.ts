export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: "admin" | "technicien" | "ingenieur" | "utilisateur";
  service?: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  role?: string;
  service?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  conversation_id?: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
  message_id: string;
}

export interface Equipment {
  id: string;
  nom: string;
  numero_serie: string;
  type: string;
  marque: string;
  modele: string;
  service: string;
  statut: "actif" | "en_panne" | "en_maintenance" | "hors_service" | "reforme";
  date_mise_en_service: string;
  date_derniere_maintenance?: string;
  prochaine_maintenance?: string;
}

export interface DashboardStats {
  total_equipements: number;
  equipements_actifs: number;
  equipements_en_panne: number;
  equipements_en_maintenance: number;
  taux_disponibilite: number;
  maintenances_prevues: number;
  alertes_critiques: number;
  interventions_mois: number;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}
