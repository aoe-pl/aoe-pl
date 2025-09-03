"use client";

import { useState } from "react";
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

interface Streamer {
  id: string;
  streamerName: string;
  streamerUrl: string;
  isActive: boolean;
  user?: {
    name: string | null;
  } | null;
}

interface StreamerSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  streamers: Streamer[];
  isLoading?: boolean;
}

export function StreamerSelector({
  value,
  onChange,
  streamers,
  isLoading = false,
}: StreamerSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedStreamers = streamers.filter((streamer) =>
    value.includes(streamer.id),
  );

  const handleSelect = (streamerId: string) => {
    const isSelected = value.includes(streamerId);
    if (isSelected) {
      onChange(value.filter((id) => id !== streamerId));
    } else {
      onChange([...value, streamerId]);
    }
  };

  const handleRemove = (streamerId: string) => {
    onChange(value.filter((id) => id !== streamerId));
  };

  const getStreamerDisplayName = (streamer: Streamer) => {
    return streamer.user?.name ?? streamer.streamerName;
  };

  return (
    <div className="space-y-2">
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-auto min-h-10 w-full justify-between p-2"
            disabled={isLoading}
          >
            <div className="flex flex-wrap gap-1">
              {selectedStreamers.length === 0 ? (
                <span className="text-muted-foreground">
                  Select streamers...
                </span>
              ) : (
                selectedStreamers.map((streamer) => (
                  <Badge
                    key={streamer.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {getStreamerDisplayName(streamer)}
                  </Badge>
                ))
              )}
            </div>
            {isLoading ? (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-full p-0"
          align="start"
        >
          <Command>
            <CommandInput
              placeholder="Search streamers..."
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>No streamers found.</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-[200px]">
                  {streamers
                    .filter((streamer) => streamer.isActive)
                    .map((streamer) => (
                      <CommandItem
                        key={streamer.id}
                        value={`${streamer.streamerName} ${streamer.user?.name ?? ""}`}
                        onSelect={() => handleSelect(streamer.id)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value.includes(streamer.id)
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {getStreamerDisplayName(streamer)}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {streamer.streamerUrl}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedStreamers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedStreamers.map((streamer) => (
            <Badge
              key={streamer.id}
              variant="secondary"
              className="flex items-center gap-1 text-xs"
            >
              {getStreamerDisplayName(streamer)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemove(streamer.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
