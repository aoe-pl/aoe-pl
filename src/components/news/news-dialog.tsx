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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MarkdownEditorField } from "@/components/ui/markdown-editor-field";
import { Textarea } from "@/components/ui/textarea";
import { locales, type Locale } from "@/lib/locales";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const translationSchema = z.object({
  title: z.string().min(1, "news.dialog.validation.title_required"),
  description: z.string().optional(),
  content: z.string().min(1, "news.dialog.validation.content_required"),
});

const formSchema = z.object({
  featured: z.boolean(),
  translations: z.record(z.string(), translationSchema),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  featured: false,
  translations: Object.fromEntries(
    locales.supported.map((locale) => [
      locale,
      { title: "", description: "", content: "" },
    ]),
  ),
};

interface NewsDialogProps {
  id?: string;
  trigger?: React.ReactNode;
}

/**
 *  Dialog for creating/editing news posts, used in both the news list and news detail pages
 */
export function NewsDialog({ id, trigger }: NewsDialogProps) {
  const t = useTranslations("news.dialog");
  const [open, setOpen] = useState(false);
  const [activeLocale, setActiveLocale] = useState<Locale>(locales.default);
  const utils = api.useUtils();

  const { data: existingPost } = api.news.getById.useQuery(
    { id: id! },
    { enabled: !!id },
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    if (existingPost) {
      const translations = Object.fromEntries(
        locales.supported.map((locale) => {
          const tr = existingPost.translations.find((t) => t.locale === locale);
          return [
            locale,
            {
              title: tr?.title ?? "",
              description: tr?.description ?? "",
              content: tr?.content ?? "",
            },
          ];
        }),
      );
      form.reset({ featured: existingPost.featured, translations });
    } else {
      form.reset(defaultValues);
    }
  }, [open, existingPost, form]);

  const { mutate: createPost, isPending: createPending } =
    api.news.create.useMutation({
      onSuccess: async () => {
        await utils.news.list.invalidate();

        form.reset(defaultValues);

        setOpen(false);
      },
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

  const { mutate: updatePost, isPending: updatePending } =
    api.news.update.useMutation({
      onSuccess: async () => {
        await utils.news.list.invalidate();

        if (id) await utils.news.getById.invalidate({ id });

        setOpen(false);
      },
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

  const isPending = createPending || updatePending;

  function onSubmit(values: FormValues) {
    const translations = Object.entries(values.translations).map(
      ([locale, data]) => ({ locale, ...data }),
    );
    if (id) {
      updatePost({ id, featured: values.featured, translations });
    } else {
      createPost({ featured: values.featured, translations });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus /> {t("form.submit_add")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{id ? t("edit_title") : t("add_title")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Buttons for each supported language */}
            <div className="flex gap-1">
              {locales.supported.map((locale) => {
                const hasError = !!form.formState.errors.translations?.[locale];

                return (
                  <Button
                    key={locale}
                    type="button"
                    variant={activeLocale === locale ? "default" : "secondary"}
                    size="sm"
                    className={
                      hasError && activeLocale !== locale
                        ? "border-destructive text-destructive"
                        : ""
                    }
                    onClick={() => setActiveLocale(locale)}
                  >
                    {locale.toUpperCase()}
                    {hasError && activeLocale !== locale && (
                      <span className="bg-destructive ml-1 h-1.5 w-1.5 rounded-full" />
                    )}
                  </Button>
                );
              })}
            </div>

            {/* Fields for each supported language */}
            {locales.supported.map((locale) => (
              <div
                key={locale}
                className={activeLocale === locale ? "space-y-4" : "hidden"}
              >
                <FormField
                  control={form.control}
                  name={`translations.${locale}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.title_label")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("form.title_placeholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`translations.${locale}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.description_label")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("form.description_placeholder")}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <MarkdownEditorField
                  control={form.control}
                  name={`translations.${locale}.content`}
                  label={t("form.content_label")}
                />
              </div>
            ))}

            {/* Pinned news field */}
            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem className="flex">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel>{t("form.featured_label")}</FormLabel>
                    <FormDescription>
                      {t("form.featured_description")}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {id ? t("form.submit_save") : t("form.submit_add")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
