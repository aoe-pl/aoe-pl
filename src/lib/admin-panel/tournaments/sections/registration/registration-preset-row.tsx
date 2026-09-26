"use client";

import { Badge } from "@/components/ui/badge";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { Switch } from "@/components/ui/switch";
import type { RegistrationFieldPreset } from "@/lib/tournaments/registration-field-presets";
import { api } from "@/trpc/react";
import type {
  TournamentRegistrationField,
  TournamentRegistrationFieldTranslation,
} from "@prisma/client";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type FieldWithTranslations = TournamentRegistrationField & {
  translations: TournamentRegistrationFieldTranslation[];
};

interface RegistrationPresetRowProps {
  tournamentId: string;
  preset: RegistrationFieldPreset;
  field?: FieldWithTranslations;
  nextDisplayOrder: number;
  onSaved: () => void;
}

/**
 * Row for a predefined (system) registration field. Admins toggle it on/off and
 * optionally mark it as required; the label and type come from the preset.
 */
export function RegistrationPresetRow({
  tournamentId,
  preset,
  field,
  nextDisplayOrder,
  onSaved,
}: RegistrationPresetRowProps) {
  const t = useTranslations("admin.tournaments.sections.registration");

  const { mutate: enablePreset, isPending: enablePending } =
    api.tournaments.registrationFields.enablePreset.useMutation({
      onSuccess: () => {
        toast.success(t("toast.field_enabled"));
        onSaved();
      },
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

  const { mutate: updateField, isPending: updatePending } =
    api.tournaments.registrationFields.update.useMutation({
      onSuccess: () => onSaved(),
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

  const { mutate: deleteField, isPending: deletePending } =
    api.tournaments.registrationFields.delete.useMutation({
      onSuccess: () => {
        toast.success(t("toast.field_disabled"));
        onSaved();
      },
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

  const isPending = enablePending || updatePending || deletePending;

  function handleToggle(checked: boolean) {
    if (checked) {
      enablePreset({
        tournamentId,
        slug: preset.slug,
        displayOrder: nextDisplayOrder,
      });
    } else if (field) {
      deleteField({ id: field.id });
    }
  }

  return (
    <div className="rounded-md border px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm font-medium">
          {t(`presets.${preset.slug}`)}
        </span>
        <Badge
          variant="outline"
          className="shrink-0 text-xs"
        >
          {t(`field_type.${preset.type.toLowerCase()}`)}
        </Badge>
        <Switch
          checked={Boolean(field)}
          disabled={isPending}
          onCheckedChange={handleToggle}
          aria-label={t(`presets.${preset.slug}`)}
        />
      </div>
      {field && (
        <div className="mt-2 flex items-center gap-1.5 pl-1">
          <Switch
            id={`preset-required-${preset.slug}`}
            checked={field.required}
            disabled={isPending}
            onCheckedChange={(checked) =>
              updateField({ id: field.id, required: checked })
            }
          />
          <label
            htmlFor={`preset-required-${preset.slug}`}
            className="text-muted-foreground text-xs"
          >
            {t("field_required")}
          </label>
        </div>
      )}
    </div>
  );
}
