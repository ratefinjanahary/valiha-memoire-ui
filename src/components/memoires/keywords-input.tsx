"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface KeywordsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  onBlur?: () => void;
  max?: number;
  placeholder?: string;
}

export function KeywordsInput({
  value,
  onChange,
  onBlur,
  max = 10,
  placeholder = "Ex : apprentissage automatique",
}: KeywordsInputProps) {
  const [draft, setDraft] = useState("");
  const isFull = value.length >= max;

  // Gère aussi un collage "a, b, c" : la virgule sépare
  const commit = () => {
    const next = [...value];
    for (const part of draft.split(",")) {
      const mot = part.replace(/\s+/g, " ").trim();
      if (mot.length < 2 || mot.length > 50 || next.length >= max) continue;
      if (next.some((v) => v.toLowerCase() === mot.toLowerCase())) continue;
      next.push(mot);
    }
    if (next.length !== value.length) onChange(next);
    setDraft("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault(); // évite de soumettre le formulaire sur Entrée
      commit();
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          commit();
          onBlur?.();
        }}
        disabled={isFull}
        placeholder={isFull ? `${max} mots-clés maximum` : placeholder}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((mot) => (
            <span
              key={mot}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {mot}
              <button
                type="button"
                aria-label={`Retirer ${mot}`}
                onClick={() => onChange(value.filter((v) => v !== mot))}
                className="rounded-full hover:bg-primary/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}