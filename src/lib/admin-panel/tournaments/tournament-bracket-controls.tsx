"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { api } from "@/trpc/react";
import { RotateCcw, Shuffle, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type TournamentBracketControlsProps = {
  bracketId: string;
};

/**
 * Admin-only bracket allocation controls (rating/random/clear). Kept out of
 * TournamentBracketGraph so they can never render on public tournament pages.
 * Mutations invalidate the shared brackets.get query, which also refreshes
 * the graph.
 */
export function TournamentBracketControls({
  bracketId,
}: TournamentBracketControlsProps) {
  const utils = api.useUtils();
  const { data: bracket, isLoading } = api.tournaments.brackets.get.useQuery({
    id: bracketId,
  });
  const [confirmAction, setConfirmAction] = useState<
    "RATING" | "RANDOM" | "CLEAR" | null
  >(null);

  const { mutate: allocate, isPending: allocatePending } =
    api.tournaments.brackets.allocate.useMutation({
      onSuccess: () => {
        void utils.tournaments.brackets.get.invalidate();
        toast.success("Bracket allocated");
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const { mutate: clearBracket, isPending: clearPending } =
    api.tournaments.brackets.clear.useMutation({
      onSuccess: () => {
        void utils.tournaments.brackets.get.invalidate();
        toast.success("Bracket cleared");
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  if (isLoading || !bracket) {
    return null;
  }

  const hasRoster =
    (bracket.participants?.length ?? 0) > 0 ||
    bracket.bracketNodes.some(
      (n) =>
        n.isWinnerBracket &&
        n.round === 1 &&
        (n.match?.TournamentMatchParticipant.length ?? 0) > 0,
    );

  const hasResults = bracket.bracketNodes.some((n) =>
    n.match?.TournamentMatchParticipant.some((p) => p.isWinner),
  );

  // Allocation/clear wipe results - confirm when anything would be lost.
  const runAction = (action: "RATING" | "RANDOM" | "CLEAR") => {
    if (action === "CLEAR" || hasResults) {
      setConfirmAction(action);
      return;
    }
    allocate({ id: bracketId, mode: action });
  };

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => runAction("RATING")}
          disabled={!hasRoster || allocatePending || clearPending}
          title="Assign roster to round 1 by rating"
        >
          <TrendingUp className="h-4 w-4" />
          Auto-allocate by rating
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => runAction("RANDOM")}
          disabled={!hasRoster || allocatePending || clearPending}
          title="Shuffle roster into round 1"
        >
          <Shuffle className="h-4 w-4" />
          Random
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive gap-1.5"
          onClick={() => runAction("CLEAR")}
          disabled={!hasRoster || allocatePending || clearPending}
          title="Reset bracket to round 1 (keeps roster)"
        >
          <RotateCcw className="h-4 w-4" />
          Clear
        </Button>
      </div>

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "CLEAR"
                ? "Clear bracket?"
                : "Re-allocate bracket?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "CLEAR"
                ? "This resets every match back to round 1: scores, winners and games are removed. The participant roster stays intact and can be re-assigned."
                : "This resets every match and re-assigns the roster to round 1" +
                  (confirmAction === "RATING" ? " by rating." : " randomly.") +
                  " Current scores and results will be removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction === "CLEAR") {
                  clearBracket({ id: bracketId });
                } else if (confirmAction) {
                  allocate({ id: bracketId, mode: confirmAction });
                }
                setConfirmAction(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {confirmAction === "CLEAR" ? "Clear" : "Allocate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
