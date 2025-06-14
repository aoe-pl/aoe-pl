"use client";

import { Drawer } from "@/components/ui/drawer";
import {
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { TournamentStageForm } from "./tournament-stage-form";
import { TournamentStagesList } from "./tournament-stages-list";
import type { TournamentStage } from "./tournament";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { ErrorToast } from "@/components/ui/error-toast-content";

export function TournamentStages({ tournamentId }: { tournamentId: string }) {
  const {
    data: stages,
    isLoading,
    refetch,
  } = api.tournaments.stages.list.useQuery({
    tournamentId,
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<TournamentStage>();
  const [deletingStageId, setDeletingStageId] = useState<string>();

  const { mutate: createStage, isPending: creationPending } =
    api.tournaments.stages.create.useMutation({
      onSuccess: () => {
        void refetch();
        setIsDrawerOpen(false);
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const { mutate: updateStage, isPending: updatePending } =
    api.tournaments.stages.update.useMutation({
      onSuccess: () => {
        void refetch();
        setIsDrawerOpen(false);
        setEditingStage(undefined);
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const { mutate: deleteStage, isPending: deletionPending } =
    api.tournaments.stages.delete.useMutation({
      onMutate: (data) => {
        setDeletingStageId(data.id);
      },
      onSuccess: () => {
        void refetch();
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
      onSettled: () => {
        setDeletingStageId(undefined);
      },
    });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="py-4">
        <Button
          onClick={() => {
            setEditingStage(undefined);
            setIsDrawerOpen(true);
          }}
        >
          Add Stage
        </Button>
      </div>
      <TournamentStagesList
        stages={stages}
        onEdit={setEditingStage}
        onDelete={deleteStage}
        deletionPending={deletionPending}
        deletingStageId={deletingStageId}
      />
      <Drawer
        open={isDrawerOpen || !!editingStage}
        onOpenChange={(open) => {
          if (!open) {
            setIsDrawerOpen(false);
            setEditingStage(undefined);
          }
        }}
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
            onSubmit={(data) => {
              if (editingStage) {
                updateStage({
                  id: editingStage.id,
                  data,
                });

                return;
              }

              createStage({
                tournamentId,
                data,
              });
            }}
            onCancel={() => setIsDrawerOpen(false)}
            stages={stages}
            isPending={creationPending || updatePending}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
}
