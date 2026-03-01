"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
import { Switch } from "@/components/ui/switch";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { MarkdownEditorField } from "@/components/ui/markdown-editor-field";
import { Header, Trigger } from "@radix-ui/react-accordion";
import { AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  updateSectionSchema,
  type UpdateSectionSchema,
  type SectionRowProps,
} from "./tournament-section-types";
import { TournamentSectionDeleteButton } from "./tournament-section-delete-button";

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

  const form = useForm<UpdateSectionSchema>({
    resolver: zodResolver(updateSectionSchema),
    defaultValues: {
      title: section.title,
      content: section.content ?? "",
    },
  });

  const { mutate: updateSection, isPending: updatePending } =
    api.tournaments.sections.update.useMutation({
      onSuccess: () => {
        toast.success(t("toast.saved", { name: section.title }));
        onSaved();
      },
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

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

  const isPending = updatePending || deletePending || visibilityPending;

  function onSubmit(values: UpdateSectionSchema) {
    updateSection({
      id: section.id,
      title: values.title,
      content: values.content,
    });
  }

  return (
    <AccordionItem
      value={section.id}
      className="bg-primary-foreground mb-3 rounded-lg border px-4"
    >
      <Header className="flex items-center">
        <Trigger className="flex flex-1 items-center gap-2 py-4 text-sm font-medium transition-all">
          <span className="flex-1 text-left">{section.title}</span>
          <span className="text-muted-foreground">/{section.slug}</span>
        </Trigger>
        <div
          className="flex items-center gap-0.5 pl-2"
          onClick={(e) => e.stopPropagation()}
        >
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
        <div
          className="flex items-center gap-1 pl-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Switch
            checked={section.isVisible}
            disabled={isPending}
            onCheckedChange={(checked) =>
              setVisible({ id: section.id, isVisible: checked })
            }
          />
          {section.slug !== "information" && (
            <TournamentSectionDeleteButton
              name={section.title}
              disabled={isPending}
              onConfirm={() => deleteSection({ id: section.id })}
            />
          )}
        </div>
      </Header>
      <AccordionContent className="pt-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("section_title_label")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={section.slug === "information"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <MarkdownEditorField
              control={form.control}
              name="content"
            />
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
