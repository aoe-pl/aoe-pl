"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import type { TournamentStage } from "./tournament";
import { getStageTypeLabel, getBracketTypeLabel } from "./tournament";

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
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {stages.map((stage) => (
        <Card
          key={stage.id}
          className="w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]"
        >
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">{stage.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={stage.isActive ? "default" : "secondary"}>
                  {stage.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline">{getStageTypeLabel(stage.type)}</Badge>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(stage)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(stage)}
                    disabled={deletionPending && deletingStageId === stage.id}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {stage.description && (
                <p className="text-muted-foreground text-sm">
                  {stage.description}
                </p>
              )}
              <div className="text-muted-foreground flex flex-wrap gap-2 text-sm">
                {stage.type === "BRACKET" && stage.bracketType && (
                  <span>• {getBracketTypeLabel(stage.bracketType)}</span>
                )}
                {stage.type === "BRACKET" && stage.bracketSize && (
                  <span>• {stage.bracketSize} participants</span>
                )}
                {stage.type === "BRACKET" && (
                  <span>• {stage.isSeeded ? "Seeded" : "Not seeded"}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
