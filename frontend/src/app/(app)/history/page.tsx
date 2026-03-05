"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Conversation } from "@/types";
import {
  MessageSquare,
  Trash2,
  Clock,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";
import clsx from "clsx";

export default function HistoryPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de chargement"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleting) return;

    setDeleting(id);
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // silently fail
    } finally {
      setDeleting(null);
    }
  };

  const handleOpen = (id: string) => {
    router.push(`/chat?conversation=${id}`);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-nova-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-400" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b border-[hsl(var(--border))] px-6">
        <h1 className="text-sm font-semibold text-[hsl(var(--foreground))]">
          Historique des conversations
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="mx-auto max-w-3xl">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <FolderOpen className="mb-4 h-12 w-12 text-[hsl(var(--muted-foreground)/.4)]" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Aucune conversation pour le moment.
              </p>
              <button
                onClick={() => router.push("/chat")}
                className="mt-4 rounded-lg bg-nova-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-nova-700"
              >
                Demarrer une conversation
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleOpen(conv.id)}
                  className="flex w-full items-center gap-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-left transition-colors hover:border-nova-500/30 hover:bg-[hsl(var(--muted)/.5)]"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-nova-600/10">
                    <MessageSquare className="h-5 w-5 text-nova-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">
                      {conv.title || "Conversation sans titre"}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(conv.updated_at)}
                      </span>
                      <span>
                        {conv.message_count} message{conv.message_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(conv.id, e)}
                    disabled={deleting === conv.id}
                    className={clsx(
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
                      deleting === conv.id
                        ? "opacity-50"
                        : "text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-500"
                    )}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}
