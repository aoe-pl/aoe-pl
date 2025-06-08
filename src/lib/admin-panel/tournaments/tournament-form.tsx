"use client";

import {
  Form,
  FormMessage,
  FormDescription,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  TournamentStatus,
  RegistrationMode,
  getRegistrationModeLabel,
  TournamentStageType,
  getTournamentStatusLabel,
  tournamentFormSchema,
} from "./tournament";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TournamentSeriesSelector } from "./tournament-series-selector";
import { TournamentMatchModeSelector } from "./tournament-match-mode-selector";
import { TournamentStageManager } from "./tournament-stage-manager";
import { api } from "@/trpc/react";
import { toast } from "sonner";

type TournamentFormData = z.infer<typeof tournamentFormSchema>;

const registrationModes: { value: RegistrationMode; label: string }[] = [
  {
    value: RegistrationMode.INDIVIDUAL,
    label: getRegistrationModeLabel(RegistrationMode.INDIVIDUAL),
  },
  {
    value: RegistrationMode.TEAM,
    label: getRegistrationModeLabel(RegistrationMode.TEAM),
  },
  {
    value: RegistrationMode.ADMIN,
    label: getRegistrationModeLabel(RegistrationMode.ADMIN),
  },
];

const tournamentStatuses: { value: TournamentStatus; label: string }[] = [
  {
    value: TournamentStatus.PENDING,
    label: getTournamentStatusLabel(TournamentStatus.PENDING),
  },
  {
    value: TournamentStatus.ACTIVE,
    label: getTournamentStatusLabel(TournamentStatus.ACTIVE),
  },
  {
    value: TournamentStatus.FINISHED,
    label: getTournamentStatusLabel(TournamentStatus.FINISHED),
  },
  {
    value: TournamentStatus.CANCELLED,
    label: getTournamentStatusLabel(TournamentStatus.CANCELLED),
  },
];

export function TournamentForm() {
  const form = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: "",
      urlKey: "",
      tournamentSeriesId: "",
      matchModeId: "",
      registrationMode: RegistrationMode.INDIVIDUAL,
      description: "",
      isTeamBased: false,
      startDate: undefined,
      endDate: undefined,
      participantsLimit: undefined,
      registrationStartDate: undefined,
      registrationEndDate: undefined,
      status: TournamentStatus.PENDING,
      isVisible: false,
      stages: [
        {
          name: "Group Stage",
          type: TournamentStageType.GROUP,
          isActive: true,
          description: "Standard group stage",
          isSeeded: true,
        },
      ],
    },
  });

  // tRPC mutation for creating tournament
  const createTournamentMutation = api.tournaments.create.useMutation({
    onSuccess: (data) => {
      toast.success("Tournament created successfully!");
      // Reset form after successful creation
      form.reset();
    },
    onError: (error) => {
      toast.error(`Failed to create tournament: ${error.message}`);
    },
  });

  const onSubmit = (data: TournamentFormData) => {
    createTournamentMutation.mutate(data);
  };

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
                <FormLabel>Tournament Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter tournament name"
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
                <FormLabel>Tournament Series</FormLabel>
                <FormControl>
                  <TournamentSeriesSelector
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Select the tournament series this tournament belongs to
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
                <FormLabel>Match Mode</FormLabel>
                <FormControl>
                  <TournamentMatchModeSelector
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Select the match format for tournament games
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="urlKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Key</FormLabel>
                <FormControl>
                  <Input
                    placeholder="tournament-url-key"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Used in the tournament URL. Use lowercase letters, numbers,
                  and hyphens.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter tournament description"
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
            name="registrationMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration Mode</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select registration mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {registrationModes.map((mode) => (
                      <SelectItem
                        key={mode.value}
                        value={mode.value}
                      >
                        {mode.label}
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
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
                <FormLabel>Start Date</FormLabel>
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
                          <span>Pick a start date</span>
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
                <FormLabel>End Date (Optional)</FormLabel>
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
                          <span>Pick an end date</span>
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
                <FormLabel>Participants Limit</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="32"
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
                <FormLabel>Registration Start Date (Optional)</FormLabel>
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
                          <span>Pick a registration start date</span>
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
                <FormLabel>Registration End Date (Optional)</FormLabel>
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
                          <span>Pick a registration end date</span>
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
                    Team Based
                    <FormDescription>
                      Tournament allows team participation
                    </FormDescription>
                  </div>
                </FormLabel>
              </FormItem>
            )}
          />

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
                    Visible to Public
                    <FormDescription>
                      Tournament will be visible on the website
                    </FormDescription>
                  </div>
                </FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stages"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <TournamentStageManager
                    stages={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Configure the stages of your tournament (group stage,
                  brackets, etc.)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={createTournamentMutation.isPending}
            className="w-full"
          >
            {createTournamentMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Tournament...
              </>
            ) : (
              "Create Tournament"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
