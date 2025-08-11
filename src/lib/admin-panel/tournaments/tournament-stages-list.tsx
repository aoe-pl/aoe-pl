"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import type { TournamentStage } from "./tournament";
import { getStageTypeLabel, getBracketTypeLabel } from "./tournament";
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
import { useState } from "react";

interface TournamentStagesSimpleProps {
  stages?: TournamentStage[];
  onEdit: (stage: TournamentStage) => void;
  onDelete: (stage: TournamentStage) => void;
  deletionPending: boolean;
  deletingStageId: string | undefined;
}

export function TournamentStagesList({
  stages,
  onEdit,
  onDelete,
  deletionPending = false,
  deletingStageId,
}: TournamentStagesSimpleProps) {
  const t = useTranslations("admin.tournaments.stage");
  const [deletingStage, setDeletingStage] = useState<TournamentStage>();

  const handleDeleteStage = (stage: TournamentStage) => {
    setDeletingStage(stage);
  };

  const handleConfirmDelete = () => {
    if (deletingStage) {
      onDelete(deletingStage);
      setDeletingStage(undefined);
    }
  };

  if (!stages || stages.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground mb-4">No stages configured</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {stages.map((stage) => (
          <Card
            key={stage.id}
            className="w-full transition-shadow hover:shadow-md sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]"
          >
            <CardHeader className="pb-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{stage.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(stage)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStage(stage)}
                      disabled={deletionPending && deletingStageId === stage.id}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={stage.isActive ? "default" : "secondary"}>
                    {stage.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant={stage.isVisible ? "default" : "secondary"}>
                    {stage.isVisible ? t("visible") : t("hidden")}
                  </Badge>
                  <Badge variant="outline">
                    {getStageTypeLabel(stage.type)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {stage.description && (
                <p className="text-muted-foreground text-sm">
                  {stage.description}
                </p>
              )}

              {/* Stage Details */}
              {stage.type === "BRACKET" && (
                <div className="space-y-2 border-t pt-3">
                  <div className="text-muted-foreground space-y-1 text-xs">
                    {stage.bracketType && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium">
                          {getBracketTypeLabel(stage.bracketType)}
                        </span>
                      </div>
                    )}
                    {stage.bracketSize && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Size:</span>
                        <span className="font-medium">
                          {stage.bracketSize} participants
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Seeded:</span>
                      <span className="font-medium">
                        {stage.isSeeded ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog
        open={!!deletingStage}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingStage(undefined);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the stage "{deletingStage?.name}"?
              This action cannot be undone. All groups, matches, and game data
              within this stage will be permanently removed.
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
