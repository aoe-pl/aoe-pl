"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Game, Map } from "@prisma/client";

const gameParticipantSchema = z.object({
  matchParticipantId: z.string().min(1, "Player is required"),
  civId: z.string().optional(),
  isWinner: z.boolean(),
});

const gameSchema = z.object({
  mapId: z.string().min(1, "Map is required"),
  participants: z
    .array(gameParticipantSchema)
    .min(1, "At least one participant required"),
});

const formSchema = z.object({
  games: z.array(gameSchema),
  applyScore: z.boolean(),
});

type GameFormValues = z.infer<typeof formSchema>;

type FormGameParticipant = {
  matchParticipantId: string;
  civId?: string;
  isWinner: boolean;
};

export type GameType = Game & {
  participants: FormGameParticipant[];
  map: Map;
};

interface AvailableUser {
  id: string;
  name: string;
  matchParticipantId: string;
}

interface TournamentGameFormProps {
  onCancel: () => void;
  matchMode: { id: string; mode: string; gameCount: number };
  games: GameType[];
  matchId: string;
  availableUsers: AvailableUser[];
}

export function TournamentGameForm({
  onCancel,
  matchMode,
  games,
  matchId,
  availableUsers,
}: TournamentGameFormProps) {
  const router = useRouter();
  const { data: maps, isLoading: mapsLoading } = api.maps.list.useQuery();
  const { data: civs, isLoading: civsLoading } = api.civs.list.useQuery();

  const maxGames = matchMode.gameCount ?? 1;

  const form = useForm<GameFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      games: [],
      applyScore: true,
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "games",
  });

  // Initialize games based on existing games or create empty ones
  useEffect(() => {
    const existingGames = games.map((g) => ({
      mapId: g.mapId,
      participants: g.participants.map((p) => ({
        matchParticipantId: p.matchParticipantId ?? "",
        civId: p.civId ?? "none",
        isWinner: p.isWinner,
      })),
    }));

    // Fill up to maxGames with empty games if needed
    const gamesToShow = Array.from(
      { length: maxGames },
      (_, index) =>
        existingGames[index] ?? {
          mapId: "",
          participants: [
            {
              matchParticipantId: "",
              civId: "none",
              isWinner: false,
            },
          ],
        },
    );

    replace(gamesToShow);
  }, [games, maxGames, replace]);

  const { mutate: manageGames, isPending } =
    api.tournaments.matches.manageGames.useMutation({
      onSuccess: () => {
        toast.success("Games updated successfully.");
        router.refresh();
        onCancel();
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  function onSubmit(data: GameFormValues) {
    // Filter out games with no participants or no map

    console.log("submit", data);

    const validGames = data.games
      .filter(
        (game) =>
          game.mapId && game.participants.some((p) => p.matchParticipantId),
      )
      .map((game) => ({
        ...game,
        participants: game.participants
          .filter((p) => p.matchParticipantId)
          .map((p) => ({
            ...p,
            civId: p.civId === "none" ? undefined : p.civId,
          })),
      }));

    manageGames({
      matchId,
      games: validGames,
      applyScore: data.applyScore,
    });
  }

  const addParticipant = (gameIndex: number) => {
    const currentGame = form.getValues(`games.${gameIndex}`);
    form.setValue(`games.${gameIndex}.participants`, [
      ...currentGame.participants,
      {
        matchParticipantId: "",
        civId: "none",
        isWinner: false,
      },
    ]);
  };

  const removeParticipant = (gameIndex: number, participantIndex: number) => {
    const currentGame = form.getValues(`games.${gameIndex}`);
    if (currentGame.participants.length > 1) {
      const newParticipants = currentGame.participants.filter(
        (_, i) => i !== participantIndex,
      );
      form.setValue(`games.${gameIndex}.participants`, newParticipants);
    }
  };

  return (
    <ScrollArea className="h-[70vh] px-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <div className="space-y-6">
            {fields.map((field, gameIndex) => (
              <div
                key={field.id}
                className="space-y-4 rounded-lg border p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Game {gameIndex + 1}</h3>
                </div>

                {/* Map Selection */}
                <FormField
                  control={form.control}
                  name={`games.${gameIndex}.mapId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Map</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select map" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mapsLoading && (
                            <SelectItem
                              value="loading"
                              disabled
                            >
                              Loading...
                            </SelectItem>
                          )}
                          {maps?.map((map) => (
                            <SelectItem
                              key={map.id}
                              value={map.id}
                            >
                              {map.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Participants */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel>Participants</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addParticipant(gameIndex)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Participant
                    </Button>
                  </div>

                  {form
                    .watch(`games.${gameIndex}.participants`)
                    ?.map((_, participantIndex) => (
                      <div
                        key={participantIndex}
                        className="space-y-3 rounded-lg border p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Participant {participantIndex + 1}
                          </span>
                          {form.watch(`games.${gameIndex}.participants`)
                            .length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeParticipant(gameIndex, participantIndex)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {/* Player Selection */}
                          <FormField
                            control={form.control}
                            name={`games.${gameIndex}.participants.${participantIndex}.matchParticipantId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Player</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select player" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {availableUsers.map((user) => (
                                      <SelectItem
                                        key={user.id}
                                        value={user.matchParticipantId}
                                      >
                                        {user.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Civilization Selection */}
                          <FormField
                            control={form.control}
                            name={`games.${gameIndex}.participants.${participantIndex}.civId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Civilization</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select civilization" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {civsLoading && (
                                      <SelectItem
                                        value="loading"
                                        disabled
                                      >
                                        Loading...
                                      </SelectItem>
                                    )}
                                    <SelectItem value="none">
                                      No civilization
                                    </SelectItem>
                                    {civs?.map((civ) => (
                                      <SelectItem
                                        key={civ.id}
                                        value={civ.id}
                                      >
                                        {civ.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {/* Winner Checkbox */}
                          <FormField
                            control={form.control}
                            name={`games.${gameIndex}.participants.${participantIndex}.isWinner`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Winner</FormLabel>
                                  <FormDescription>
                                    Multiple participants can be winners
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <FormField
            control={form.control}
            name="applyScore"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Apply match score and winner based on these games?
                  </FormLabel>
                  <FormDescription>
                    This will update the match score and set the winner based on
                    the games above. It will also set the match status to
                    &quot;Admin Approved&quot;.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <DrawerFooter className="px-0">
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save Games"}
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
