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
