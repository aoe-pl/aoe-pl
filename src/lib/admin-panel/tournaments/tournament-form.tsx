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
import { type TournamentStatus, type RegistrationMode } from "./tournament";
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
import { useForm } from "react-hook-form";
import { TournamentSeriesSelector } from "./tournament-series-selector";
import { TournamentMatchModeSelector } from "./tournament-match-mode-selector";

// turn into zod schema and extract
type TournamentFormData = {
  name: string;
  urlKey: string;
  tournamentSeriesId: string;
  matchModeId: string;
  registrationMode: RegistrationMode;
  description: string;
  isTeamBased: boolean;
  startDate: string;
  endDate?: string;
  participantsLimit?: number;
  registrationStartDate?: string;
  registrationEndDate?: string;
  status: TournamentStatus;
  isVisible: boolean;
  // additional:
  // stages
};

const registrationModes: { value: RegistrationMode; label: string }[] = [
  { value: "INDIVIDUAL" as const, label: "Individual" },
  { value: "TEAM" as const, label: "Team" },
  { value: "ADMIN" as const, label: "Admin Only" },
];

const tournamentStatuses: { value: TournamentStatus; label: string }[] = [
  { value: "PENDING" as const, label: "Pending" },
  { value: "ACTIVE" as const, label: "Active" },
  { value: "FINISHED" as const, label: "Finished" },
  { value: "CANCELLED" as const, label: "Cancelled" },
];

export function TournamentForm() {
  const form = useForm<TournamentFormData>({
    defaultValues: {
      name: "",
      urlKey: "",
      tournamentSeriesId: "",
      matchModeId: "",
      registrationMode: "INDIVIDUAL",
      description: "",
      isTeamBased: false,
      startDate: "",
      endDate: "",
      participantsLimit: 32,
      registrationStartDate: "",
      registrationEndDate: "",
      status: "PENDING",
      isVisible: false,
    },
  });

  const onSubmit = (data: TournamentFormData) => {
    console.log("Tournament form data:", data);
    // This would normally submit to the backend
  };

  return (
    <div className="flex flex-col gap-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tournament Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter tournament name" {...field} />
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
                  <Input placeholder="tournament-url-key" {...field} />
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
                      <SelectItem key={mode.value} value={mode.value}>
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
                      <SelectItem key={status.value} value={status.value}>
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
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date (Optional)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
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
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : undefined,
                      )
                    }
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
              <FormItem>
                <FormLabel>Registration Start Date (Optional)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="registrationEndDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration End Date (Optional)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isTeamBased"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Team Based</FormLabel>
                  <FormDescription>
                    Tournament allows team participation
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isVisible"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Visible to Public</FormLabel>
                  <FormDescription>
                    Tournament will be visible on the website
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </div>
  );
}
