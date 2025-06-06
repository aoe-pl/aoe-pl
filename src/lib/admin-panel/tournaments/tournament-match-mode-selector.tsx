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
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { TournamentMatchModeType } from "@prisma/client";

const matchModeTypes = [
  { value: "BEST_OF" as const, label: "Best Of" },
  { value: "PLAY_ALL" as const, label: "Play All" },
] as const;

const tournamentMatchModeFormSchema = z.object({
  mode: z.nativeEnum(TournamentMatchModeType),
  gameCount: z.number().int().positive().min(1).max(15),
});

type TournamentMatchModeFormData = z.infer<
  typeof tournamentMatchModeFormSchema
>;

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

  // tRPC queries
  const {
    data: matchModes = [],
    refetch: refetchMatchModes,
    isLoading: matchModesLoading,
  } = api.tournaments.matchMode.list.useQuery();

  // tRPC mutations
  const createMatchModeMutation = api.tournaments.matchMode.create.useMutation({
    onSuccess: (newMatchMode) => {
      toast.success("Match mode created successfully!");
      void refetchMatchModes();
      onChange(newMatchMode.id);
      setDrawerOpen(false);
      matchModeForm.reset({
        mode: TournamentMatchModeType.BEST_OF,
        gameCount: 1,
      });
    },
    onError: (error) => {
      toast.error(`Failed to create match mode: ${error.message}`);
    },
  });

  const matchModeForm = useForm<TournamentMatchModeFormData>({
    resolver: zodResolver(tournamentMatchModeFormSchema),
    defaultValues: {
      mode: TournamentMatchModeType.BEST_OF,
      gameCount: 1,
    },
  });

  const watchMode = matchModeForm.watch("mode");
  const watchGameCount = matchModeForm.watch("gameCount");

  // Auto-generate name based on mode and game count
  const generateName = (mode: TournamentMatchModeType, gameCount: number) => {
    if (mode === TournamentMatchModeType.BEST_OF) {
      return `Best of ${gameCount}`;
    } else {
      return `Play All (${gameCount} games)`;
    }
  };

  const generateDescription = (
    mode: TournamentMatchModeType,
    gameCount: number,
  ) => {
    if (mode === TournamentMatchModeType.BEST_OF) {
      const toWin = Math.ceil(gameCount / 2);
      return `First to win ${toWin} games`;
    } else {
      return `All ${gameCount} games are played`;
    }
  };

  const onCreateMatchMode = (data: TournamentMatchModeFormData) => {
    createMatchModeMutation.mutate(data);
  };

  const selectedMatchMode = matchModes.find((mode) => mode.id === value);

  const handleCreateNewClick = () => {
    setOpen(false);
    setDrawerOpen(true);
  };

  if (matchModesLoading) {
    return (
      <Button
        variant="outline"
        disabled
        className="w-full justify-between"
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading match modes...
      </Button>
    );
  }

  return (
    <>
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
            {selectedMatchMode
              ? generateName(
                  selectedMatchMode.mode,
                  selectedMatchMode.gameCount,
                )
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
                {matchModes.map((mode) => (
                  <CommandItem
                    key={mode.id}
                    value={generateName(mode.mode, mode.gameCount)}
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
                      <span className="font-medium">
                        {generateName(mode.mode, mode.gameCount)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {generateDescription(mode.mode, mode.gameCount)}
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

      {/* Drawer for creating new match mode */}
      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      >
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
                            <SelectItem
                              key={type.value}
                              value={type.value}
                            >
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Best Of: First to win majority wins the match. Play All:
                        All games are played regardless of score.
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

                <div className="bg-muted rounded-md p-3">
                  <p className="text-sm font-medium">Preview:</p>
                  <p className="text-muted-foreground text-sm">
                    {generateName(watchMode, watchGameCount)} -{" "}
                    {generateDescription(watchMode, watchGameCount)}
                  </p>
                </div>
              </form>
            </Form>
          </div>
          <DrawerFooter>
            <Button
              onClick={matchModeForm.handleSubmit(onCreateMatchMode)}
              disabled={createMatchModeMutation.isPending}
            >
              {createMatchModeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Match Mode"
              )}
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
