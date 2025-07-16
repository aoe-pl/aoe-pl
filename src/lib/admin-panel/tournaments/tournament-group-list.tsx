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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash2, Users, Calendar, MapPin } from "lucide-react";
import Link from "next/link";

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

  const {
    data: groups,
    refetch,
    isLoading,
  } = api.tournaments.groups.listByTournament.useQuery({
    tournamentId,
    includeMatchMode: true,
    includeParticipants: true,
    includeMatches: true,
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

  const getGroupColorStyle = (color?: string | null) => {
    if (!color) return {};

    return {
      borderLeftColor: color,
      borderLeftWidth: "4px",
    };
  };

  const handleSubmit = (data: {
    name: string;
    stageId: string;
    displayOrder: number;
    description?: string | undefined;
    matchModeId?: string | undefined;
    isTeamBased?: boolean | undefined;
    isMixed?: boolean | undefined;
    color?: string | undefined;
    participantIds?: string[] | undefined;
  }) => {
    const groupData = {
      name: data.name,
      description: data.description,
      matchModeId: data.matchModeId,
      displayOrder: data.displayOrder,
      isTeamBased: data.isTeamBased,
      isMixed: data.isMixed,
      color: data.color,
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

  if (!groups || groups.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground mb-4">
            {isLoading ? "Loading groups..." : "No groups yet"}
          </p>
          <Button
            onClick={handleAdd}
            disabled={isLoading}
          >
            Add Group
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">Groups</h2>
        <Button onClick={handleAdd}>Add Group</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {groups.map((group) => (
          <Card
            key={group.id}
            className="w-full min-w-[320px] transition-shadow hover:shadow-md sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]"
            style={getGroupColorStyle(group.color)}
          >
            <CardHeader className="pb-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{group.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                      title="View group details"
                    >
                      <Link href={`/admin/tournaments/groups/${group.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(group)}
                      className="h-8 w-8 p-0"
                      title="Edit group"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(group.id)}
                      disabled={deletionPending && deletingGroupId === group.id}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      title="Delete group"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {group.matchMode?.mode ?? "No match mode"}
                  </Badge>
                  <Badge variant={group.isTeamBased ? "default" : "secondary"}>
                    {group.isTeamBased ? "Team Based" : "Individual"}
                  </Badge>
                  {group.isMixed && (
                    <Badge
                      variant="default"
                      className="text-xs"
                    >
                      Mixed
                    </Badge>
                  )}
                </div>
                {/* Stage Info */}
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>Stage: {group.stage.name}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              {group.description && (
                <div className="space-y-1">
                  <p className="text-sm">{group.description}</p>
                </div>
              )}

              {/* Group Details */}
              <div className="space-y-2 border-t pt-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Users className="text-muted-foreground h-3 w-3" />
                    <span className="text-muted-foreground">Participants:</span>
                    <span className="font-medium">
                      {group.TournamentGroupParticipant?.length ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="text-muted-foreground h-3 w-3" />
                    <span className="text-muted-foreground">Matches:</span>
                    <span className="font-medium">
                      {group.matches?.length ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Group Info */}
              <div className="text-muted-foreground space-y-1 border-t pt-3 text-xs">
                <div>Display Order: {group.displayOrder}</div>
              </div>
            </CardContent>
          </Card>
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
