"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Shuffle,
  X,
} from "lucide-react";
import { useState } from "react";

export type BracketEntrantOption = {
  id: string;
  label: string;
};

type BracketEntrantsSelectorProps = {
  value: string[];
  onChange: (value: string[]) => void;
  options: BracketEntrantOption[];
  isLoading?: boolean;
  /**
   * Entrant ids that may be removed from the selection. Entrants not in
   * this list are locked (e.g. already placed in a bracket match).
   * Undefined = all removable.
   */
  removableIds?: string[];
};

/**
 * Ordered multi-select for choosing bracket entrants (participants or
 * teams). Order = seed order (1st selected = seed 1). Includes manual
 * reorder (up/down) and a "Randomize" shuffle button per user request.
 */
export function BracketEntrantsSelector({
  value,
  onChange,
  options,
  isLoading = false,
  removableIds,
}: BracketEntrantsSelectorProps) {
  const [open, setOpen] = useState(false);

  const canRemove = (id: string) =>
    removableIds === undefined || removableIds.includes(id);

  const optionsById = new Map(options.map((o) => [o.id, o]));
  const selected = value
    .map((id) => optionsById.get(id))
    .filter((o): o is BracketEntrantOption => !!o);

  const move = (index: number, direction: "up" | "down") => {
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= value.length) return;

    const next = [...value];
    [next[index], next[swapWith]] = [next[swapWith]!, next[index]!];
    onChange(next);
  };

  const remove = (id: string) => {
    onChange(value.filter((v) => v !== id));
  };

  const randomize = () => {
    const next = [...value];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j]!, next[i]!];
    }
    onChange(next);
  };

  if (isLoading) {
    return (
      <Button
        variant="outline"
        disabled
        className="w-full justify-between"
      >
        Loading...
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Popover
          open={open}
          onOpenChange={setOpen}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              Add entrants...
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  <ScrollArea className="h-[200px]">
                    {options.map((option) => (
                      <CommandItem
                        key={option.id}
                        value={option.label}
                        onSelect={() => {
                          if (
                            value.includes(option.id) &&
                            !canRemove(option.id)
                          ) {
                            return;
                          }
                          const next = value.includes(option.id)
                            ? value.filter((id) => id !== option.id)
                            : [...value, option.id];
                          onChange(next);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value.includes(option.id)
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="outline"
          size="icon"
          title="Randomize seed order"
          disabled={selected.length < 2}
          onClick={randomize}
        >
          <Shuffle className="h-4 w-4" />
        </Button>
      </div>

      {selected.length === 0 ? (
        <p className="text-muted-foreground text-sm">No entrants selected.</p>
      ) : (
        <ol className="space-y-1">
          {selected.map((entrant, index) => (
            <li
              key={entrant.id}
              className="bg-muted/40 flex items-center gap-2 rounded-md border px-2 py-1 text-sm"
            >
              <span className="flex-1 truncate">{entrant.label}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={index === 0}
                onClick={() => move(index, "up")}
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={index === selected.length - 1}
                onClick={() => move(index, "down")}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
              {canRemove(entrant.id) ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive h-6 w-6"
                  onClick={() => remove(entrant.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              ) : (
                <span
                  className="text-muted-foreground/60 shrink-0 text-[10px]"
                  title="Placed in a match - cannot be removed"
                >
                  in match
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
