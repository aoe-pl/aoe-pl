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
import type { ExtendedTournamentMatch } from "./match";
import { toast } from "sonner";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const gameSchema = z.object({
  mapId: z.string().min(1, "Map is required"),
  winnerId: z.string().min(1, "Winner is required"),
});

const formSchema = z.object({
  games: z.array(gameSchema),
  applyScore: z.boolean(),
});

type GameFormValues = z.infer<typeof formSchema>;

interface TournamentGameFormProps {
  match: ExtendedTournamentMatch;
  onCancel: () => void;
  matchMode: { id: string; mode: string; gameCount: number };
}

export function TournamentGameForm({
  match,
  onCancel,
  matchMode,
}: TournamentGameFormProps) {
  const router = useRouter();
  const { data: maps, isLoading: mapsLoading } = api.maps.list.useQuery();

  const matchParticipants = match.TournamentMatchParticipant;

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

  // Initialize games based on match mode and existing games
  useEffect(() => {
    const existingGames = match.Game.map((g) => ({
      mapId: g.mapId,
      winnerId: g.winnerId,
    }));

    // Fill up to maxGames with empty games if needed
    const gamesToShow = Array.from(
      { length: maxGames },
      (_, index) => existingGames[index] ?? { mapId: "", winnerId: "" },
    );

    replace(gamesToShow);
  }, [match.Game, maxGames, replace]);

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
    // Filter out empty games (no winner selected)
    const validGames = data.games.filter((game) => game.winnerId && game.mapId);

    manageGames({
      matchId: match.id,
      games: validGames,
      applyScore: data.applyScore,
    });
  }

  return (
    <ScrollArea className="h-[70vh] px-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border p-4"
              >
                <div className="mb-4">
                  <h3 className="font-semibold">Game {index + 1}</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`games.${index}.winnerId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Winner</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select winner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {matchParticipants.map((p) => (
                              <SelectItem
                                key={p.id}
                                value={p.id}
                              >
                                {p.participant?.nickname ?? p.team?.name}
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
                    name={`games.${index}.mapId`}
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
