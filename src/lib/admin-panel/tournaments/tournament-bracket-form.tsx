"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

export type TournamentBracketEditData = TournamentBracket & {
  entrantIds: string[];
  hasResults: boolean;
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
  const { data: allStages } = api.tournaments.stages.list.useQuery({
    tournamentId,
  });

  // Brackets only make sense within BRACKET-type stages.
  const stages = allStages?.filter((stage) => stage.type === "BRACKET");

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
      stageId: initialData?.stageId ?? "",
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      displayOrder: initialData?.displayOrder ?? brackets.length,
      bracketType: initialData?.bracketType ?? BracketType.SINGLE_ELIMINATION,
      bracketSize: initialData?.bracketSize ?? 8,
      isSeeded: initialData?.isSeeded ?? true,
      entrantIds: initialData?.entrantIds ?? [],
    },
  });

  const hasResults = initialData?.hasResults ?? false;

  const stageId = form.watch("stageId");
  const selectedStage = stages?.find((stage) => stage.id === stageId);

  // Bracket type lives on the stage, not on the bracket. Keep the hidden
  // form field in sync so the submitted payload always matches the stage.
  useEffect(() => {
    if (selectedStage?.bracketType) {
      form.setValue("bracketType", selectedStage.bracketType);
    }
  }, [selectedStage?.id, selectedStage?.bracketType, form]);

  const handleSubmit = (data: TournamentBracketFormSchema) => {
    onSubmit({
      ...data,
      description: data.description ?? undefined,
      entrantIds: hasResults ? undefined : (data.entrantIds ?? []),
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
                  <FormDescription>
                    Bracket type comes from the stage:{" "}
                    {selectedStage?.bracketType
                      ? bracketTypesLabels[selectedStage.bracketType]
                      : "—"}
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
              name="isSeeded"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={hasResults}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Standard Seeding</FormLabel>
                    <FormDescription>
                      Use standard tournament seeding (top seeds avoid each
                      other early). If disabled, entrants are paired
                      sequentially in the order below.
                    </FormDescription>
                  </div>
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
                    {hasResults ? (
                      <p className="text-muted-foreground text-sm">
                        Entrants can no longer be changed once matches have
                        results. Delete and recreate the bracket instead.
                      </p>
                    ) : (
                      <BracketEntrantsSelector
                        value={field.value ?? []}
                        onChange={field.onChange}
                        options={entrantOptions}
                        isLoading={
                          isTeamBased ? teamsLoading : participantsLoading
                        }
                      />
                    )}
                  </FormControl>
                  <FormDescription>
                    These are the bracket&apos;s participants. They are not
                    placed into matches here - assign them to round-1 matches
                    from the bracket view (auto-allocate, random, or per
                    match). Order determines seed order.
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
