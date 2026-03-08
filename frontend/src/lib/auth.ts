"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import React from "react";
import type { User } from "@/types";
import { api } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    nom: string;
    prenom: string;
    role?: string;
    service?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("nova_access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const cachedUser = localStorage.getItem("nova_user");
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }

      const freshUser = await api.getMe();
      setUser(freshUser);
      localStorage.setItem("nova_user", JSON.stringify(freshUser));
    } catch {
      localStorage.removeItem("nova_access_token");
      localStorage.removeItem("nova_user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await api.login({ email, password });
    localStorage.setItem("nova_access_token", tokens.access_token);

    const currentUser = await api.getMe();
    setUser(currentUser);
    localStorage.setItem("nova_user", JSON.stringify(currentUser));
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      nom: string;
      prenom: string;
      role?: string;
      service?: string;
    }) => {
      await api.register(data);
      await login(data.email, data.password);
    },
    [login]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("nova_access_token");
    localStorage.removeItem("nova_user");
    setUser(null);
    window.location.href = "/auth/login";
  }, []);

  return React.createElement(
    AuthContext.Provider,
    { value: { user, loading, login, register, logout } },
    children
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit etre utilise dans un AuthProvider");
  }
  return context;
}
