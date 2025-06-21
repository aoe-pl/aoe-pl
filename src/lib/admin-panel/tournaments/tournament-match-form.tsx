"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type TournamentMatchFormSchema, matchStatuses } from "./tournament";
import { GameDisplay } from "./groups-detail/game-display";
import type { ExtendedTournamentMatch } from "./groups-detail/match";
import { Calendar24 } from "@/components/ui/calendar-24";
import { TournamentParticipantsSelector } from "./tournament-participants-selector";
import { api } from "@/trpc/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type TournamentMatchData = TournamentMatchFormSchema & {
  id?: string;
};

interface TournamentMatchFormProps {
  initialData?: ExtendedTournamentMatch;
  onSubmit: (data: TournamentMatchData) => void;
  onCancel: () => void;
  isPending?: boolean;
  groupId?: string;
}

export function TournamentMatchForm({
  initialData,
  onSubmit,
  onCancel,
  isPending,
  groupId,
}: TournamentMatchFormProps) {
  // Fetch participants for the group (only for new matches)
  const { data: participants = [], isLoading: participantsLoading } = api.tournaments.groups.getParticipants.useQuery(
    { groupId: groupId ?? initialData?.groupId ?? "" },
    { enabled: !!(groupId ?? initialData?.groupId) && !initialData }
  );

  // Fetch group information to check if it's team-based
  const { data: groupInfo } = api.tournaments.groups.get.useQuery(
    { id: groupId ?? initialData?.groupId ?? "" },
    { enabled: !!(groupId ?? initialData?.groupId) && !initialData }
  );

  const form = useForm<TournamentMatchData>({
    defaultValues: {
      id: initialData?.id ?? "",
      groupId: groupId ?? initialData?.groupId ?? "",
      matchDate: initialData?.matchDate
        ? new Date(initialData.matchDate)
        : undefined,
      civDraftKey: initialData?.civDraftKey ?? "",
      mapDraftKey: initialData?.mapDraftKey ?? "",
      status: initialData?.status ?? "SCHEDULED",
      comment: initialData?.comment ?? "",
      adminComment: initialData?.adminComment ?? "",
      participantIds: [],
      teamIds: [],
    },
  });

  const handleSubmit = (data: TournamentMatchData) => {
    // Only validate participants for new matches
    if (!initialData) {
      const participantCount = (data.participantIds?.length ?? 0) + (data.teamIds?.length ?? 0);
      
      // Validation: Must be 0, 2, or even number for team-based tournaments
      if (participantCount === 1) {
        toast.error("A match must have 0, 2, or an even number of participants");
        return;
      }
      
      if (groupInfo?.isTeamBased && participantCount > 0 && participantCount % 2 !== 0) {
        toast.error("Team-based tournaments require an even number of participants");
        return;
      }
    }

    onSubmit(data);
  };

  return (
    <ScrollArea className="h-[60vh] px-4">
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit(handleSubmit)(e);
          }}
          className="space-y-6"
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="matchDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Match Date & Time</FormLabel>
                  <FormControl>
                    <Calendar24
                      date={field.value}
                      onDateChange={(date) => {
                        if (date && field.value) {
                          // Preserve the time from the current value
                          const currentTime = field.value;
                          date.setHours(
                            currentTime.getHours(),
                            currentTime.getMinutes(),
                            currentTime.getSeconds(),
                          );
                        }
                        field.onChange(date);
                      }}
                      onTimeChange={(time) => {
                        if (field.value && time) {
                          const [hours, minutes, seconds] = time.split(":");
                          if (hours && minutes && seconds) {
                            const newDate = new Date(field.value);
                            newDate.setHours(
                              parseInt(hours),
                              parseInt(minutes),
                              parseInt(seconds),
                            );
                            field.onChange(newDate);
                          }
                        } else if (!field.value && time) {
                          // If no date is set, create a new date with today's date and the selected time
                          const [hours, minutes, seconds] = time.split(":");
                          if (hours && minutes && seconds) {
                            const newDate = new Date();
                            newDate.setHours(
                              parseInt(hours),
                              parseInt(minutes),
                              parseInt(seconds),
                            );
                            field.onChange(newDate);
                          }
                        }
                      }}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    When this match is scheduled to take place
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Match Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select match status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {matchStatuses.map((status) => (
                        <SelectItem
                          key={status.value}
                          value={status.value}
                        >
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Current status of the match</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Only show participant selection for new matches */}
            {!initialData && (
              <FormField
                control={form.control}
                name="participantIds"
                render={({ field }) => {
                  const participantCount = (field.value?.length ?? 0) + (form.watch("teamIds")?.length ?? 0);
                  
                  return (
                    <FormItem>
                      <FormLabel>Participants</FormLabel>
                      <FormControl>
                        <TournamentParticipantsSelector
                          value={field.value ?? []}
                          onChange={field.onChange}
                          participants={participants}
                          isLoading={participantsLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Select participants for this match
                      </FormDescription>
                      
                      {/* Validation display */}
                      <div className="mt-2">
                        <div className="text-sm text-muted-foreground">
                          Selected: {participantCount} participant{participantCount !== 1 ? 's' : ''}
                        </div>
                        {participantCount === 1 && (
                          <Alert className="mt-2 border-orange-200 bg-orange-50">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                              A match must have 0, 2, or an even number of participants
                            </AlertDescription>
                          </Alert>
                        )}
                        {groupInfo?.isTeamBased && participantCount > 0 && participantCount % 2 !== 0 && (
                          <Alert className="mt-2 border-orange-200 bg-orange-50">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                              Team-based tournaments require an even number of participants
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}

            <FormField
              control={form.control}
              name="civDraftKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Civilization Draft Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter civilization draft key"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Key for civilization draft (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mapDraftKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Map Draft Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter map draft key"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Key for map draft (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Public Comment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter public comment"
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Public comment visible to all users
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adminComment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Comment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter admin comment"
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Private comment visible only to admins
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display games if editing existing match */}
            {initialData?.Game && initialData.Game.length > 0 && (
              <FormItem>
                <FormLabel>Games</FormLabel>
                <GameDisplay games={initialData.Game} />
              </FormItem>
            )}
          </div>

          <DrawerFooter className="px-0">
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending
                ? "Saving..."
                : initialData
                  ? "Update Match"
                  : "Add Match"}
            </Button>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </Form>
    </ScrollArea>
  );
}
