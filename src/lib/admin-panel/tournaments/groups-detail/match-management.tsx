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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { ErrorToast } from "@/components/ui/error-toast-content";
import type { ExtendedTournamentMatch } from "./match";
import type { TournamentMatchFormSchema } from "../tournament";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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

interface MatchManagementProps {
  groupId: string;
  matches: ExtendedTournamentMatch[];
  matchUrlBase?: string;
  isTeamBased?: boolean;
  isMixed?: boolean;
}

export function MatchManagement({
  groupId,
  matches,
  matchUrlBase,
  isTeamBased = false,
  isMixed = false,
}: MatchManagementProps) {
  const router = useRouter();
  const t = useTranslations("admin.tournaments.groups.matches");
  const [editingMatch, setEditingMatch] = useState<ExtendedTournamentMatch>();
  const [deletingMatch, setDeletingMatch] = useState<ExtendedTournamentMatch>();

  const refreshPage = () => {
    router.refresh();
  };

  const { mutate: updateMatch, isPending: updatePending } =
    api.tournaments.matches.update.useMutation({
      onSuccess: () => {
        refreshPage();
        setEditingMatch(undefined);
        toast.success(t("update_success"));
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
        toast.success(t("delete_success"));
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const handleEditMatch = (match: ExtendedTournamentMatch) => {
    setEditingMatch(match);
  };

  const handleDeleteMatch = (match: ExtendedTournamentMatch) => {
    setDeletingMatch(match);
  };

  const handleDownloadReplays = async (match: ExtendedTournamentMatch) => {
    try {
      toast.info(t("replays.preparing"));

      const response = await fetch(
        `/api/tournaments/matches/${match.id}/replays`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          toast.info(t("replays.none"));
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

        toast.success(t("replays.zip_success"));
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
          toast.info(t("replays.none"));
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

        toast.success(t("replays.downloaded", { count: data.replays.length }));
      }
    } catch (error) {
      console.error("Error downloading replays:", error);
      toast.error(t("replays.failed"));
    }
  };

  const handleSubmit = (data: TournamentMatchFormSchema) => {
    if (!editingMatch) return;

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
  };

  const handleCancel = () => {
    setEditingMatch(undefined);
  };

  const handleConfirmDelete = () => {
    if (deletingMatch) {
      deleteMatch({ id: deletingMatch.id });
    }
  };

  return (
    <>
      <div className="border-medieval-wood-border w-full overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="border-medieval-wood-border border-b bg-black/20 hover:bg-black/20">
              <TableHead className="text-medieval-gold-muted px-3 text-left text-xs font-bold tracking-wide uppercase">
                {t("table.match")}
              </TableHead>
              <TableHead className="text-medieval-gold-muted w-12 px-3 text-center text-xs font-bold tracking-wide uppercase">
                {t("table.status")}
              </TableHead>
              <TableHead className="text-medieval-gold-muted w-44 px-3 text-right text-xs font-bold tracking-wide uppercase">
                {t("table.date")}
              </TableHead>
              <TableHead className="text-medieval-gold-muted w-36 px-3 text-right text-xs font-bold tracking-wide uppercase">
                {t("table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.length === 0 ? (
              <TableRow className="border-medieval-wood-border border-b">
                <TableCell
                  colSpan={4}
                  className="text-medieval-gold-muted py-6 text-center text-sm"
                >
                  {t("no_matches")}
                </TableCell>
              </TableRow>
            ) : (
              matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onEdit={handleEditMatch}
                  onDelete={handleDeleteMatch}
                  onDownloadReplays={handleDownloadReplays}
                  matchHref={
                    matchUrlBase
                      ? `${matchUrlBase}/${match.matchNumber}`
                      : undefined
                  }
                  gamesCount={match.GameCount}
                  isTeamBased={isTeamBased}
                  isMixed={isMixed}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Drawer
        open={!!editingMatch}
        onOpenChange={(open) => {
          if (!open) {
            handleCancel();
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("edit_dialog_title")}</DrawerTitle>
            <DrawerDescription>{t("dialog_description")}</DrawerDescription>
          </DrawerHeader>

          <TournamentMatchForm
            initialData={editingMatch}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            groupId={groupId}
            isPending={updatePending}
          />
        </DrawerContent>
      </Drawer>

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
            <AlertDialogTitle>{t("delete_dialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete_dialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("delete_dialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deletionPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletionPending
                ? t("delete_dialog.deleting")
                : t("delete_dialog.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
