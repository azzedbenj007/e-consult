import type {
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  ChatRequest,
  ChatResponse,
  Conversation,
  ChatMessage,
  Equipment,
  DashboardStats,
  User,
} from "@/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("nova_access_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("nova_access_token");
        localStorage.removeItem("nova_user");
        window.location.href = "/auth/login";
      }
      throw new Error("Session expiree. Veuillez vous reconnecter.");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: "Une erreur inattendue est survenue.",
      }));
      throw new Error(error.detail || `Erreur ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // --- Auth ---

  async login(data: LoginRequest): Promise<AuthTokens> {
    const formData = new URLSearchParams();
    formData.append("username", data.email);
    formData.append("password", data.password);

    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: "Identifiants invalides.",
      }));
      throw new Error(error.detail || "Echec de la connexion.");
    }

    return response.json();
  }

  async register(data: RegisterRequest): Promise<User> {
    return this.request<User>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>("/api/auth/me");
  }

  // --- Chat ---

  async sendMessage(data: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>("/api/chat/conversations");
  }

  async getConversationMessages(
    conversationId: string
  ): Promise<ChatMessage[]> {
    return this.request<ChatMessage[]>(
      `/api/chat/conversations/${conversationId}/messages`
    );
  }

  async deleteConversation(conversationId: string): Promise<void> {
    return this.request<void>(
      `/api/chat/conversations/${conversationId}`,
      { method: "DELETE" }
    );
  }

  // --- Equipment ---

  async getEquipments(params?: {
    service?: string;
    statut?: string;
    search?: string;
  }): Promise<Equipment[]> {
    const searchParams = new URLSearchParams();
    if (params?.service) searchParams.append("service", params.service);
    if (params?.statut) searchParams.append("statut", params.statut);
    if (params?.search) searchParams.append("search", params.search);
    const query = searchParams.toString();
    return this.request<Equipment[]>(
      `/api/equipments${query ? `?${query}` : ""}`
    );
  }

  async getEquipment(id: string): Promise<Equipment> {
    return this.request<Equipment>(`/api/equipments/${id}`);
  }

  // --- Dashboard ---

  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>("/api/dashboard/stats");
  }
}

export const api = new ApiClient();
