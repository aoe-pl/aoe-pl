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

interface MatchManagementProps {
  groupId: string;
  matches: ExtendedTournamentMatch[];
}

export function MatchManagement({ groupId, matches }: MatchManagementProps) {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<ExtendedTournamentMatch>();

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

  // const { mutate: deleteMatch, isPending: deletionPending } =
  //   api.tournaments.matches.delete.useMutation({
  //     onSuccess: () => {
  //       refreshPage();
  //       toast.success("Match deleted successfully");
  //     },
  //     onError: (error) => {
  //       toast.error(<ErrorToast message={error.message} />);
  //     },
  //   });

  const handleEditMatch = (match: ExtendedTournamentMatch) => {
    setEditingMatch(match);
    setIsDrawerOpen(true);
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
        },
      });
    }
  };

  const handleCancel = () => {
    setIsDrawerOpen(false);
    setEditingMatch(undefined);
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onEdit={handleEditMatch}
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
    </>
  );
}
