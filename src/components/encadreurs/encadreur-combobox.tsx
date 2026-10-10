"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { encadreurService } from "@/services/encadreur.service";
import type { EncadreurListItem, EncadreurOption } from "@/types/memoire";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";

type Item = EncadreurOption & Partial<Pick<EncadreurListItem, "nbMemoiresEncadres" | "nbMemoiresAuteur">>;

export const formatEncadreur = (e: EncadreurOption) =>
  [e.titre, e.prenom, e.nom].filter(Boolean).join(" ");

const toOption = (e: EncadreurOption): EncadreurOption => ({
  id: e.id,
  nom: e.nom,
  prenom: e.prenom,
  titre: e.titre ?? null,
});

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
  /** Nombre max d'encadreurs sélectionnables. `1` = sélection unique (le nouveau choix remplace l'ancien). */
  max?: number;
  /** Encadreurs à ne pas proposer (ex. ceux déjà choisis dans un autre champ) */
  excludeIds?: string[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  onBlur?: () => void;
}

/**
 * ComboBox d'encadreurs basé sur `components/ui/combobox` (Base UI) :
 * recherche côté serveur (debounce 300 ms, 10 résultats), sélection multiple en chips
 * (ou unique avec max=1) et création d'un encadreur sans quitter le formulaire.
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
  const anchor = useComboboxAnchor();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const [results, setResults] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [creating, setCreating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const isSingle = max === 1;
  const isFull = !isSingle && value.length >= max;

  // Recherche côté serveur à l'ouverture et à chaque changement de saisie
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

  // Les valeurs sélectionnées doivent rester dans `items`, même si elles ne
  // correspondent pas à la recherche en cours (sinon la sélection est incohérente)
  const items = useMemo<Item[]>(() => {
    const hidden = new Set(excludeIds);
    const list = results.filter((r) => !hidden.has(r.id));
    const present = new Set(list.map((i) => i.id));
    return [...list, ...value.filter((v) => !present.has(v.id))];
  }, [results, value, excludeIds]);

  const handleValueChange = (next: Item[]) => {
    if (isSingle) {
      onChange(next.slice(-1).map(toOption));
      return;
    }
    if (next.length > max) {
      toast.error(`${max} encadreurs maximum`);
      return;
    }
    onChange(next.map(toOption));
  };

  // Création inline (hors popup : évite tout conflit de focus avec la liste)
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
      onChange(isSingle ? [toOption(created)] : [...value, toOption(created)]);
      setDraft(EMPTY_DRAFT);
      setCreating(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la création de l'encadreur");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      className="space-y-2"
      // Entrée dans un champ texte ne doit jamais soumettre le formulaire parent
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") e.preventDefault();
      }}
    >
      <Combobox
        multiple
        autoHighlight
        items={items}
        value={value}
        onValueChange={handleValueChange}
        inputValue={query}
        onInputValueChange={setQuery}
        open={open}
        onOpenChange={setOpen}
        // Filtrage fait par l'API : on désactive le filtre local
        filter={() => true}
        itemToStringLabel={formatEncadreur}
        isItemEqualToValue={(a: Item, b: Item) => a.id === b.id}
        disabled={disabled}
      >
        <ComboboxChips ref={anchor}>
          <ComboboxValue>
            {(selected: Item[]) => (
              <Fragment>
                {selected.map((e) => (
                  <ComboboxChip key={e.id}>{formatEncadreur(e)}</ComboboxChip>
                ))}
                <ComboboxChipsInput
                  id={id}
                  onBlur={onBlur}
                  placeholder={
                    isFull
                      ? `Maximum atteint (${max})`
                      : selected.length === 0
                        ? placeholder
                        : isSingle
                          ? "Changer d'encadreur..."
                          : ""
                  }
                />
              </Fragment>
            )}
          </ComboboxValue>
        </ComboboxChips>

        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>{isLoading ? "Recherche..." : "Aucun encadreur trouvé."}</ComboboxEmpty>
          <ComboboxList>
            {(item: Item) => (
              <ComboboxItem key={item.id} value={item}>
                <span className="min-w-0 flex-1 truncate">{formatEncadreur(item)}</span>
                {item.nbMemoiresEncadres !== undefined && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.nbMemoiresAuteur ? "auteur · " : ""}
                    {item.nbMemoiresEncadres} encadré{item.nbMemoiresEncadres > 1 ? "s" : ""}
                  </span>
                )}
              </ComboboxItem>
            )}
          </ComboboxList>
          {!isLoading && total > results.length && (
            <p className="border-t px-3 py-1.5 text-xs text-muted-foreground">
              {total} résultats : affinez la recherche pour voir les autres.
            </p>
          )}
        </ComboboxContent>
      </Combobox>

      {creating ? (
        <div
          className="space-y-2 rounded-md border p-3"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCreate();
            }
          }}
        >
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-primary"
          disabled={disabled || isFull}
          onClick={() => setCreating(true)}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Nouvel encadreur
        </Button>
      )}
    </div>
  );
}
