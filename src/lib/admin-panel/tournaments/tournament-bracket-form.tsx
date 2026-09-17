"use client";

import { Button } from "@/components/ui/button";
import { DrawerFooter } from "@/components/ui/drawer";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { TournamentMatchModeSelector } from "./tournament-match-mode-selector";
import {
  BracketEntrantsSelector,
  type BracketEntrantOption,
} from "./bracket-entrants-selector";
import {
  BracketType,
  bracketTypesLabels,
  tournamentBracketFormSchema,
  type TournamentBracket,
  type TournamentBracketFormSchema,
} from "./tournament";

const BRACKET_SIZE_OPTIONS = [2, 4, 8, 16, 32, 64, 128];

const ROUND_MODE_FIELDS: {
  key: "standard" | "semifinal" | "final";
  label: string;
}[] = [
  { key: "standard", label: "Standard (all other rounds)" },
  { key: "semifinal", label: "Semifinal" },
  { key: "final", label: "Final" },
];

/** Sensible defaults when no round mode is set yet: Best of 3/5/7. */
const DEFAULT_ROUND_GAME_COUNTS = {
  standard: 3,
  semifinal: 5,
  final: 7,
} as const;

export type TournamentBracketEditData = TournamentBracket & {
  entrantIds: string[];
  hasResults: boolean;
  allocatedEntrantIds: string[];
};

type TournamentBracketFormProps = {
  initialData?: TournamentBracketEditData;
  onSubmit: (data: TournamentBracketFormSchema) => void;
  onCancel: () => void;
  brackets?: TournamentBracket[];
  isPending?: boolean;
  tournamentId: string;
  isTeamBased: boolean;
};

export function TournamentBracketForm({
  initialData,
  onSubmit,
  onCancel,
  brackets = [],
  isPending,
  tournamentId,
  isTeamBased,
}: TournamentBracketFormProps) {
  const { data: participants, isLoading: participantsLoading } =
    api.tournaments.participants.list.useQuery(
      { tournamentId, includeUser: true },
      { enabled: !isTeamBased },
    );

  const { data: teams, isLoading: teamsLoading } =
    api.tournaments.teams.list.useQuery(
      { tournamentId },
      { enabled: isTeamBased },
    );

  const entrantOptions: BracketEntrantOption[] = isTeamBased
    ? (teams ?? []).map((team) => ({ id: team.id, label: team.name }))
    : (participants ?? []).map((p) => ({ id: p.id, label: p.nickname }));

  const form = useForm<TournamentBracketFormSchema>({
    resolver: zodResolver(tournamentBracketFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      displayOrder: initialData?.displayOrder ?? brackets.length,
      bracketType: initialData?.bracketType ?? BracketType.SINGLE_ELIMINATION,
      bracketSize: initialData?.bracketSize ?? 8,
      roundBestOfs:
        (initialData?.roundBestOfs as
          | { standard?: string; semifinal?: string; final?: string }
          | null
          | undefined) ?? {},
      entrantIds: initialData?.entrantIds ?? [],
    },
  });

  const hasResults = initialData?.hasResults ?? false;

  // Roster members not yet placed in any match may be removed.
  const removableIds = initialData
    ? initialData.entrantIds.filter(
        (id) => !initialData.allocatedEntrantIds.includes(id),
      )
    : undefined;

  const roundBestOfs = form.watch("roundBestOfs") ?? {};

  const { data: matchModes = [] } = api.tournaments.matchMode.list.useQuery();

  // Preselect Best of 3/5/7 by default; keep any saved round modes.
  useEffect(() => {
    if (matchModes.length === 0) return;
    const findMode = (gameCount: number) =>
      matchModes.find((m) => m.mode === "BEST_OF" && m.gameCount === gameCount);
    const current = form.getValues("roundBestOfs") ?? {};
    const next = { ...current };
    let changed = false;
    for (const [tier, gameCount] of Object.entries(
      DEFAULT_ROUND_GAME_COUNTS,
    ) as [keyof typeof DEFAULT_ROUND_GAME_COUNTS, number][]) {
      if (!next[tier]) {
        const mode = findMode(gameCount);
        if (mode) {
          next[tier] = mode.id;
          changed = true;
        }
      }
    }
    if (changed) form.setValue("roundBestOfs", next);
  }, [matchModes, form]);

  // Bracket type is set per bracket.

  const handleSubmit = (data: TournamentBracketFormSchema) => {
    onSubmit({
      ...data,
      description: data.description ?? undefined,
      entrantIds: data.entrantIds ?? [],
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
              name="bracketType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bracket Type</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={hasResults}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bracket type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(BracketType).map((type) => (
                          <SelectItem
                            key={type}
                            value={type}
                          >
                            {bracketTypesLabels[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Single or double elimination. Cannot be changed once matches
                    have results.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bracket Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter bracket name"
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
                      placeholder="Enter bracket description"
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bracketSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bracket Size</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(v) => field.onChange(parseInt(v))}
                      defaultValue={field.value.toString()}
                      disabled={hasResults}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bracket size" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRACKET_SIZE_OPTIONS.map((size) => (
                          <SelectItem
                            key={size}
                            value={size.toString()}
                          >
                            {size} slots
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Total number of slots in the bracket (must be a power of
                    two). Entrants beyond this number cannot be added.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roundBestOfs"
              render={() => (
                <FormItem>
                  <FormLabel>Match Mode (per tier)</FormLabel>
                  <div className="space-y-3">
                    {ROUND_MODE_FIELDS.map((field) => (
                      <div
                        key={field.key}
                        className="space-y-1"
                      >
                        <span className="text-sm font-medium">
                          {field.label}
                        </span>
                        <TournamentMatchModeSelector
                          value={roundBestOfs[field.key] ?? ""}
                          onChange={(id) =>
                            form.setValue("roundBestOfs", {
                              ...roundBestOfs,
                              [field.key]: id,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <FormDescription>
                    Match mode (Best of / Play All) per tier. All standard
                    rounds share one mode; semifinal and final can differ. Saved
                    matches are updated accordingly.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="entrantIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Participants (bracket pool)</FormLabel>
                  <FormControl>
                    <BracketEntrantsSelector
                      value={field.value ?? []}
                      onChange={field.onChange}
                      options={entrantOptions}
                      isLoading={
                        isTeamBased ? teamsLoading : participantsLoading
                      }
                      removableIds={removableIds}
                    />
                  </FormControl>
                  <FormDescription>
                    Participants can be added or removed at any time while they
                    are not yet placed in a match - they are not placed into
                    matches here. Assign them to round-1 matches from the
                    bracket view (auto-allocate, random, or per match). Once
                    assigned to a match, they can no longer be removed.
                    Selection order determines seed order.
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
