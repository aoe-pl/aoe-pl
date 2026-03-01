"use client";

import { useState } from "react";
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
import { slugify } from "@/lib/utils";
import { specialTournamentSectionSlugs } from "@/lib/tournaments/section-constants";
import {
  createSectionSchema,
  type CreateSectionSchema,
} from "./tournament-section-types";

interface TournamentSectionDialogProps {
  tournamentId: string;
  existingSlugs: Set<string>;
  onCreated: () => void;
}

export function TournamentSectionDialog({
  tournamentId,
  existingSlugs,
  onCreated,
}: TournamentSectionDialogProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("admin.tournaments.sections");

  const form = useForm<CreateSectionSchema>({
    resolver: zodResolver(createSectionSchema),
    defaultValues: { title: "" },
  });

  const { mutate: createSection, isPending } =
    api.tournaments.sections.create.useMutation({
      onSuccess: () => {
        toast.success(t("toast.created"));
        form.reset();
        setOpen(false);
        onCreated();
      },
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

  function onSubmit(values: CreateSectionSchema) {
    const slug = slugify(values.title);

    if (specialTournamentSectionSlugs.has(slug)) {
      form.setError("title", { message: t("error.reserved_slug") });
      return;
    }

    if (existingSlugs.has(slug)) {
      form.setError("title", { message: t("error.slug_taken") });
      return;
    }
    createSection({ tournamentId, title: values.title, slug });
  }

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
          {t("add_section")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialog.create_title")}</DialogTitle>
          <DialogDescription>
            {t("dialog.create_description")}
          </DialogDescription>
        </DialogHeader>
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isPending}
              >
                {t("create_section")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
