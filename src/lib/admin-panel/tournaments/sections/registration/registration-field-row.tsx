"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { api } from "@/trpc/react";
import type {
  TournamentRegistrationField,
  TournamentRegistrationFieldTranslation,
} from "@prisma/client";
import { ArrowDown, ArrowUp, Pencil } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

type FieldWithTranslations = TournamentRegistrationField & {
  translations: TournamentRegistrationFieldTranslation[];
};

interface RegistrationFieldRowProps {
  field: FieldWithTranslations;
  isFirst: boolean;
  isLast: boolean;
  movePending: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onSaved: () => void;
}

export function RegistrationFieldRow({
  field,
  isFirst,
  isLast,
  movePending,
  onMoveUp,
  onMoveDown,
  onEdit,
  onSaved,
}: RegistrationFieldRowProps) {
  const t = useTranslations("admin.tournaments.sections.registration");
  const locale = useLocale();

  const label =
    field.translations.find((tr) => tr.locale === locale)?.label ?? "";

  const { mutate: deleteField, isPending: deletePending } =
    api.tournaments.registrationFields.delete.useMutation({
      onSuccess: () => {
        toast.success(t("toast.field_removed", { label }));
        onSaved();
      },
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
      <span className="flex-1 text-sm font-medium">{label}</span>
      <Badge
        variant="outline"
        className="shrink-0 text-xs"
      >
        {t(`field_type.${field.type.toLowerCase()}`)}
      </Badge>
      {field.required && (
        <Badge
          variant="secondary"
          className="shrink-0 text-xs"
        >
          {t("required_badge")}
        </Badge>
      )}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          disabled={isFirst || movePending || deletePending}
          onClick={onMoveUp}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={isLast || movePending || deletePending}
          onClick={onMoveDown}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        disabled={deletePending}
        onClick={onEdit}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <ConfirmDialog
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            disabled={deletePending}
            type="button"
          >
            <span className="text-xs">✕</span>
          </Button>
        }
        title={t("confirm_delete.title")}
        description={t("confirm_delete.description", { label })}
        cancelLabel={t("cancel")}
        confirmLabel={t("remove")}
        onConfirm={() => deleteField({ id: field.id })}
      />
    </div>
  );
}
