"use client";

import clsx from "clsx";
import { Bot, User } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={clsx(
        "flex gap-3 px-4 py-4",
        isAssistant
          ? "bg-[hsl(var(--muted)/.3)]"
          : "bg-transparent"
      )}
    >
      <div
        className={clsx(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
          isAssistant
            ? "bg-nova-600 text-white"
            : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
        )}
      >
        {isAssistant ? (
          <Bot className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            {isAssistant ? "NOVA-EQP" : "Vous"}
          </span>
          {message.timestamp && (
            <span className="text-xs text-[hsl(var(--muted-foreground)/.6)]">
              {formatTime(message.timestamp)}
            </span>
          )}
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-[hsl(var(--foreground))]">
          {message.content}
        </div>
      </div>
    </div>
  );
}

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
