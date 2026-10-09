"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { encadreurService } from "@/services/encadreur.service";
import type { EncadreurListItem, EncadreurOption } from "@/types/memoire";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const formatEncadreur = (e: EncadreurOption) =>
  [e.titre, e.prenom, e.nom].filter(Boolean).join(" ");

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const EMPTY_DRAFT = { nom: "", prenom: "", titre: "", email: "" };

interface EncadreurComboboxProps {
  value: EncadreurOption[];
  onChange: (value: EncadreurOption[]) => void;
  /** Nombre max d'encadreurs sélectionnables. `1` = sélection unique (le choix remplace). */
  max?: number;
  /** Encadreurs à ne pas proposer (ex. ceux déjà choisis dans un autre champ) */
  excludeIds?: string[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  onBlur?: () => void;
}

/**
 * ComboBox d'encadreurs : recherche côté serveur (debounce 300 ms, 10 résultats),
 * sélection multiple ou unique, et création d'un nouvel encadreur sans quitter le formulaire.
 * Le panneau de résultats est affiché dans le flux (pas en overlay) pour ne pas être
 * coupé par le conteneur scrollable de la modale.
 */
export function EncadreurCombobox({
  value,
  onChange,
  max = 5,
  excludeIds = [],
  placeholder = "Rechercher un encadreur...",
  disabled,
  id,
  onBlur,
}: EncadreurComboboxProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const [results, setResults] = useState<EncadreurListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const [creating, setCreating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const isSingle = max === 1;
  const isFull = !isSingle && value.length >= max;
  const selectedIds = new Set(value.map((v) => v.id));
  const visible = results.filter(
    (r) => !excludeIds.includes(r.id) && (isSingle || !selectedIds.has(r.id)),
  );

  // Chargement des résultats à l'ouverture et à chaque changement de recherche
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsLoading(true);
    encadreurService
      .search({ q: debouncedQuery, limit: 10 })
      .then((res) => {
        if (cancelled) return;
        setResults(res.data);
        setTotal(res.meta.total);
        setHighlighted(0);
      })
      .catch(() => {
        if (!cancelled) toast.error("Impossible de charger les encadreurs");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, debouncedQuery]);

  // Fermeture au clic en dehors
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open, onBlur]);

  const select = (item: EncadreurOption) => {
    const option: EncadreurOption = {
      id: item.id,
      nom: item.nom,
      prenom: item.prenom,
      titre: item.titre ?? null,
    };
    onChange(isSingle ? [option] : [...value, option]);
    setQuery("");
    setOpen(false);
    setCreating(false);
  };

  const remove = (idToRemove: string) => onChange(value.filter((v) => v.id !== idToRemove));

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) setOpen(true);
        else setHighlighted((h) => Math.min(h + 1, Math.max(visible.length - 1, 0)));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
        break;
      case "Enter":
        // Toujours bloqué : Entrée ne doit jamais soumettre le formulaire parent
        e.preventDefault();
        if (open && visible[highlighted]) select(visible[highlighted]);
        break;
      case "Escape":
        if (open) {
          // Ferme la liste sans fermer la modale
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
          setCreating(false);
        }
        break;
    }
  };

  // Création inline
  const emailTrimmed = draft.email.trim();
  const emailOk = !emailTrimmed || /^\S+@\S+\.\S+$/.test(emailTrimmed);
  const canCreate = draft.nom.trim().length >= 2 && draft.prenom.trim().length >= 2 && emailOk;

  const handleCreate = async () => {
    if (!canCreate || isCreating) return;
    setIsCreating(true);
    try {
      const created = await encadreurService.create({
        nom: draft.nom.trim(),
        prenom: draft.prenom.trim(),
        titre: draft.titre.trim() || undefined,
        email: emailTrimmed || undefined,
      });
      toast.success(`${formatEncadreur(created)} ajouté`);
      setDraft(EMPTY_DRAFT);
      select(created);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la création de l'encadreur");
    } finally {
      setIsCreating(false);
    }
  };

  const onCreateKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setCreating(false);
    }
  };

  return (
    <div ref={rootRef} className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((e) => (
            <Badge key={e.id} variant="secondary" className="gap-1 pr-1">
              {formatEncadreur(e)}
              <button
                type="button"
                aria-label={`Retirer ${formatEncadreur(e)}`}
                disabled={disabled}
                onClick={() => remove(e.id)}
                className="rounded-sm p-0.5 hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && visible[highlighted] ? `${listId}-opt-${highlighted}` : undefined}
        autoComplete="off"
        disabled={disabled || isFull}
        placeholder={
          isFull
            ? `Maximum atteint (${max})`
            : isSingle && value.length > 0
              ? "Changer d'encadreur..."
              : placeholder
        }
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onInputKeyDown}
      />

      {open && (
        <div className="rounded-md border bg-popover text-popover-foreground">
          <ul id={listId} role="listbox" className="max-h-56 overflow-y-auto p-1">
            {visible.map((item, index) => {
              const selected = selectedIds.has(item.id);
              return (
                <li
                  key={item.id}
                  id={`${listId}-opt-${index}`}
                  role="option"
                  aria-selected={selected}
                  // Garde le focus dans l'input pendant le clic
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(item)}
                  onMouseEnter={() => setHighlighted(index)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm",
                    index === highlighted && "bg-accent text-accent-foreground",
                  )}
                >
                  <span className="min-w-0 truncate">{formatEncadreur(item)}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    {item.nbMemoiresAuteur > 0 && <span>auteur</span>}
                    <span>
                      {item.nbMemoiresEncadres} encadré{item.nbMemoiresEncadres > 1 ? "s" : ""}
                    </span>
                    {selected && <Check className="h-4 w-4" />}
                  </span>
                </li>
              );
            })}
          </ul>

          {isLoading && (
            <p className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Recherche...
            </p>
          )}
          {!isLoading && visible.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Aucun encadreur trouvé.</p>
          )}
          {!isLoading && total > results.length && (
            <p className="px-3 py-1.5 text-xs text-muted-foreground">
              {total} résultats : affinez la recherche pour voir les autres.
            </p>
          )}

          <div className="border-t">
            {creating ? (
              <div className="space-y-2 p-3" onKeyDown={onCreateKeyDown}>
                <p className="text-xs font-medium">Nouvel encadreur</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    autoFocus
                    placeholder="Nom *"
                    value={draft.nom}
                    onChange={(e) => setDraft((d) => ({ ...d, nom: e.target.value }))}
                  />
                  <Input
                    placeholder="Prénom *"
                    value={draft.prenom}
                    onChange={(e) => setDraft((d) => ({ ...d, prenom: e.target.value }))}
                  />
                  <Input
                    placeholder="Titre (Dr, Pr...)"
                    value={draft.titre}
                    onChange={(e) => setDraft((d) => ({ ...d, titre: e.target.value }))}
                  />
                  <Input
                    type="email"
                    placeholder="Email (optionnel)"
                    aria-invalid={!emailOk}
                    value={draft.email}
                    onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isCreating}
                    onClick={() => setCreating(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="button" size="sm" disabled={!canCreate || isCreating} onClick={handleCreate}>
                    {isCreating && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    Créer et sélectionner
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-accent"
              >
                <Plus className="h-4 w-4" />
                Nouvel encadreur
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
