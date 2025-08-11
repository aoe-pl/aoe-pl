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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { TournamentParticipantsSelector } from "./tournament-participants-selector";
import { DrawerFooter } from "@/components/ui/drawer";

type TournamentGroupFormProps = {
  initialData?: TournamentGroupWithParticipants;
  onSubmit: (data: TournamentGroupFormSchema) => void;
  onCancel: () => void;
  groups?: TournamentGroup[];
  isPending?: boolean;
  tournamentId: string;
  defaultIsTeamBased: boolean;
  defaultMatchModeId: string;
};

export function TournamentGroupForm({
  initialData,
  onSubmit,
  onCancel,
  groups = [],
  isPending,
  tournamentId,
  defaultIsTeamBased,
  defaultMatchModeId,
}: TournamentGroupFormProps) {
  const { data: stages } = api.tournaments.stages.list.useQuery({
    tournamentId,
  });

  const { data: participants } = api.tournaments.participants.list.useQuery({
    tournamentId,
    includeUser: true,
  });

  const form = useForm<TournamentGroupFormSchema>({
    resolver: zodResolver(tournamentGroupFormSchema),
    defaultValues: {
      stageId: initialData?.stageId ?? "",
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      displayOrder: initialData?.displayOrder ?? groups.length,
      isTeamBased: initialData?.isTeamBased ?? defaultIsTeamBased,
      isMixed: initialData?.isMixed ?? false,
      matchModeId: initialData?.matchModeId ?? defaultMatchModeId,
      color: initialData?.color ?? "",
      participantIds:
        initialData?.TournamentGroupParticipant?.map(
          (p) => p.tournamentParticipantId,
        ) ?? [],
    },
  });

  const handleSubmit = (data: TournamentGroupFormSchema) => {
    onSubmit({
      ...data,
      matchModeId:
        data.matchModeId === defaultMatchModeId ? undefined : data.matchModeId,
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
              name="stageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {stages?.map((stage) => (
                          <SelectItem
                            key={stage.id}
                            value={stage.id}
                          >
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormLabel>Match Mode (Optional)</FormLabel>
                  <FormControl>
                    <TournamentMatchModeSelector
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      allowClear
                      defaultMatchModeId={defaultMatchModeId}
                    />
                  </FormControl>
                  <FormDescription>
                    Override the tournament's default match mode for this group.
                    If not set, the tournament's default will be used.
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
