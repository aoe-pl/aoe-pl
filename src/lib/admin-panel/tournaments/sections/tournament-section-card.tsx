"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { MarkdownEditorField } from "@/components/ui/markdown-editor-field";
import { Header, Trigger } from "@radix-ui/react-accordion";
import { AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import {
  updateSectionSchema,
  type UpdateSectionSchema,
  type SectionRowProps,
} from "./tournament-section-types";
import { TournamentSectionDeleteButton } from "./tournament-section-delete-button";
import { locales, type Locale } from "@/lib/locales";
import { predefinedTournamentSections } from "@/lib/tournaments/section-constants";

export function TournamentSectionCard({
  section,
  isFirst,
  isLast,
  movePending,
  onMoveUp,
  onMoveDown,
  onSaved,
}: SectionRowProps) {
  const t = useTranslations("admin.tournaments.sections");
  const locale = useLocale();
  const [activeLocale, setActiveLocale] = useState<Locale>(locales.default);

  const isPredefined = predefinedTournamentSections.some(
    (s) => s.slug === section.slug,
  );

  // The "information" section is mandatory and cannot be deleted
  // Tournament page defaults to it.
  const isMainSection = section.slug === "information";

  const displayTitle = isPredefined
    ? t(`predefined_titles.${section.slug}`)
    : (section.translations.find((tr) => tr.locale === locale)?.title ??
      section.translations.find((tr) => tr.locale === locales.supported[0])
        ?.title ??
      section.slug);

  const defaultTranslations = Object.fromEntries(
    locales.supported.map((locale) => {
      const tr = section.translations.find((tr) => tr.locale === locale);

      // For predefined sections the title field is hidden,
      // as we already use translations for the title.
      const title = tr?.title?.length
        ? tr.title
        : isPredefined
          ? t(`predefined_titles.${section.slug}`)
          : "";
      return [locale, { title, content: tr?.content ?? "" }];
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

  const isPending = updatePending || deletePending || visibilityPending;

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

  return (
    <AccordionItem
      value={section.id}
      className="bg-primary-foreground mb-3 rounded-lg border px-4"
    >
      <Header className="flex items-center">
        <Trigger className="flex flex-1 items-center gap-2 py-4 font-medium transition-all">
          <span className="flex-1 text-left">{displayTitle}</span>
          <span className="text-muted-foreground">/{section.slug}</span>
        </Trigger>

        {!isMainSection && (
          <div
            className="flex items-center gap-0.5 pl-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              disabled={isFirst || movePending || isPending}
              onClick={onMoveUp}
            >
              <ArrowUp />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={isLast || movePending || isPending}
              onClick={onMoveDown}
            >
              <ArrowDown />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={isPending}
              onClick={() =>
                setVisible({ id: section.id, isVisible: !section.isVisible })
              }
            >
              {section.isVisible ? <Eye /> : <EyeOff className="opacity-50" />}
            </Button>

            <TournamentSectionDeleteButton
              name={displayTitle}
              disabled={isPending}
              onConfirm={() => deleteSection({ id: section.id })}
            />
          </div>
        )}
      </Header>

      <AccordionContent className="pt-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  {locales.supported.map((locale) => (
                    <Button
                      key={locale}
                      type="button"
                      variant={
                        activeLocale === locale ? "default" : "secondary"
                      }
                      size="sm"
                      onClick={() => setActiveLocale(locale)}
                    >
                      {locale.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            {locales.supported.map((locale) => (
              <div
                key={locale}
                className={activeLocale === locale ? "" : "hidden"}
              >
                <div className="space-y-4">
                  {!isPredefined && (
                    <FormField
                      control={form.control}
                      name={`translations.${locale}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("section_title_label")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <MarkdownEditorField
                    control={form.control}
                    name={`translations.${locale}.content`}
                  />
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isPending}
              >
                {t("save_changes")}
              </Button>
            </div>
          </form>
        </Form>
      </AccordionContent>
    </AccordionItem>
  );
}
