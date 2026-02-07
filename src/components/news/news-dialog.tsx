"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
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
import { useNewsStore } from "@/lib/store/news-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

const formSchema = z.object({
  title: z.string().min(1, "news.dialog.validation.title_required"),
  description: z.string().optional(),
  content: z.string().min(1, "news.dialog.validation.content_required"),
  featured: z.boolean(),
});

type FormValues = {
  title: string;
  description?: string;
  content: string;
  featured: boolean;
};

interface NewsDialogProps {
  id?: string; // If provided, we are editing
  trigger?: React.ReactNode;
}

export function NewsDialog({ id, trigger }: NewsDialogProps) {
  const t = useTranslations("news.dialog");
  const [open, setOpen] = useState(false);
  const { addPost, updatePost, getPost } = useNewsStore();
  const postToEdit = id ? getPost(id) : undefined;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      featured: false,
    },
  });

  // Reset form when dialog opens or id changes
  useEffect(() => {
    if (!open) return;

    if (postToEdit) {
      form.reset({
        title: postToEdit.title,
        description: postToEdit.description,
        content: postToEdit.content,
        featured: postToEdit.featured,
      });

      return;
    }

    form.reset({
      title: "",
      description: "",
      content: "",
      featured: false,
    });
  }, [open, postToEdit, form]);

  function onSubmit(values: FormValues) {
    if (id) {
      updatePost(id, values);
      toast.success(t("success.updated"));
    } else {
      addPost(values);
      toast.success(t("success.added"));
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

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.content_label")}</FormLabel>
                  <FormControl>
                    <div
                      data-color-mode="dark"
                      className="[&_.w-md-editor]:!bg-background [&_.w-md-editor]:!border-border [&_.w-md-editor-toolbar]:!bg-background/50 [&_.wmde-markdown]:!bg-background [&_.w-md-editor-text]:!bg-background [&_.w-md-editor-text-pre]:!bg-background"
                    >
                      <MDEditor
                        value={field.value}
                        onChange={(val) => field.onChange(val ?? "")}
                        preview="edit"
                        height={300}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
