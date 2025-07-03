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
import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, Trophy } from "lucide-react";
import type { Game, Map } from "@prisma/client";

const gameParticipantSchema = z.object({
  matchParticipantId: z.string().min(1, "Player is required"),
  civId: z.string().optional(),
  isWinner: z.boolean(),
});

const gameSchema = z.object({
  mapId: z.string().min(1, "Map is required"),
  recUrl: z.string().optional(),
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
  refetchGames: () => void;
}

export function TournamentGameForm({
  onCancel,
  matchMode,
  games,
  matchId,
  availableUsers,
  refetchGames,
}: TournamentGameFormProps) {
  const router = useRouter();
  const { data: maps, isLoading: mapsLoading } = api.maps.list.useQuery();
  const { data: civs, isLoading: civsLoading } = api.civs.list.useQuery();

  const [uploadedFiles, setUploadedFiles] = useState<
    Record<number, { tempKey: string; fileName: string } | null>
  >({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<number, boolean>>(
    {},
  );
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);

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

  const [openGames, setOpenGames] = useState<boolean[]>(() =>
    fields.map((_, i) => i === 0),
  );

  // Sync openGames with fields.length
  useEffect(() => {
    setOpenGames((prev: boolean[]) => {
      if (fields.length === prev.length) return prev;
      if (fields.length > prev.length) {
        return [
          ...prev,
          ...(Array(fields.length - prev.length).fill(false) as boolean[]),
        ];
      }
      return prev.slice(0, fields.length);
    });
  }, [fields.length]);

  // Initialize games based on existing games or create empty ones
  useEffect(() => {
    const existingGames = games.map((g) => ({
      mapId: g.mapId,
      recUrl: g.recUrl ?? undefined,
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
        refetchGames();
        router.refresh();
        onCancel();
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const uploadFile = async (file: File, gameIndex: number) => {
    setUploadingFiles((prev) => ({ ...prev, [gameIndex]: true }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("matchId", matchId);

      const response = await fetch(
        `/api/tournaments/matches/${matchId}/games`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Upload failed");
      }

      const result = (await response.json()) as {
        tempKey: string;
        fileName: string;
      };

      setUploadedFiles((prev) => ({
        ...prev,
        [gameIndex]: { tempKey: result.tempKey, fileName: result.fileName },
      }));

      toast.success(`Replay "${file.name}" uploaded successfully`);
      return result.tempKey;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(<ErrorToast message={message} />);
      throw error;
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [gameIndex]: false }));
    }
  };

  async function onSubmit(data: GameFormValues) {
    try {
      const validGames = data.games
        .filter(
          (game) =>
            game.mapId && game.participants.some((p) => p.matchParticipantId),
        )
        .map((game, index) => ({
          mapId: game.mapId,
          recUrl: game.recUrl,
          tempFileKey: uploadedFiles[index]?.tempKey,
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
        filesToRemove,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save games";
      toast.error(<ErrorToast message={message} />);
    }
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

  const removeReplay = (gameIndex: number) => {
    // Get the current recUrl to track for removal
    const currentRecUrl = form.getValues(`games.${gameIndex}.recUrl`);

    // If there's an existing recUrl, add it to filesToRemove
    if (currentRecUrl) {
      setFilesToRemove((prev) => [...prev, currentRecUrl]);
    }

    // Clear the recUrl in the form
    form.setValue(`games.${gameIndex}.recUrl`, undefined);

    // Clear the uploaded file state
    setUploadedFiles((prev) => ({
      ...prev,
      [gameIndex]: null,
    }));
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
                className="rounded-xl border"
                style={{
                  background: "var(--color-game-card)",
                  borderColor: `var(--color-game-header-${(gameIndex % 4) + 1})`,
                }}
              >
                {/* Header */}
                <div
                  className="flex cursor-pointer items-center justify-between rounded-t-xl px-4 py-3 select-none"
                  style={{
                    background: `var(--color-game-header-${(gameIndex % 4) + 1})`,
                  }}
                  onClick={() =>
                    setOpenGames((prev) =>
                      prev.map((open, i) => (i === gameIndex ? !open : open)),
                    )
                  }
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold"
                      style={{
                        background: "var(--color-primary)",
                        color: "var(--color-primary-foreground)",
                      }}
                    >
                      {gameIndex + 1}
                    </span>
                    <span className="font-semibold">Game {gameIndex + 1}</span>
                    <span className="ml-2 text-xs opacity-70">
                      {form.watch(`games.${gameIndex}.participants`).length}{" "}
                      players
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {openGames[gameIndex] ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>
                </div>
                {/* Collapsible Content */}
                <div className={openGames[gameIndex] ? "block" : "hidden"}>
                  <div className="space-y-4 p-6">
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
                    {/* Replay File Upload */}
                    <div>
                      <FormLabel>Replay File (Optional)</FormLabel>
                      <div className="mt-2">
                        <input
                          type="file"
                          accept=".aoe2record,.mgz,.mgx"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              await uploadFile(file, gameIndex);
                            }
                          }}
                          disabled={uploadingFiles[gameIndex] ?? isPending}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                        />
                        {uploadingFiles[gameIndex] && (
                          <div className="mt-2 text-sm text-blue-600">
                            Uploading replay file...
                          </div>
                        )}
                        {uploadedFiles[gameIndex] && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm text-green-600">
                              ✓ Uploaded: {uploadedFiles[gameIndex]?.fileName}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeReplay(gameIndex)}
                              className="h-6 px-2 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {form.watch(`games.${gameIndex}.recUrl`) &&
                          !uploadedFiles[gameIndex] && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-sm text-blue-600">
                                ✓ Existing replay file attached
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeReplay(gameIndex)}
                                className="h-6 px-2 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Upload an Age of Empires 2 replay file (.aoe2record,
                        .mgz, .mgx)
                      </p>
                    </div>
                    {/* Participants */}
                    <div className="mb-2 flex items-center">
                      <FormLabel className="mr-2">Participants</FormLabel>
                    </div>
                    <div className="flex flex-col items-start gap-2">
                      {form
                        .watch(`games.${gameIndex}.participants`)
                        ?.map((_, participantIndex, arr) => (
                          <div
                            key={participantIndex}
                            className="flex max-w-fit items-center gap-2 rounded-lg border bg-[var(--color-card)] px-4 py-2"
                            style={{ minHeight: 40 }}
                          >
                            {/* Player Select */}
                            <FormField
                              control={form.control}
                              name={`games.${gameIndex}.participants.${participantIndex}.matchParticipantId`}
                              render={({ field }) => (
                                <FormItem
                                  className="mr-1"
                                  style={{ width: 144 }}
                                >
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue
                                          placeholder="Player"
                                          className="truncate"
                                        />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {availableUsers.map((user) => (
                                        <SelectItem
                                          key={user.id}
                                          value={user.matchParticipantId}
                                          className="truncate text-xs"
                                        >
                                          {user.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            {/* Civ Select */}
                            <FormField
                              control={form.control}
                              name={`games.${gameIndex}.participants.${participantIndex}.civId`}
                              render={({ field }) => (
                                <FormItem
                                  className="mr-1"
                                  style={{ width: 112 }}
                                >
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue
                                          placeholder="Civ"
                                          className="truncate"
                                        />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {civsLoading && (
                                        <SelectItem
                                          value="loading"
                                          disabled
                                          className="truncate text-xs"
                                        >
                                          Loading...
                                        </SelectItem>
                                      )}
                                      <SelectItem
                                        value="none"
                                        className="truncate text-xs"
                                      >
                                        No civ
                                      </SelectItem>
                                      {civs?.map((civ) => (
                                        <SelectItem
                                          key={civ.id}
                                          value={civ.id}
                                          className="truncate text-xs"
                                        >
                                          {civ.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            {/* Winner Icon */}
                            <FormField
                              control={form.control}
                              name={`games.${gameIndex}.participants.${participantIndex}.isWinner`}
                              render={({ field }) => (
                                <Button
                                  type="button"
                                  variant={field.value ? "default" : "ghost"}
                                  size="icon"
                                  className={`rounded-full border ${field.value ? "bg-yellow-400 text-black" : ""} mx-1`}
                                  onClick={() =>
                                    form.setValue(
                                      `games.${gameIndex}.participants.${participantIndex}.isWinner`,
                                      !field.value,
                                    )
                                  }
                                  tabIndex={-1}
                                >
                                  <Trophy className="h-5 w-5" />
                                </Button>
                              )}
                            />
                            {/* Remove Icon */}
                            {arr.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="ml-1 rounded-full border"
                                onClick={() =>
                                  removeParticipant(gameIndex, participantIndex)
                                }
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            )}
                          </div>
                        ))}
                      {/* Divider and Add Participant Button */}
                      <div className="mt-2 flex items-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 rounded-md px-3 py-1 font-medium shadow"
                          onClick={() => addParticipant(gameIndex)}
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Add Participant
                        </Button>
                      </div>
                    </div>
                  </div>
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
