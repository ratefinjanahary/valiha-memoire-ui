"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { memoireService } from "@/services/memoire.service";
import { Universite, UniversiteOption } from "@/types/memoire";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;

// Sigle + nom complet, ou nom seul si pas de sigle
export const UniversiteLabel = ({ u }: { u: UniversiteOption }) =>
  u.sigle ? (
    <span className="truncate">
      <span className="font-medium">{u.sigle}</span>
      <span className="text-muted-foreground"> — {u.nom}</span>
    </span>
  ) : (
    <span className="truncate">{u.nom}</span>
  );

interface UniversiteComboboxProps {
  id?: string;
  /** L'objet complet (pas seulement l'id) : la sélection peut ne pas figurer dans la page chargée. */
  value: UniversiteOption | null;
  onChange: (universite: UniversiteOption | null) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function UniversiteCombobox({
  id,
  value,
  onChange,
  onBlur,
  placeholder = "Sélectionnez...",
  disabled,
}: UniversiteComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(""); // texte saisi
  const [query, setQuery] = useState({ q: "", page: 1 }); // ce qui est réellement interrogé
  const [items, setItems] = useState<Universite[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Debounce : la saisie ne déclenche une requête qu'après une courte pause, et repart à la page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = search.trim();
      setQuery((prev) => (prev.q === q ? prev : { q, page: 1 }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Chargement : page 1 remplace la liste, les pages suivantes s'y ajoutent
  useEffect(() => {
    if (!open) return;
    let cancelled = false; // ignore les réponses d'une requête devenue obsolète
    setLoading(true);
    setError(false);

    memoireService
      .searchUniversites({ q: query.q, page: query.page, limit: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        // Réponse inattendue (ex. API encore à l'ancien format = tableau nu) : erreur affichée, pas de crash
        if (!Array.isArray(res?.data) || !res?.meta) {
          throw new Error(`Format de réponse inattendu, reçu : ${JSON.stringify(res)?.slice(0, 300)}`);
        }
        const rows = res.data;
        setItems((prev) => (query.page === 1 ? rows : [...prev, ...rows]));
        setHasMore(res.meta.page < res.meta.totalPages);
      })
      .catch((err) => {
        console.error("UniversiteCombobox :", err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, query]);

  // Scroll infini : quand le repère en bas de liste devient visible, on charge la page suivante
  useEffect(() => {
    const el = sentinelRef.current;
    if (!open || !el || !hasMore || loading) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setQuery((prev) => ({ ...prev, page: prev.page + 1 }));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, hasMore, loading, items.length]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSearch("");
      setQuery({ q: "", page: 1 });
      onBlur?.();
    }
  };

  const handleSelect = (u: Universite) => {
    onChange(u);
    handleOpenChange(false);
  };

  return (
    // `modal` : sans cela, la molette ne fait pas défiler la liste quand le Popover est dans un Dialog
    <Popover open={open} onOpenChange={handleOpenChange} modal>
      <PopoverTrigger 
        render={
            <Button
                id={id}
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                disabled={disabled}
                className="w-full min-w-0 justify-between font-normal"
            >
                {value ? (
                <UniversiteLabel u={value} />
                ) : (
                <span className="text-muted-foreground">{placeholder}</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        }
      />

      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        {/* Le filtrage est fait par le serveur : on désactive celui de cmdk */}
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Rechercher par sigle ou nom..."
          />
          <CommandList>
            {items.length > 0 && (
              <CommandGroup>
                {items.map((u) => (
                  <CommandItem key={u.id} value={u.id} onSelect={() => handleSelect(u)}>
                    <UniversiteLabel u={u} />
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4 shrink-0",
                        value?.id === u.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {hasMore && <div ref={sentinelRef} className="h-px" aria-hidden />}

            {loading && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement...
              </div>
            )}

            {!loading && error && (
              <div className="py-6 text-center text-sm text-destructive">
                Impossible de charger les universités.
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Aucune université trouvée.
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}