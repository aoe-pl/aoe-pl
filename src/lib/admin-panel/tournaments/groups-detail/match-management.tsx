"use client";

import { Drawer } from "@/components/ui/drawer";
import {
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { TournamentMatchForm } from "../tournament-match-form";
import { MatchCard } from "./match-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { ErrorToast } from "@/components/ui/error-toast-content";
import type { ExtendedTournamentMatch } from "./match";
import type { TournamentMatchFormSchema } from "../tournament";
import { useRouter } from "next/navigation";
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
import { GameManagement } from "./game-management";

interface MatchManagementProps {
  groupId: string;
  matches: ExtendedTournamentMatch[];
  matchMode: { id: string; mode: string; gameCount: number };
  isTeamBased?: boolean;
  isMixed?: boolean;
}

export function MatchManagement({
  groupId,
  matches,
  matchMode,
  isTeamBased = false,
  isMixed = false,
}: MatchManagementProps) {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<ExtendedTournamentMatch>();
  const [deletingMatch, setDeletingMatch] = useState<ExtendedTournamentMatch>();

  const [managingGamesMatch, setManagingGamesMatch] =
    useState<ExtendedTournamentMatch | null>(null);

  const refreshPage = () => {
    router.refresh();
  };

  const { mutate: createMatch, isPending: creationPending } =
    api.tournaments.matches.create.useMutation({
      onSuccess: () => {
        refreshPage();
        setIsDrawerOpen(false);
        toast.success("Match created successfully");
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const { mutate: updateMatch, isPending: updatePending } =
    api.tournaments.matches.update.useMutation({
      onSuccess: () => {
        refreshPage();
        setIsDrawerOpen(false);
        setEditingMatch(undefined);
        toast.success("Match updated successfully");
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const { mutate: deleteMatch, isPending: deletionPending } =
    api.tournaments.matches.delete.useMutation({
      onSuccess: () => {
        refreshPage();
        setDeletingMatch(undefined);
        toast.success("Match deleted successfully");
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const handleEditMatch = (match: ExtendedTournamentMatch) => {
    setEditingMatch(match);
    setIsDrawerOpen(true);
  };

  const handleDeleteMatch = (match: ExtendedTournamentMatch) => {
    setDeletingMatch(match);
  };

  const handleManageGames = (match: ExtendedTournamentMatch) => {
    setManagingGamesMatch(match);
  };

  const handleDownloadReplays = async (match: ExtendedTournamentMatch) => {
    try {
      toast.info("Preparing replay files...");

      const response = await fetch(
        `/api/tournaments/matches/${match.id}/replays`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          toast.info("No replays available for this match");
          return;
        }
        throw new Error("Failed to fetch replays");
      }

      // Check if we got a ZIP file or JSON response
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/zip")) {
        // Handle ZIP download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `match_${match.id}_replays.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success("Downloaded replay files as ZIP");
      } else {
        // Fallback to individual downloads if ZIP creation failed
        const data = (await response.json()) as {
          replays: Array<{
            gameNumber: number;
            mapName: string;
            downloadUrl: string;
          }>;
        };

        if (data.replays.length === 0) {
          toast.info("No replays available for this match");
          return;
        }

        // Download each replay file
        for (const replay of data.replays) {
          const link = document.createElement("a");
          link.href = replay.downloadUrl;
          link.download = `Game_${replay.gameNumber}_${replay.mapName}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Add small delay between downloads
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        toast.success(`Downloaded ${data.replays.length} replay files`);
      }
    } catch (error) {
      console.error("Error downloading replays:", error);
      toast.error("Failed to download replays");
    }
  };

  const handleSubmit = (data: TournamentMatchFormSchema) => {
    if (editingMatch) {
      updateMatch({
        id: editingMatch.id,
        data: {
          matchDate: data.matchDate,
          civDraftKey: data.civDraftKey,
          mapDraftKey: data.mapDraftKey,
          status: data.status,
          comment: data.comment,
          adminComment: data.adminComment,
          participantScores: data.participantScores,
          teamScores: data.teamScores,
        },
      });
    } else {
      createMatch({
        data: {
          groupId,
          matchDate: data.matchDate,
          civDraftKey: data.civDraftKey,
          mapDraftKey: data.mapDraftKey,
          status: data.status,
          comment: data.comment,
          adminComment: data.adminComment,
          participantIds: data.participantIds,
          teamIds: data.teamIds,
          isManualMatch: true,
          participantScores: data.participantScores,
          teamScores: data.teamScores,
        },
      });
    }
  };

  const handleCancel = () => {
    setIsDrawerOpen(false);
    setEditingMatch(undefined);
  };

  const handleConfirmDelete = () => {
    if (deletingMatch) {
      deleteMatch({ id: deletingMatch.id });
    }
  };

  return (
    <>
      <div className="py-4">
        <Button
          onClick={() => {
            setEditingMatch(undefined);
            setIsDrawerOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Match
        </Button>
      </div>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}
      >
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onEdit={handleEditMatch}
            onDelete={handleDeleteMatch}
            onManageGames={handleManageGames}
            onDownloadReplays={handleDownloadReplays}
            gamesCount={match.GameCount}
            isTeamBased={isTeamBased}
            isMixed={isMixed}
          />
        ))}
      </div>

      <Drawer
        open={isDrawerOpen || !!editingMatch}
        onOpenChange={(open) => {
          if (!open) {
            handleCancel();
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingMatch ? "Edit Match" : "Add New Match"}
            </DrawerTitle>
            <DrawerDescription>
              Configure the match settings and details
            </DrawerDescription>
          </DrawerHeader>

          <TournamentMatchForm
            initialData={editingMatch}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            groupId={groupId}
            isPending={creationPending || updatePending}
          />
        </DrawerContent>
      </Drawer>

      {managingGamesMatch && (
        <GameManagement
          match={{ ...managingGamesMatch }}
          isOpen={!!managingGamesMatch}
          onClose={() => {
            setManagingGamesMatch(null);
          }}
          matchMode={matchMode}
        />
      )}

      <AlertDialog
        open={!!deletingMatch}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingMatch(undefined);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Match</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this match? This action cannot be
              undone. All game data and scores will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deletionPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletionPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
