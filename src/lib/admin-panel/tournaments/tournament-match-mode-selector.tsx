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
import { Check, ChevronsUpDown, Plus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { TournamentMatchModeType } from "./tournament";
import {
  formatMatchModeName,
  formatMatchModeDescription,
} from "@/lib/helpers/match-mode";

const matchModeTypes = [
  { value: "BEST_OF" as const, labelKey: "best_of" },
  { value: "PLAY_ALL" as const, labelKey: "play_all" },
] as const;

const tournamentMatchModeFormSchema = z.object({
  mode: z.nativeEnum(TournamentMatchModeType),
  gameCount: z.number().int().positive().min(1).max(15),
});

type TournamentMatchModeFormData = z.infer<
  typeof tournamentMatchModeFormSchema
>;

export interface TournamentMatchModeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  allowClear?: boolean;
  defaultMatchModeId?: string;
}

export function TournamentMatchModeSelector({
  value,
  onChange,
  allowClear,
  defaultMatchModeId,
}: TournamentMatchModeSelectorProps) {
  const t = useTranslations("admin.tournaments.form.match_mode");
  const tGlobal = useTranslations();

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
      toast.success(t("toast.create_success"));
      void refetchMatchModes();
      onChange(newMatchMode.id);
      setDrawerOpen(false);
      matchModeForm.reset({
        mode: TournamentMatchModeType.BEST_OF,
        gameCount: 1,
      });
    },
    onError: (error) => {
      toast.error(`${t("toast.create_error")} ${error.message}`);
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
    return formatMatchModeName(mode, gameCount, tGlobal);
  };

  const generateDescription = (
    mode: TournamentMatchModeType,
    gameCount: number,
  ) => {
    return formatMatchModeDescription(mode, gameCount, tGlobal);
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
        {t("loading")}
      </Button>
    );
  }

  const shouldShowClearButton =
    allowClear && !!value && value !== defaultMatchModeId;

  return (
    <>
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <div className="flex w-full items-center gap-2">
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between"
            >
              {selectedMatchMode
                ? generateName(
                    selectedMatchMode.mode,
                    selectedMatchMode.gameCount,
                  )
                : t("select_placeholder")}
              <div className="ml-2 flex h-4 w-4 shrink-0 items-center gap-2 opacity-50">
                <ChevronsUpDown className="h-4 w-4" />
              </div>
            </Button>
          </PopoverTrigger>
          {shouldShowClearButton && (
            <Button
              title={t("clear_selection")}
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onChange(defaultMatchModeId ?? "")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={t("search_placeholder")} />
            <CommandList>
              <CommandEmpty>{t("no_modes_found")}</CommandEmpty>
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
                  {t("create_button")}
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
            <DrawerTitle>{t("create_title")}</DrawerTitle>
            <DrawerDescription>{t("create_description")}</DrawerDescription>
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
                      <FormLabel>{t("mode_type")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("mode_type_placeholder")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {matchModeTypes.map((type) => (
                            <SelectItem
                              key={type.value}
                              value={type.value}
                            >
                              {t(type.labelKey)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("mode_type_description")}
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
                      <FormLabel>{t("game_count")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="15"
                          placeholder={t("game_count_placeholder")}
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value) : 1,
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {t("game_count_description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted rounded-md p-3">
                  <p className="text-sm font-medium">{t("preview")}:</p>
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
                  {t("create_loading")}
                </>
              ) : (
                t("create_button")
              )}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">{t("cancel")}</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
