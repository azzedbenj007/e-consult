"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import { api } from "@/lib/api";
import { Bot, Plus } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/types";

function ChatContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load existing conversation from URL param
  useEffect(() => {
    const convId = searchParams.get("conversation");
    if (convId && convId !== conversationId) {
      setInitialLoading(true);
      setConversationId(convId);
      api
        .getConversationMessages(convId)
        .then((msgs) => setMessages(msgs))
        .catch(() => {
          setMessages([]);
          setConversationId(null);
        })
        .finally(() => setInitialLoading(false));
    }
  }, [searchParams, conversationId]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (content: string) => {
    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await api.sendMessage({
        message: content,
        conversation_id: conversationId ?? undefined,
      });

      if (!conversationId) {
        setConversationId(response.conversation_id);
      }

      const assistantMessage: ChatMessageType = {
        id: response.message_id,
        role: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
        conversation_id: response.conversation_id,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue. Veuillez reessayer.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
  };

  if (initialLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-nova-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-[hsl(var(--border))] px-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-nova-500" />
          <h1 className="text-sm font-semibold text-[hsl(var(--foreground))]">
            Assistant NOVA-EQP
          </h1>
        </div>
        <button
          onClick={handleNewConversation}
          className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
        >
          <Plus className="h-4 w-4" />
          Nouvelle conversation
        </button>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-nova-600/10">
              <Bot className="h-8 w-8 text-nova-500" />
            </div>
            <div className="max-w-md text-center">
              <h2 className="mb-2 text-lg font-semibold text-[hsl(var(--foreground))]">
                Bienvenue sur NOVA-EQP
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Posez vos questions sur les equipements biomedicaux,
                la maintenance, les statistiques ou la documentation technique.
              </p>
            </div>
            <div className="mt-4 grid w-full max-w-lg grid-cols-2 gap-2">
              {[
                "Quels equipements sont en panne ?",
                "Statistiques de maintenance ce mois",
                "Equipements HVAC du bloc operatoire",
                "Prochaines maintenances prevues",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="rounded-xl border border-[hsl(var(--border))] px-3 py-2.5 text-left text-xs text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {loading && (
              <div className="flex gap-3 bg-[hsl(var(--muted)/.3)] px-4 py-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-nova-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-nova-500 [animation-delay:0ms]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-nova-500 [animation-delay:150ms]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-nova-500 [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-nova-500 border-t-transparent" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
