"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { MarkdownEditorField } from "@/components/ui/markdown-editor-field";
import { useNewsStore } from "@/lib/store/news-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const formSchema = z.object({
  title: z.string().min(1, "news.dialog.validation.title_required"),
  description: z.string().optional(),
  content: z.string().min(1, "news.dialog.validation.content_required"),
  featured: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  title: "",
  description: "",
  content: "",
  featured: false,
};

interface NewsDialogProps {
  id?: string;
  trigger?: React.ReactNode;
}

export function NewsDialog({ id, trigger }: NewsDialogProps) {
  const t = useTranslations("news.dialog");
  const [open, setOpen] = useState(false);
  const { addPost, updatePost, getPost } = useNewsStore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    const postToEdit = id ? getPost(id) : undefined;
    form.reset(postToEdit ?? defaultValues);
  }, [open, id, getPost, form]);

  function onSubmit(values: FormValues) {
    if (id) {
      updatePost(id, values);
    } else {
      addPost(values);
    }
    setOpen(false);
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
            <FormField
              control={form.control}
              name="title"
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
              name="description"
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
              name="content"
              label={t("form.content_label")}
            />

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
                  <div className="space-y-1 leading-none">
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
            >
              {id ? t("form.submit_save") : t("form.submit_add")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
