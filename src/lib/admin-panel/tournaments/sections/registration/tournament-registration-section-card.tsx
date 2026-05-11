"use client";

import { AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { Form, FormField } from "@/components/ui/form";
import { MarkdownEditorField } from "@/components/ui/markdown-editor-field";
import { locales, type Locale } from "@/lib/locales";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  TournamentRegistrationField,
  TournamentRegistrationFieldTranslation,
} from "@prisma/client";
import { Header, Trigger } from "@radix-ui/react-accordion";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TournamentSectionDeleteButton } from "../tournament-section-delete-button";
import {
  updateSectionSchema,
  type SectionRowProps,
  type UpdateSectionSchema,
} from "../tournament-section-types";
import { RegistrationFieldDialog } from "./registration-field-dialog";
import { RegistrationFieldRow } from "./registration-field-row";

type FieldWithTranslations = TournamentRegistrationField & {
  translations: TournamentRegistrationFieldTranslation[];
};

export function TournamentRegistrationSectionCard({
  section,
  isFirst,
  isLast,
  movePending,
  onMoveUp,
  onMoveDown,
  onSaved,
}: SectionRowProps) {
  const t = useTranslations("admin.tournaments.sections");
  const tReg = useTranslations("admin.tournaments.sections.registration");
  const displayTitle = t(`predefined_titles.${section.slug}`);

  const [activeLocale, setActiveLocale] = useState<Locale>(locales.default);
  const [editingField, setEditingField] =
    useState<FieldWithTranslations | null>(null);

  // ── Section description form ──
  const defaultTranslations = Object.fromEntries(
    locales.supported.map((locale) => {
      const tr = section.translations.find((tr) => tr.locale === locale);
      return [
        locale,
        {
          title: t(`predefined_titles.${section.slug}`),
          content: tr?.content ?? "",
        },
      ];
    }),
  );

  const form = useForm<UpdateSectionSchema>({
    resolver: zodResolver(updateSectionSchema),
    defaultValues: { translations: defaultTranslations },
  });

  const { mutate: updateSection, isPending: updatePending } =
    api.tournaments.sections.update.useMutation({
      onSuccess: () => {
        toast.success(t("toast.saved", { name: displayTitle }));
        onSaved();
      },
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

  function onSubmit(values: UpdateSectionSchema) {
    updateSection({
      id: section.id,
      translations: Object.entries(values.translations).map(
        ([locale, data]) => ({
          locale,
          title: data.title,
          content: data.content,
        }),
      ),
    });
  }

  // ── Registration fields ──
  const { data: fields = [], refetch: refetchFields } =
    api.tournaments.registrationFields.list.useQuery({
      tournamentId: section.tournamentId,
    });

  const { mutate: reorderFields, isPending: reorderPending } =
    api.tournaments.registrationFields.reorder.useMutation({
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
        void refetchFields();
      },
    });

  function moveField(index: number, direction: "up" | "down") {
    const next = [...fields];
    const swapWith = direction === "up" ? index - 1 : index + 1;

    [next[index], next[swapWith]] = [next[swapWith]!, next[index]!];

    const updated = next.map((f, i) => ({ ...f, displayOrder: i }));

    reorderFields({
      updates: updated.map((f) => ({ id: f.id, displayOrder: f.displayOrder })),
    });
  }

  // ── Section header controls ──
  const { mutate: deleteSection, isPending: deletePending } =
    api.tournaments.sections.delete.useMutation({
      onSuccess: () => {
        toast.success(t("toast.removed", { name: displayTitle }));
        onSaved();
      },
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

  const { mutate: setVisible, isPending: visibilityPending } =
    api.tournaments.sections.update.useMutation({
      onSuccess: () => onSaved(),
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

  const headerPending = deletePending || visibilityPending;
  const isPending = headerPending || updatePending;

  return (
    <AccordionItem
      value={section.id}
      className="bg-primary-foreground mb-3 rounded-lg border px-4"
    >
      <Header className="flex items-center">
        <Trigger className="flex flex-1 items-center gap-2 py-4 font-medium transition-all">
          <span className="flex-1 text-left">{displayTitle}</span>
          <Badge
            variant="secondary"
            className="shrink-0"
          >
            {t("special_badge")}
          </Badge>
          <span className="text-muted-foreground">/{section.slug}</span>
        </Trigger>

        <div
          className="flex items-center gap-0.5 pl-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            disabled={isFirst || movePending || headerPending}
            onClick={onMoveUp}
          >
            <ArrowUp />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={isLast || movePending || headerPending}
            onClick={onMoveDown}
          >
            <ArrowDown />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={headerPending}
            onClick={() =>
              setVisible({ id: section.id, isVisible: !section.isVisible })
            }
          >
            {section.isVisible ? <Eye /> : <EyeOff className="opacity-50" />}
          </Button>
          <TournamentSectionDeleteButton
            name={displayTitle}
            disabled={headerPending}
            onConfirm={() => deleteSection({ id: section.id })}
          />
        </div>
      </Header>

      <AccordionContent className="space-y-6 pt-2 pb-4">
        {/* ── Section description editor ── */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
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
                <FormField
                  control={form.control}
                  name={`translations.${locale}.title`}
                  render={() => <></>}
                />
                <MarkdownEditorField
                  control={form.control}
                  name={`translations.${locale}.content`}
                />
              </div>
            ))}
            <Button
              type="submit"
              disabled={isPending}
            >
              {t("save_changes")}
            </Button>
          </form>
        </Form>

        {/* ── Registration fields ── */}
        <div className="space-y-2 border-t pt-4">
          <p className="text-muted-foreground mb-3 text-xs">
            {tReg("fields_description")}
          </p>

          {fields.length === 0 && (
            <p className="text-muted-foreground text-sm">{tReg("no_fields")}</p>
          )}

          {(fields as FieldWithTranslations[]).map((field, index) => (
            <RegistrationFieldRow
              key={field.id}
              field={field}
              isFirst={index === 0}
              isLast={index === fields.length - 1}
              movePending={reorderPending}
              onMoveUp={() => moveField(index, "up")}
              onMoveDown={() => moveField(index, "down")}
              onEdit={() => setEditingField(field)}
              onSaved={() => void refetchFields()}
            />
          ))}

          <div className="pt-1">
            <RegistrationFieldDialog
              tournamentId={section.tournamentId}
              nextDisplayOrder={fields.length}
              onSaved={() => void refetchFields()}
            />
          </div>

          {editingField && (
            <RegistrationFieldDialog
              tournamentId={section.tournamentId}
              field={editingField}
              open={true}
              onOpenChange={(v) => {
                if (!v) setEditingField(null);
              }}
              onSaved={() => {
                void refetchFields();
                setEditingField(null);
              }}
            />
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
