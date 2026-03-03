"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface TournamentSectionDeleteButtonProps {
  name: string;
  disabled?: boolean;
  onConfirm: () => void;
}

export function TournamentSectionDeleteButton({
  name,
  disabled,
  onConfirm,
}: TournamentSectionDeleteButtonProps) {
  const t = useTranslations("admin.tournaments.sections");

  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          disabled={disabled}
          type="button"
        >
          <span className="text-xs">✕</span>
        </Button>
      }
      title={t("confirm_delete.title")}
      description={t("confirm_delete.description", { name })}
      cancelLabel={t("cancel")}
      confirmLabel={t("remove")}
      onConfirm={onConfirm}
    />
  );
}
