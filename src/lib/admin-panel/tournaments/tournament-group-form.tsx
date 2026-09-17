"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TournamentMatchModeSelector } from "./tournament-match-mode-selector";
import {
  tournamentGroupFormSchema,
  type TournamentGroup,
  type TournamentGroupFormSchema,
  type TournamentGroupWithParticipants,
} from "./tournament";
import { Checkbox } from "@/components/ui/checkbox";
import { TournamentParticipantsSelector } from "./tournament-participants-selector";
import { DrawerFooter } from "@/components/ui/drawer";
import { useEffect } from "react";

type TournamentGroupFormProps = {
  initialData?: TournamentGroupWithParticipants;
  onSubmit: (data: TournamentGroupFormSchema) => void;
  onCancel: () => void;
  groups?: TournamentGroup[];
  isPending?: boolean;
  tournamentId: string;
  defaultIsTeamBased: boolean;
};

export function TournamentGroupForm({
  initialData,
  onSubmit,
  onCancel,
  groups = [],
  isPending,
  tournamentId,
  defaultIsTeamBased,
}: TournamentGroupFormProps) {
  const { data: participants } = api.tournaments.participants.list.useQuery({
    tournamentId,
    includeUser: true,
  });

  const { data: matchModes = [] } = api.tournaments.matchMode.list.useQuery();

  const form = useForm<TournamentGroupFormSchema>({
    resolver: zodResolver(tournamentGroupFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      displayOrder: initialData?.displayOrder ?? groups.length,
      isTeamBased: initialData?.isTeamBased ?? defaultIsTeamBased,
      isMixed: initialData?.isMixed ?? false,
      matchModeId: initialData?.matchModeId ?? "",
      color: initialData?.color ?? "",
      participantIds:
        initialData?.TournamentGroupParticipant?.map(
          (p) => p.tournamentParticipantId,
        ) ?? [],
    },
  });

  // No tournament-level default anymore: default to the first available
  // match mode so every group carries an explicit one.
  useEffect(() => {
    if (!form.getValues("matchModeId") && matchModes.length > 0) {
      form.setValue("matchModeId", matchModes[0]!.id);
    }
  }, [matchModes, form]);

  const handleSubmit = (data: TournamentGroupFormSchema) => {
    onSubmit({
      ...data,
      // TODO: Add team based tournament currently we only set team based when we create mix teams!
      // team based should be isTeamBased: data.isTeamBased === defaultTeamBased ? undefined : data.isTeamBased,
      // because it should by default inherit from tournament team based setting!
      // if adding it remember to update the tournament form! src/lib/admin-panel/tournaments/tournament-form.tsx
      isTeamBased: data.isMixed,
      // when team based are support isMixed is always false when not team based group!
      isMixed: data.isMixed,
      color: data.color ?? undefined,
      participantIds: data.participantIds ?? [],
    });
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter group name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter group description"
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
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
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Match mode (Best of / Play All) for this group&apos;s
                    matches.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Order in which this group appears in the tournament
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* TODO: Add team based tournament */}
            {/* <FormField
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
                      Override tournament's team-based setting. If not set, the
                      tournament's default will be used.
                    </FormDescription>
                  </div>
                </FormItem>
              )} */}
            {/* /> */}

            <FormField
              control={form.control}
              name="isMixed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Mixed Teams</FormLabel>
                    <FormDescription>
                      Enable mixed teams where team compositions can change for
                      each game. Players can be grouped into different teams for
                      each match.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Color</FormLabel>
                  <FormControl>
                    <Input
                      type="color"
                      placeholder="#000000"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Choose a color to visually distinguish this group
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="participantIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Participants</FormLabel>
                  <FormControl>
                    <TournamentParticipantsSelector
                      value={field.value ?? []}
                      onChange={field.onChange}
                      participants={participants ?? []}
                      isLoading={!participants}
                      initialParticipantData={
                        initialData?.TournamentGroupParticipant
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Select participants to include in this group
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DrawerFooter className="flex-row justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? "Saving..." : initialData ? "Update" : "Create"}
            </Button>
          </DrawerFooter>
        </form>
      </Form>
    </ScrollArea>
  );
}
