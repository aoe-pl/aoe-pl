"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import { type TournamentParticipant } from "./tournament";

interface TournamentParticipantsSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  participants: TournamentParticipant[];
  isLoading?: boolean;
  initialParticipantData?: {
    tournamentParticipantId: string;
    id: string;
  }[];
}

export function TournamentParticipantsSelector({
  value,
  onChange,
  participants,
  isLoading = false,
  initialParticipantData,
}: TournamentParticipantsSelectorProps) {
  const [open, setOpen] = useState(false);
  const initialSetRef = useRef(false);

  // Set initial selected participants when component mounts or initialParticipantData changes
  useEffect(() => {
    if (initialParticipantData && !initialSetRef.current) {
      const initialIds = initialParticipantData.map(
        (p) => p.tournamentParticipantId,
      );
      onChange(initialIds);
      initialSetRef.current = true;
    }
  }, [initialParticipantData, onChange]);

  const selectedParticipants = participants.filter((p) => value.includes(p.id));

  if (isLoading) {
    return (
      <Button
        variant="outline"
        disabled
        className="w-full justify-between"
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading participants...
      </Button>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex flex-wrap gap-1">
            {selectedParticipants.length > 0 ? (
              selectedParticipants.map((participant) => (
                <Badge
                  key={participant.id}
                  variant="secondary"
                  className="mr-1 flex items-center"
                >
                  {participant.nickname}
                  <span
                    role="button"
                    tabIndex={0}
                    className="ring-offset-background focus:ring-ring ml-1 cursor-pointer rounded-full outline-none focus:ring-2 focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        onChange(value.filter((id) => id !== participant.id));
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onChange(value.filter((id) => id !== participant.id));
                    }}
                    aria-label={`Remove ${participant.nickname}`}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">
                Select participants...
              </span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search participants..." />
          <CommandList>
            <CommandEmpty>No participants found.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-[200px]">
                {participants.map((participant) => (
                  <CommandItem
                    key={participant.id}
                    value={participant.nickname}
                    onSelect={() => {
                      const newValue = value.includes(participant.id)
                        ? value.filter((id) => id !== participant.id)
                        : [...value, participant.id];
                      onChange(newValue);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(participant.id)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {participant.nickname}
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
