"use client";

import { ErrorToast } from "@/components/ui/error-toast-content";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { api } from "@/trpc/react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { TournamentMatchForm } from "../tournament-match-form";
import type { TournamentMatchFormSchema } from "../tournament";

export function AddMatchButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const t = useTranslations("admin.tournaments.groups.matches");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { mutate: createMatch, isPending: creationPending } =
    api.tournaments.matches.create.useMutation({
      onSuccess: () => {
        router.refresh();
        setIsDrawerOpen(false);
        toast.success(t("create_success"));
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const handleSubmit = (data: TournamentMatchFormSchema) => {
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
  };

  return (
    <>
      <Button
        variant="gold"
        onClick={() => setIsDrawerOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        {t("add_match")}
      </Button>
      <Drawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("add_dialog_title")}</DrawerTitle>
            <DrawerDescription>{t("dialog_description")}</DrawerDescription>
          </DrawerHeader>
          <TournamentMatchForm
            onSubmit={handleSubmit}
            onCancel={() => setIsDrawerOpen(false)}
            groupId={groupId}
            isPending={creationPending}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
}
