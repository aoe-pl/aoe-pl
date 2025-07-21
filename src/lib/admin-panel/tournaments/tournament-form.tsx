"use client";

import {
  FormMessage,
  FormDescription,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Form,
} from "@/components/ui/form";
import { type tournamentFormSchema, TournamentStatus } from "./tournament";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TournamentSeriesSelector } from "./tournament-series-selector";
import { TournamentMatchModeSelector } from "./tournament-match-mode-selector";
import type { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { formatTournamentStatusLabel } from "@/lib/helpers/tournament-status";

type TournamentFormData = z.infer<typeof tournamentFormSchema>;

type TournamentFormProps = {
  onSubmit: (data: TournamentFormData) => void;
  form: UseFormReturn<TournamentFormData>;
  isPending: boolean;
};

export function TournamentForm({
  onSubmit,
  form,
  isPending,
}: TournamentFormProps) {
  const t = useTranslations("admin.tournaments.form");
  const tGlobal = useTranslations();

  // Create tournament statuses with translated labels
  const tournamentStatuses = [
    {
      value: TournamentStatus.PENDING,
      label: formatTournamentStatusLabel(TournamentStatus.PENDING, tGlobal),
    },
    {
      value: TournamentStatus.ACTIVE,
      label: formatTournamentStatusLabel(TournamentStatus.ACTIVE, tGlobal),
    },
    {
      value: TournamentStatus.FINISHED,
      label: formatTournamentStatusLabel(TournamentStatus.FINISHED, tGlobal),
    },
    {
      value: TournamentStatus.CANCELLED,
      label: formatTournamentStatusLabel(TournamentStatus.CANCELLED, tGlobal),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <FormField
            control={form.control}
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
            control={form.control}
            name="tournamentSeriesId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("tournament_series")}</FormLabel>
                <FormControl>
                  <TournamentSeriesSelector
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  {t("tournament_series_description")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="matchModeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("match_mode_label")}</FormLabel>
                <FormControl>
                  <TournamentMatchModeSelector
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>{t("match_mode_description")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="urlKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("url_key")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("url_key_placeholder")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>{t("url_key_description")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("description")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("description_placeholder")}
                    className="min-h-24"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("status")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("status_placeholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tournamentStatuses.map((status) => (
                      <SelectItem
                        key={status.value}
                        value={status.value}
                      >
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("start_date")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>{t("start_date_placeholder")}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      captionLayout="dropdown"
                      className="min-w-[300px]"
                      startMonth={new Date(new Date().getFullYear() - 1, 0, 1)}
                      endMonth={new Date(new Date().getFullYear() + 1, 11, 31)}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("end_date")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>{t("end_date_placeholder")}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      captionLayout="dropdown"
                      className="min-w-[300px]"
                      startMonth={new Date(new Date().getFullYear() - 1, 0, 1)}
                      endMonth={new Date(new Date().getFullYear() + 1, 11, 31)}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="participantsLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("participants_limit")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t("participants_limit_placeholder")}
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) {
                        field.onChange(undefined);
                      } else {
                        field.onChange(parseInt(value));
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="registrationStartDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("registration_start_date")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>
                            {t("registration_start_date_placeholder")}
                          </span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      captionLayout="dropdown"
                      className="min-w-[300px]"
                      startMonth={new Date(new Date().getFullYear() - 1, 0, 1)}
                      endMonth={new Date(new Date().getFullYear() + 1, 11, 31)}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="registrationEndDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("registration_end_date")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>{t("registration_end_date_placeholder")}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      captionLayout="dropdown"
                      className="min-w-[300px]"
                      startMonth={new Date(new Date().getFullYear() - 1, 0, 1)}
                      endMonth={new Date(new Date().getFullYear() + 1, 11, 31)}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* TODO: Add team based tournament */}
          {/* when added remember to update the tournament group form! src/lib/admin-panel/tournaments/tournament-group-form.tsx */}

          {/* <FormField
            control={form.control}
            name="isTeamBased"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    {t("team_based")}
                    <FormDescription>
                      {t("team_based_description")}
                    </FormDescription>
                  </div>
                </FormLabel>
              </FormItem>
            )}
          /> */}

          <FormField
            control={form.control}
            name="isVisible"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    {t("visible_to_public")}
                    <FormDescription>
                      {t("visible_to_public_description")}
                    </FormDescription>
                  </div>
                </FormLabel>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isPending}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("creating_tournament")}
              </>
            ) : (
              t("create_tournament")
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
