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
import { Textarea } from "@/components/ui/textarea";
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
import { useTranslations } from "next-intl";

const tournamentSeriesFormSchema = z.object({
  name: z
    .string()
    .min(1, "admin.tournaments.form.series.validation.name_required"),
  description: z.string().optional(),
  displayOrder: z
    .number()
    .int("admin.tournaments.form.series.validation.display_order_required")
    .positive(
      "admin.tournaments.form.series.validation.display_order_positive",
    ),
  ownerId: z.string().optional(),
});

type TournamentSeriesFormData = z.infer<typeof tournamentSeriesFormSchema>;

interface TournamentSeriesSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TournamentSeriesSelector({
  value,
  onChange,
}: TournamentSeriesSelectorProps) {
  const t = useTranslations("admin.tournaments.form.series");

  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // tRPC queries
  const {
    data: tournamentSeries = [],
    refetch: refetchSeries,
    isLoading: seriesLoading,
  } = api.tournaments.series.list.useQuery();

  // TODO: Add owner selection, for now we don't need it as there is no
  // const { data: users = [], isLoading: usersLoading } =
  //   api.users.list.useQuery();

  // tRPC mutations
  const createSeriesMutation = api.tournaments.series.create.useMutation({
    onSuccess: (newSeries) => {
      toast.success(t("toast.create_success"));
      void refetchSeries();
      onChange(newSeries.id);
      setDrawerOpen(false);
      seriesForm.reset({
        name: "",
        description: "",
        displayOrder: tournamentSeries.length + 1,
        ownerId: undefined,
      });
    },
    onError: (error) => {
      toast.error(`${t("toast.create_error")} ${error.message}`);
    },
  });

  const seriesForm = useForm<TournamentSeriesFormData>({
    resolver: zodResolver(tournamentSeriesFormSchema),
    defaultValues: {
      name: "",
      description: "",
      displayOrder: tournamentSeries.length + 1,
      ownerId: undefined,
    },
  });

  const onCreateSeries = (data: TournamentSeriesFormData) => {
    createSeriesMutation.mutate(data);
  };

  const selectedSeries = tournamentSeries.find((series) => series.id === value);

  const handleCreateNewClick = () => {
    setOpen(false);
    // Update display order to be current length + 1
    seriesForm.setValue("displayOrder", tournamentSeries.length + 1);
    setDrawerOpen(true);
  };

  if (seriesLoading) {
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
            {selectedSeries
              ? selectedSeries.name
              : t("select_placeholder")}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={t("search_placeholder")} />
            <CommandList>
              <CommandEmpty>{t("no_series_found")}</CommandEmpty>
              <CommandGroup>
                {tournamentSeries.map((series) => (
                  <CommandItem
                    key={series.id}
                    value={series.name}
                    onSelect={() => {
                      onChange(series.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === series.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{series.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {series.description}
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

      {/* Drawer for creating new series */}
      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("create_title")}</DrawerTitle>
            <DrawerDescription>
              {t("create_description")}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            <Form {...seriesForm}>
              <form
                onSubmit={seriesForm.handleSubmit(onCreateSeries)}
                className="space-y-4"
              >
                <FormField
                  control={seriesForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("name")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("name_placeholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={seriesForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("description")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("description_placeholder")}
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* TODO: Add owner selection, for nowe we don't need it as there is no */}
                {/* feature connected with this field */}
                {/* <FormField
                  control={seriesForm.control}
                  name="ownerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select owner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {usersLoading ? (
                            <SelectItem
                              value=""
                              disabled
                            >
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading users...
                            </SelectItem>
                          ) : (
                            users.map((user) => (
                              <SelectItem
                                key={user.id}
                                value={user.id}
                              >
                                {user.name ?? "Unknown User"}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                <FormField
                  control={seriesForm.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("display_order")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value) : 1,
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {t("display_order_description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
          <DrawerFooter>
            <Button
              onClick={seriesForm.handleSubmit(onCreateSeries)}
              disabled={createSeriesMutation.isPending}
            >
              {createSeriesMutation.isPending ? (
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
