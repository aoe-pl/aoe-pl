"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api } from "@/trpc/react";
import { Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function RemoveParticipantButton({
  participantId,
}: {
  participantId: string;
}) {
  const router = useRouter();
  const t = useTranslations("admin.tournaments.participant_details");

  const { mutate: remove, isPending } =
    api.tournaments.participants.remove.useMutation({
      onSuccess: () => {
        toast.success(t("delete_confirm"));
        router.refresh();
      },
    });

  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="destructive"
          disabled={isPending}
        >
          <Trash className="mr-2 h-3 w-3" />
          {t("delete")}
        </Button>
      }
      title={t("delete_title")}
      description={t("delete_description")}
      cancelLabel={t("delete_cancel")}
      confirmLabel={t("delete_confirm")}
      onConfirm={() => remove({ participantId })}
      confirmClassName=""
    />
  );
}
