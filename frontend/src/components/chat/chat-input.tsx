"use client";

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { SendHorizontal } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [value]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-3">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder="Posez votre question sur les equipements..."
            className="w-full resize-none rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 py-3 pr-12 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none focus:border-nova-500 focus:ring-1 focus:ring-nova-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-nova-600 text-white transition-colors hover:bg-nova-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Envoyer"
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-[hsl(var(--muted-foreground)/.5)]">
        NOVA-EQP peut faire des erreurs. Verifiez les informations importantes.
      </p>
    </form>
  );
}
