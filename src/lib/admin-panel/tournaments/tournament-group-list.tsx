"use client";

import { Drawer } from "@/components/ui/drawer";
import {
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { TournamentGroupForm } from "./tournament-group-form";
import { ErrorToast } from "@/components/ui/error-toast-content";
import type { TournamentGroupWithParticipants } from "./tournament";

type TournamentGroupListProps = {
  tournamentId: string;
  defaultIsTeamBased: boolean;
  defaultMatchModeId: string;
};

export function TournamentGroupList({
  tournamentId,
  defaultIsTeamBased,
  defaultMatchModeId,
}: TournamentGroupListProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<
    TournamentGroupWithParticipants | undefined
  >();
  const [deletingGroupId, setDeletingGroupId] = useState<string | undefined>();

  const { data: groups, refetch } =
    api.tournaments.groups.listByTournament.useQuery({
      tournamentId,
      includeMatchMode: true,
      includeParticipants: true,
    });

  const { mutate: createGroup, isPending: creationPending } =
    api.tournaments.groups.create.useMutation({
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

  const { mutate: updateGroup, isPending: updatePending } =
    api.tournaments.groups.update.useMutation({
      onSuccess: () => {
        void refetch();
        setIsDrawerOpen(false);
        setEditingGroup(undefined);
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />, {
          duration: Infinity,
          closeButton: true,
        });
      },
    });

  const { mutate: deleteGroup, isPending: deletionPending } =
    api.tournaments.groups.delete.useMutation({
      onMutate: (data) => {
        setDeletingGroupId(data.id);
      },
      onSuccess: () => {
        void refetch();
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />, {
          duration: Infinity,
          closeButton: true,
        });
      },
      onSettled: () => {
        setDeletingGroupId(undefined);
      },
    });

  const handleEdit = (group: TournamentGroupWithParticipants) => {
    setEditingGroup(group);
    setIsDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteGroup({ id });
  };

  const handleAdd = () => {
    setEditingGroup(undefined);
    setIsDrawerOpen(true);
  };

  const handleSubmit = (data: {
    name: string;
    stageId: string;
    displayOrder: number;
    description?: string | undefined;
    matchModeId?: string | undefined;
    isTeamBased?: boolean | undefined;
    participantIds?: string[] | undefined;
  }) => {
    const groupData = {
      name: data.name,
      description: data.description,
      matchModeId: data.matchModeId,
      displayOrder: data.displayOrder,
      isTeamBased: data.isTeamBased,
      participantIds: data.participantIds ?? [],
    };

    if (editingGroup) {
      updateGroup({
        id: editingGroup.id,
        data: groupData,
      });

      return;
    }

    createGroup({
      stageId: data.stageId,
      data: groupData,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">Groups</h2>
        <Button onClick={handleAdd}>Add Group</Button>
      </div>

      <div className="space-y-4">
        {groups?.map((group) => (
          <div
            key={group.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div>
              <h3 className="font-medium">{group.name}</h3>
              {group.description && (
                <p className="text-muted-foreground text-sm">
                  {group.description}
                </p>
              )}
              <p className="text-muted-foreground text-sm">
                Stage: {group.stage.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(group)}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(group.id)}
                disabled={deletionPending && deletingGroupId === group.id}
              >
                {deletionPending && deletingGroupId === group.id
                  ? "Deleting..."
                  : "Delete"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Drawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingGroup ? "Edit Group" : "Add Group"}
            </DrawerTitle>
            <DrawerDescription>
              {editingGroup
                ? "Update the group details below."
                : "Fill in the details to create a new group."}
            </DrawerDescription>
          </DrawerHeader>
          <TournamentGroupForm
            initialData={editingGroup}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDrawerOpen(false);
              setEditingGroup(undefined);
            }}
            groups={groups}
            isPending={creationPending || updatePending}
            tournamentId={tournamentId}
            defaultIsTeamBased={defaultIsTeamBased}
            defaultMatchModeId={defaultMatchModeId}
          />
        </DrawerContent>
      </Drawer>
    </div>
  );
}
