"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Plus, Edit, Trash2 } from "lucide-react";
import { TournamentStageForm } from "./tournament-stage-form";
import {
  type BracketType,
  type TournamentStageType,
  getBracketTypeLabel,
  getStageTypeLabel,
} from "./tournament";

export type TournamentStageData = {
  id: string;
  name: string;
  type: TournamentStageType;
  isActive: boolean;
  description?: string;
  bracketType?: BracketType;
  bracketSize?: number;
  isSeeded: boolean;
};

interface TournamentStageManagerProps {
  stages: TournamentStageData[];
  onChange: (stages: TournamentStageData[]) => void;
}

export function TournamentStageManager({
  stages,
  onChange,
}: TournamentStageManagerProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<TournamentStageData | null>(
    null,
  );

  const handleAddStage = () => {
    setEditingStage(null);
    setIsDrawerOpen(true);
  };

  const handleEditStage = (stage: TournamentStageData) => {
    setEditingStage(stage);
    setIsDrawerOpen(true);
  };

  const handleDeleteStage = (stageId: string) => {
    const newStages = stages.filter((s) => s.id !== stageId);
    // we need to update  other stages ID then
    const stagesToSave = newStages.map((stage, index) => {
      return { ...stage, id: index.toString() };
    });

    onChange(stagesToSave);
  };

  const handleStageSubmit = (stageData: TournamentStageData) => {
    let newStages: TournamentStageData[];

    if (editingStage?.id !== undefined) {
      // Editing existing stage
      const index = parseInt(editingStage.id);
      newStages = [...stages];
      newStages[index] = stageData;
    } else {
      // Adding new stage
      newStages = [...stages, stageData];
    }

    // If this stage is being set to active, deactivate all other stages
    if (stageData.isActive) {
      const activeStageIndex = newStages.findIndex((stage) => stage.isActive);

      if (activeStageIndex !== -1 && newStages[activeStageIndex]) {
        newStages[activeStageIndex].isActive = false;
      }
    }

    onChange(newStages);
    setIsDrawerOpen(false);
    setEditingStage(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Tournament Stages</h3>
        <Button
          onClick={handleAddStage}
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Stage
        </Button>
      </div>

      {stages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">No stages configured</p>
            <Button
              onClick={handleAddStage}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Stage
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {stages.map((stage, index) => (
            <Card
              key={index}
              className="w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]"
            >
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base">{stage.name}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={stage.isActive ? "default" : "secondary"}>
                      {stage.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">
                      {getStageTypeLabel(stage.type)}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStage(stage)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStage(stage.id)}
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
      )}

      <Drawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingStage ? "Edit Stage" : "Add New Stage"}
            </DrawerTitle>
            <DrawerDescription>
              Configure the tournament stage settings
            </DrawerDescription>
          </DrawerHeader>
          <TournamentStageForm
            initialData={editingStage}
            onSubmit={handleStageSubmit}
            onCancel={() => setIsDrawerOpen(false)}
            existingStages={stages}
          />
        </DrawerContent>
      </Drawer>
    </div>
  );
}
