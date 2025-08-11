"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import type { Civ } from "@prisma/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DrawerFooter } from "@/components/ui/drawer";

const civilizationFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  content: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

export type CivilizationFormSchema = z.infer<typeof civilizationFormSchema>;

interface CivilizationFormProps {
  initialData?: Civ;
  onSubmit: (data: CivilizationFormSchema) => void;
  onCancel: () => void;
  isPending: boolean;
}

export function CivilizationForm({
  initialData,
  onSubmit,
  onCancel,
  isPending,
}: CivilizationFormProps) {
  const t = useTranslations("admin.settings.civilizations.form");

  const form = useForm<CivilizationFormSchema>({
    resolver: zodResolver(civilizationFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      content: initialData?.content ?? "",
      thumbnailUrl: initialData?.thumbnailUrl ?? "",
    },
  });

  const handleSubmit = (data: CivilizationFormSchema) => {
    onSubmit(data);
  };

  return (
    <ScrollArea className="h-[60vh] px-4">
      <div className="space-y-6 p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("name_placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("description_placeholder")}
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("description_help")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("content")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("content_placeholder")}
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("content_help")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("thumbnail_url")}</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder={t("thumbnail_url_placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("thumbnail_url_help")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DrawerFooter className="flex-row justify-end">
              <Button
                type="submit"
                disabled={isPending}
              >
                {isPending
                  ? initialData
                    ? t("updating")
                    : t("creating")
                  : initialData
                    ? t("update")
                    : t("create")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
            </DrawerFooter>
          </form>
        </Form>
      </div>
    </ScrollArea>
  );
}
