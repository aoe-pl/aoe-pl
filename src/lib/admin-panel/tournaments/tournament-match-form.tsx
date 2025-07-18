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
import type { ExtendedTournamentMatch } from "./groups-detail/match";
import { Calendar24 } from "@/components/ui/calendar-24";
import { TournamentParticipantsSelector } from "./tournament-participants-selector";
import { api } from "@/trpc/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { SpoilerProtection } from "./groups-detail/spoiler-protection";

type ParticipantScore = {
  id: string; // Corresponds to participantId or teamId
  name: string;
  wonScore: number;
  lostScore: number;
  isWinner: boolean;
  isTeam: boolean;
};

type TournamentMatchData = TournamentMatchFormSchema & {
  id?: string;
  participantScores: {
    participantId: string;
    wonScore: number;
    lostScore: number;
    isWinner: boolean;
  }[];
  teamScores: {
    teamId: string;
    wonScore: number;
    lostScore: number;
    isWinner: boolean;
  }[];
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
  const [scores, setScores] = useState<ParticipantScore[]>([]);

  const { data: groupParticipants = [], isLoading: participantsLoading } =
    api.tournaments.groups.getParticipants.useQuery(
      { groupId: groupId ?? initialData?.groupId ?? "" },
      { enabled: !!groupId || !!initialData?.groupId },
    );

  const { data: groupInfo } = api.tournaments.groups.get.useQuery(
    { id: groupId ?? initialData?.groupId ?? "" },
    { enabled: !!(groupId ?? initialData?.groupId) },
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
      status: initialData?.status ?? "PENDING",
      comment: initialData?.comment ?? "",
      adminComment: initialData?.adminComment ?? "",
      participantIds:
        initialData?.TournamentMatchParticipant.filter(
          (p) => p.participantId,
        ).map((p) => p.participantId!) ?? [],
      teamIds:
        initialData?.TournamentMatchParticipant.filter((p) => p.teamId).map(
          (p) => p.teamId!,
        ) ?? [],
      participantScores: [],
      teamScores: [],
    },
  });

  // Initialize scores for existing matches
  useEffect(() => {
    if (initialData?.TournamentMatchParticipant) {
      const initialScores = initialData.TournamentMatchParticipant.map((p) => ({
        id: (p.participantId ?? p.teamId)!,
        name: p.participant?.nickname ?? p.team?.name ?? "Unknown",
        wonScore: p.wonScore ?? 0,
        lostScore: p.lostScore ?? 0,
        isWinner: p.isWinner ?? false,
        isTeam: !!p.teamId,
      }));
      setScores(initialScores);
    }
  }, [initialData]);

  // Handle participant selection for new matches
  const handleParticipantSelection = (newParticipantIds: string[]) => {
    form.setValue("participantIds", newParticipantIds);
    const newScores = newParticipantIds.map((id) => {
      const participant = groupParticipants.find((p) => p.id === id);
      return {
        id,
        name: participant?.nickname ?? "Unknown",
        wonScore: 0,
        lostScore: 0,
        isWinner: false,
        isTeam: false,
      };
    });
    setScores(newScores);
  };

  // Automatically determine winner when scores change
  useEffect(() => {
    if (scores.length < 2) {
      setScores((s) => s.map((i) => ({ ...i, isWinner: false })));
      return;
    }

    const maxWonScore = Math.max(...scores.map((s) => s.wonScore));
    if (maxWonScore === 0) {
      setScores((s) => s.map((i) => ({ ...i, isWinner: false })));
      return;
    }

    // All participants with the highest won score are winners
    setScores((currentScores) =>
      currentScores.map((s) => ({
        ...s,
        isWinner: s.wonScore === maxWonScore && maxWonScore > 0,
      })),
    );
  }, [scores.map((s) => s.wonScore).join(",")]);

  const handleSubmit = (data: TournamentMatchData) => {
    if (!initialData) {
      const participantCount = data.participantIds?.length ?? 0;
      if (participantCount > 0) {
        if (groupInfo?.isTeamBased && groupInfo?.isMixed) {
          // Mixed team-based matches require an even number of participants (minimum 2)
          if (participantCount < 2) {
            toast.error("Mixed team matches require at least 2 participants.");
            return;
          }
          if (participantCount % 2 !== 0) {
            toast.error(
              "Mixed team matches require an even number of participants.",
            );
            return;
          }
        } else {
          // Individual matches and regular team matches are currently limited to 2 participants
          if (participantCount !== 2) {
            toast.error("Matches currently support only 2 participants.");
            return;
          }
        }
      }
    }

    const finalData = {
      ...data,
      participantScores: scores
        .filter((s) => !s.isTeam)
        .map((s) => ({
          participantId: s.id,
          wonScore: s.wonScore,
          lostScore: s.lostScore,
          isWinner: s.isWinner,
        })),
      teamScores: scores
        .filter((s) => s.isTeam)
        .map((s) => ({
          teamId: s.id,
          wonScore: s.wonScore,
          lostScore: s.lostScore,
          isWinner: s.isWinner,
        })),
    };

    onSubmit(finalData);
  };

  const renderScoreInputs = () => {
    const currentStatus = form.watch("status");
    const isAdminApproved = currentStatus === "ADMIN_APPROVED";
    const shouldHideScores = !isAdminApproved;

    return (
      <div className="space-y-4">
        <FormLabel>Match Results</FormLabel>
        <div className="space-y-3">
          {scores.map((pScore) => (
            <div
              key={pScore.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">{pScore.name}</span>
                {pScore.isWinner && <Badge variant="default">Winner</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <FormLabel>Won:</FormLabel>
                <SpoilerProtection isSpoiler={shouldHideScores}>
                  <Input
                    type="number"
                    min="0"
                    className="h-8 w-16 text-center"
                    value={pScore.wonScore}
                    onChange={(e) => {
                      const newWonScore = parseInt(e.target.value, 10) || 0;
                      setScores((currentScores) =>
                        currentScores.map((s) =>
                          s.id === pScore.id
                            ? { ...s, wonScore: newWonScore }
                            : s,
                        ),
                      );
                    }}
                  />
                </SpoilerProtection>
                <FormLabel>Lost:</FormLabel>
                <SpoilerProtection isSpoiler={shouldHideScores}>
                  <Input
                    type="number"
                    min="0"
                    className="h-8 w-16 text-center"
                    value={pScore.lostScore}
                    onChange={(e) => {
                      const newLostScore = parseInt(e.target.value, 10) || 0;
                      setScores((currentScores) =>
                        currentScores.map((s) =>
                          s.id === pScore.id
                            ? { ...s, lostScore: newLostScore }
                            : s,
                        ),
                      );
                    }}
                  />
                </SpoilerProtection>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ScrollArea className="h-[60vh] px-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
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

            {!initialData && (
              <FormField
                control={form.control}
                name="participantIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participants</FormLabel>
                    <FormControl>
                      <TournamentParticipantsSelector
                        value={field.value ?? []}
                        onChange={handleParticipantSelection}
                        participants={groupParticipants}
                        isLoading={participantsLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Select participants for this match
                    </FormDescription>
                    {form.watch("participantIds") &&
                      form.watch("participantIds")!.length > 0 &&
                      (() => {
                        const participantCount =
                          form.watch("participantIds")!.length;
                        const isMixedTeamBased =
                          groupInfo?.isTeamBased && groupInfo?.isMixed;

                        let shouldShowAlert = false;
                        let alertMessage = "";

                        if (isMixedTeamBased) {
                          if (participantCount < 2) {
                            shouldShowAlert = true;
                            alertMessage =
                              "Mixed team matches require at least 2 participants.";
                          } else if (participantCount % 2 !== 0) {
                            shouldShowAlert = true;
                            alertMessage =
                              "Mixed team matches require an even number of participants.";
                          }
                        } else {
                          if (participantCount !== 2) {
                            shouldShowAlert = true;
                            alertMessage =
                              "Matches currently support only 2 participants.";
                          }
                        }

                        return shouldShowAlert ? (
                          <Alert className="mt-2 border-orange-200 bg-orange-50">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                              {alertMessage}
                            </AlertDescription>
                          </Alert>
                        ) : null;
                      })()}
                  </FormItem>
                )}
              />
            )}

            {scores.length > 0 && renderScoreInputs()}

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
