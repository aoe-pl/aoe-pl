"use client";

import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp } from "lucide-react";
import { type SectionRowProps } from "./tournament-section-types";
import { TournamentSectionDeleteButton } from "./tournament-section-delete-button";

export function TournamentSpecialSectionCard({
  section,
  isFirst,
  isLast,
  movePending,
  onMoveUp,
  onMoveDown,
  onSaved,
}: SectionRowProps) {
  const t = useTranslations("admin.tournaments.sections");

  const { mutate: deleteSection, isPending: deletePending } =
    api.tournaments.sections.delete.useMutation({
      onSuccess: () => {
        toast.success(t("toast.removed", { name: section.title }));
        onSaved();
      },
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

  const { mutate: setVisible, isPending: visibilityPending } =
    api.tournaments.sections.update.useMutation({
      onSuccess: () => onSaved(),
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

  const isPending = deletePending || visibilityPending;

  return (
    <div className="bg-primary-foreground mb-3 flex items-center gap-2 rounded-lg border px-4 py-3">
      <span className="flex-1 text-sm font-medium">{section.title}</span>
      <Badge
        variant="secondary"
        className="shrink-0"
      >
        {t("special_badge")}
      </Badge>
      <span className="text-muted-foreground shrink-0">/{section.slug}</span>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={isFirst || movePending || isPending}
          onClick={onMoveUp}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={isLast || movePending || isPending}
          onClick={onMoveDown}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>
      <Switch
        checked={section.isVisible}
        disabled={isPending}
        onCheckedChange={(checked) =>
          setVisible({ id: section.id, isVisible: checked })
        }
      />
      <TournamentSectionDeleteButton
        name={section.title}
        disabled={isPending}
        onConfirm={() => deleteSection({ id: section.id })}
      />
    </div>
  );
}
