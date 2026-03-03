"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/error-toast-content";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import {
  predefinedTournamentSections,
  specialTournamentSectionSlugs,
} from "@/lib/tournaments/section-constants";
import { locales } from "@/lib/locales";

interface TournamentSpecialSectionDialogProps {
  tournamentId: string;
  existingSlugs: Set<string>;
  onCreated: () => void;
}

export function TournamentSpecialSectionDialog({
  tournamentId,
  existingSlugs,
  onCreated,
}: TournamentSpecialSectionDialogProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("admin.tournaments.sections");

  const available = predefinedTournamentSections.filter(
    (s) =>
      specialTournamentSectionSlugs.has(s.slug) && !existingSlugs.has(s.slug),
  );

  const { mutate: createSection, isPending } =
    api.tournaments.sections.create.useMutation({
      onSuccess: () => {
        onCreated();
        setOpen(false);
      },
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

  if (available.length === 0) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          {t("add_special_section")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialog.special_title")}</DialogTitle>
          <DialogDescription>
            {t("dialog.special_description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          {available.map((s) => (
            <Button
              key={s.slug}
              variant="outline"
              className="w-full justify-start"
              disabled={isPending}
              onClick={() =>
                createSection({
                  tournamentId,
                  slug: s.slug,
                  displayOrder: s.displayOrder,
                  translations: [
                    {
                      locale: locales.default,
                      title: t(`predefined_titles.${s.slug}`),
                    },
                  ],
                })
              }
            >
              {t(`predefined_titles.${s.slug}`)}
              <span className="text-muted-foreground ml-auto text-xs">
                /{s.slug}
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
