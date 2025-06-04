"use client";

import { useState } from "react";
import {
  Form,
  FormMessage,
  FormDescription,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";

// Mock data - replace with actual API calls later
const mockTournamentMatchModes = [
  {
    id: "1",
    mode: "BEST_OF" as const,
    gameCount: 1,
    name: "Best of 1",
    description: "Single game match",
  },
  {
    id: "2", 
    mode: "BEST_OF" as const,
    gameCount: 3,
    name: "Best of 3",
    description: "First to win 2 games",
  },
  {
    id: "3",
    mode: "BEST_OF" as const,
    gameCount: 5,
    name: "Best of 5", 
    description: "First to win 3 games",
  },
  {
    id: "4",
    mode: "BEST_OF" as const,
    gameCount: 7,
    name: "Best of 7",
    description: "First to win 4 games",
  },
  {
    id: "5",
    mode: "PLAY_ALL" as const,
    gameCount: 3,
    name: "Play All (3 games)",
    description: "All 3 games are played",
  },
  {
    id: "6",
    mode: "PLAY_ALL" as const,
    gameCount: 5,
    name: "Play All (5 games)",
    description: "All 5 games are played",
  },
];

const matchModeTypes = [
  { value: "BEST_OF", label: "Best Of" },
  { value: "PLAY_ALL", label: "Play All" },
] as const;

type TournamentMatchModeFormData = {
  mode: "BEST_OF" | "PLAY_ALL";
  gameCount: number;
  name: string;
};

interface TournamentMatchModeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TournamentMatchModeSelector({
  value,
  onChange,
}: TournamentMatchModeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const matchModeForm = useForm<TournamentMatchModeFormData>({
    defaultValues: {
      mode: "BEST_OF",
      gameCount: 1,
      name: "",
    },
  });

  const watchMode = matchModeForm.watch("mode");
  const watchGameCount = matchModeForm.watch("gameCount");

  // Auto-generate name based on mode and game count
  const generateName = (mode: "BEST_OF" | "PLAY_ALL", gameCount: number) => {
    if (mode === "BEST_OF") {
      return `Best of ${gameCount}`;
    } else {
      return `Play All (${gameCount} games)`;
    }
  };

  // Update name when mode or game count changes
  useState(() => {
    const name = generateName(watchMode, watchGameCount);
    matchModeForm.setValue("name", name);
  }, [watchMode, watchGameCount]);

  const onCreateMatchMode = (data: TournamentMatchModeFormData) => {
    console.log("Creating tournament match mode:", data);
    // Here you would normally create the match mode via API
    // For now, just close the drawer and reset form
    setDrawerOpen(false);
    matchModeForm.reset({
      mode: "BEST_OF",
      gameCount: 1,
      name: "",
    });
  };

  const selectedMatchMode = mockTournamentMatchModes.find(
    (mode) => mode.id === value,
  );

  const handleCreateNewClick = () => {
    setOpen(false);
    setDrawerOpen(true);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedMatchMode
              ? selectedMatchMode.name
              : "Select match mode..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search match modes..." />
            <CommandList>
              <CommandEmpty>No match modes found.</CommandEmpty>
              <CommandGroup>
                {mockTournamentMatchModes.map((mode) => (
                  <CommandItem
                    key={mode.id}
                    value={mode.name}
                    onSelect={() => {
                      onChange(mode.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === mode.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{mode.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {mode.description}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={handleCreateNewClick}
                  className="cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new match mode
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Drawer is outside the Popover */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Create New Match Mode</DrawerTitle>
            <DrawerDescription>
              Define a new match format for tournament games.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            <Form {...matchModeForm}>
              <form
                onSubmit={matchModeForm.handleSubmit(onCreateMatchMode)}
                className="space-y-4"
              >
                <FormField
                  control={matchModeForm.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match Mode Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mode type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {matchModeTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Best Of: First to win majority wins the match. Play All: All games are played regardless of score.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={matchModeForm.control}
                  name="gameCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game Count</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="15"
                          placeholder="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value) : 1,
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Number of games in the match (e.g., 3 for Best of 3)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={matchModeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Best of 3"
                          {...field}
                          value={generateName(watchMode, watchGameCount)}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>
                        Name that will be displayed in the tournament
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
          <DrawerFooter>
            <Button onClick={matchModeForm.handleSubmit(onCreateMatchMode)}>
              Create Match Mode
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
} 