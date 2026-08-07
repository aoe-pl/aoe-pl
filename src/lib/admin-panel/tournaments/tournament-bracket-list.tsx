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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { api } from "@/trpc/react";
import { ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  TournamentBracket,
  TournamentBracketFormSchema,
} from "./tournament";
import {
  TournamentBracketForm,
  type TournamentBracketEditData,
} from "./tournament-bracket-form";
import { TournamentBracketGraph } from "./tournament-bracket-graph";

type TournamentBracketListProps = {
  tournamentId: string;
  isTeamBased: boolean;
};

export function TournamentBracketList({
  tournamentId,
  isTeamBased,
}: TournamentBracketListProps) {
  const utils = api.useUtils();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBracket, setEditingBracket] =
    useState<TournamentBracketEditData>();
  const [deletingBracket, setDeletingBracket] = useState<TournamentBracket>();
  const [expandedBracketId, setExpandedBracketId] = useState<string | null>(
    null,
  );

  const {
    data: brackets,
    refetch,
    isLoading,
  } = api.tournaments.brackets.listByTournament.useQuery({ tournamentId });

  const { mutate: createBracket, isPending: creationPending } =
    api.tournaments.brackets.create.useMutation({
      onSuccess: () => {
        void refetch();
        setIsDrawerOpen(false);
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />, {
          duration: Infinity,
          closeButton: true,
        });
      },
    });

  const { mutate: updateBracket, isPending: updatePending } =
    api.tournaments.brackets.update.useMutation({
      onSuccess: () => {
        void refetch();
        void utils.tournaments.brackets.get.invalidate();
        setIsDrawerOpen(false);
        setEditingBracket(undefined);
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />, {
          duration: Infinity,
          closeButton: true,
        });
      },
    });

  const { mutate: deleteBracket, isPending: deletionPending } =
    api.tournaments.brackets.delete.useMutation({
      onSuccess: () => {
        void refetch();
        setDeletingBracket(undefined);
        toast.success("Bracket deleted successfully");
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />, {
          duration: Infinity,
          closeButton: true,
        });
      },
    });

  const handleAdd = () => {
    setEditingBracket(undefined);
    setIsDrawerOpen(true);
  };

  const handleEdit = async (bracket: TournamentBracket) => {
    const detail = await utils.tournaments.brackets.get.fetch({
      id: bracket.id,
    });
    if (!detail) return;

    // Roster is the source of truth; fall back to round-1 participants for
    // legacy brackets created before the roster existed.
    let entrantIds = (detail.participants ?? [])
      .sort((a, b) => (a.seedNumber ?? 0) - (b.seedNumber ?? 0))
      .map((p) => p.participantId ?? p.teamId ?? "")
      .filter((id) => id !== "");

    if (entrantIds.length === 0) {
      const round1Nodes = detail.bracketNodes
        .filter((n) => n.isWinnerBracket && n.round === 1)
        .sort((a, b) => a.position - b.position);

      entrantIds = round1Nodes.flatMap(
        (n) =>
          n.match?.TournamentMatchParticipant.map(
            (p) => p.participantId ?? p.teamId ?? "",
          ).filter((id) => id !== "") ?? [],
      );
    }

    const hasResults = detail.bracketNodes.some((n) =>
      n.match?.TournamentMatchParticipant.some((p) => p.isWinner),
    );

    setEditingBracket({ ...detail, entrantIds, hasResults });
    setIsDrawerOpen(true);
  };

  const handleDelete = (bracket: TournamentBracket) => {
    setDeletingBracket(bracket);
  };

  const handleConfirmDelete = () => {
    if (deletingBracket) {
      deleteBracket({ id: deletingBracket.id });
    }
  };

  const handleSubmit = (data: TournamentBracketFormSchema) => {
    if (editingBracket) {
      updateBracket({
        id: editingBracket.id,
        data: {
          name: data.name,
          description: data.description,
          displayOrder: data.displayOrder,
          bracketType: data.bracketType,
          bracketSize: data.bracketSize,
          isSeeded: data.isSeeded,
          entrantIds: data.entrantIds,
        },
      });
      return;
    }

    createBracket({
      stageId: data.stageId,
      data: {
        name: data.name,
        description: data.description,
        displayOrder: data.displayOrder,
        bracketType: data.bracketType,
        bracketSize: data.bracketSize,
        isSeeded: data.isSeeded,
        entrantIds: data.entrantIds ?? [],
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">Brackets</h2>
        <Button onClick={handleAdd}>Add Bracket</Button>
      </div>

      {!brackets || brackets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">
              {isLoading ? "Loading brackets..." : "No brackets yet"}
            </p>
            <Button
              onClick={handleAdd}
              disabled={isLoading}
            >
              Add Bracket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {brackets.map((bracket) => (
            <Card key={bracket.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{bracket.name}</CardTitle>
                    <Badge variant="outline">{bracket.bracketType}</Badge>
                    <Badge variant="secondary">
                      {bracket.bracketSize} slots
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      Stage: {bracket.stage.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedBracketId(
                          expandedBracketId === bracket.id ? null : bracket.id,
                        )
                      }
                    >
                      {expandedBracketId === bracket.id ? (
                        <ChevronUp className="mr-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="mr-1 h-4 w-4" />
                      )}
                      {expandedBracketId === bracket.id
                        ? "Hide"
                        : "View Bracket"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleEdit(bracket)}
                      className="h-8 w-8 p-0"
                      title="Edit bracket"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(bracket)}
                      disabled={deletionPending}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      title="Delete bracket"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {expandedBracketId === bracket.id && (
                <CardContent>
                  <TournamentBracketGraph bracketId={bracket.id} />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Drawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingBracket ? "Edit Bracket" : "Add Bracket"}
            </DrawerTitle>
            <DrawerDescription>
              {editingBracket
                ? "Update the bracket details below."
                : "Fill in the details to create a new bracket. Matches for the first round are generated automatically."}
            </DrawerDescription>
          </DrawerHeader>
          <TournamentBracketForm
            initialData={editingBracket}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDrawerOpen(false);
              setEditingBracket(undefined);
            }}
            brackets={brackets}
            isPending={creationPending || updatePending}
            tournamentId={tournamentId}
            isTeamBased={isTeamBased}
          />
        </DrawerContent>
      </Drawer>

      <AlertDialog
        open={!!deletingBracket}
        onOpenChange={(open) => {
          if (!open) setDeletingBracket(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bracket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the bracket &quot;
              {deletingBracket?.name}&quot;? This action cannot be undone. All
              matches within this bracket will be permanently removed.
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
    </div>
  );
}
