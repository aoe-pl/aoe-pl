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
import { api } from "@/trpc/react";

interface UserRolesComboboxProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function UserRolesCombobox({
  value,
  onChange,
  placeholder = "Select roles...",
}: UserRolesComboboxProps) {
  const [open, setOpen] = useState(false);

  const { data: roles, isLoading } = api.roles.list.useQuery();

  const selectedRoles = roles?.filter((role) => value.includes(role.id)) ?? [];

  if (isLoading) {
    return (
      <Button
        variant="outline"
        disabled
        className="w-full justify-between"
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading roles...
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
            {selectedRoles.length > 0 ? (
              selectedRoles.map((role) => (
                <Badge
                  key={role.id}
                  variant={role.type === "ADMIN" ? "default" : "secondary"}
                  className="mr-1 flex items-center"
                >
                  {role.name}
                  <span
                    role="button"
                    tabIndex={0}
                    className="ring-offset-background focus:ring-ring ml-1 cursor-pointer rounded-full outline-none focus:ring-2 focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        onChange(value.filter((id) => id !== role.id));
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onChange(value.filter((id) => id !== role.id));
                    }}
                    aria-label={`Remove ${role.name}`}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search roles..." />
          <CommandList>
            <CommandEmpty>No roles found.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-[200px]">
                {roles?.map((role) => (
                  <CommandItem
                    key={role.id}
                    value={role.name}
                    onSelect={() => {
                      const newValue = value.includes(role.id)
                        ? value.filter((id) => id !== role.id)
                        : [...value, role.id];
                      onChange(newValue);
                    }}
                  >
                    <div className="flex w-full items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.includes(role.id) ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="flex-1">{role.name}</span>
                      <Badge
                        variant={
                          role.type === "ADMIN" ? "default" : "secondary"
                        }
                        className="ml-2 text-xs"
                      >
                        {role.type}
                      </Badge>
                    </div>
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
