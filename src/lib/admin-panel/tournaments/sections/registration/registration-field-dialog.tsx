"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locales, type Locale } from "@/lib/locales";
import { api } from "@/trpc/react";
import type {
  TournamentRegistrationField,
  TournamentRegistrationFieldTranslation,
} from "@prisma/client";
import { RegistrationFieldType } from "@prisma/client";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type FieldWithTranslations = TournamentRegistrationField & {
  translations: TournamentRegistrationFieldTranslation[];
};

interface RegistrationFieldDialogProps {
  tournamentId: string;
  field?: FieldWithTranslations;
  nextDisplayOrder?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved: () => void;
  trigger?: React.ReactNode;
}

export function RegistrationFieldDialog({
  tournamentId,
  field,
  nextDisplayOrder = 0,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  onSaved,
  trigger,
}: RegistrationFieldDialogProps) {
  const t = useTranslations("admin.tournaments.sections.registration");

  const [openInternal, setOpenInternal] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : openInternal;

  function setOpen(v: boolean) {
    if (isControlled) onOpenChangeProp?.(v);
    else setOpenInternal(v);
  }

  const [required, setRequired] = useState(false);
  const [activeLocale, setActiveLocale] = useState<Locale>(locales.default);

  const [labels, setLabels] = useState<Record<string, string>>(() =>
    Object.fromEntries(locales.supported.map((l) => [l, ""])),
  );

  const [type, setType] = useState<RegistrationFieldType>(
    RegistrationFieldType.STRING,
  );

  useEffect(() => {
    if (!open) return;

    setActiveLocale(locales.default);
    setType(field?.type ?? RegistrationFieldType.STRING);
    setRequired(field?.required ?? false);
    setLabels(
      Object.fromEntries(
        locales.supported.map((l) => [
          l,
          field?.translations.find((tr) => tr.locale === l)?.label ?? "",
        ]),
      ),
    );
  }, [open, field]);

  const { mutate: createField, isPending: createPending } =
    api.tournaments.registrationFields.create.useMutation({
      onSuccess: () => {
        toast.success(t("toast.field_created"));
        onSaved();
        setOpen(false);
      },
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

  const { mutate: updateField, isPending: updatePending } =
    api.tournaments.registrationFields.update.useMutation({
      onSuccess: () => {
        toast.success(t("toast.field_saved"));
        onSaved();
        setOpen(false);
      },
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

  const isPending = createPending || updatePending;

  const translations = locales.supported.map((l) => ({
    locale: l,
    label: labels[l] ?? "",
  }));

  const defaultLabel = labels[locales.default] ?? "";
  const isValid = defaultLabel.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    if (field) {
      updateField({ id: field.id, translations, type, required });
    } else {
      createField({
        tournamentId,
        translations,
        type,
        required,
        displayOrder: nextDisplayOrder,
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            size="sm"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            {t("add_field")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {field ? t("dialog.edit_title") : t("dialog.create_title")}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 pt-2"
        >
          {/* Locale tabs & field labels */}
          <div className="space-y-3">
            <div className="flex gap-1">
              {locales.supported.map((locale) => (
                <Button
                  key={locale}
                  type="button"
                  variant={activeLocale === locale ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setActiveLocale(locale)}
                >
                  {locale.toUpperCase()}
                </Button>
              ))}
            </div>

            {locales.supported.map((locale) => (
              <div
                key={locale}
                className={activeLocale === locale ? "" : "hidden"}
              >
                <Label htmlFor={`reg-label-${locale}`}>
                  {t("field_label")}
                  {locale === locales.default && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <Input
                  id={`reg-label-${locale}`}
                  className="mt-1"
                  value={labels[locale] ?? ""}
                  onChange={(e) =>
                    setLabels((prev) => ({ ...prev, [locale]: e.target.value }))
                  }
                  placeholder={t("field_label_placeholder")}
                />
              </div>
            ))}
          </div>

          {/* Field type */}
          <div className="space-y-1">
            <Label>{t("field_type_label")}</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as RegistrationFieldType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(RegistrationFieldType).map((ft) => (
                  <SelectItem
                    key={ft}
                    value={ft}
                  >
                    {t(`field_type.${ft.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Requirement checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="reg-field-required"
              checked={required}
              onCheckedChange={(v) => setRequired(!!v)}
            />
            <Label htmlFor="reg-field-required">{t("field_required")}</Label>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending || !isValid}
            >
              {field ? t("save") : t("add_field")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
