"use client";

import { NewsDialog } from "@/components/news/news-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { api } from "@/trpc/react";
import { Pencil, Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface NewsAdminActionsProps {
  newsId: string;
}

export function NewsAdminActions({ newsId }: NewsAdminActionsProps) {
  const t = useTranslations("news.detail");
  const tDialog = useTranslations("news.dialog");
  const router = useRouter();
  const utils = api.useUtils();

  const { mutate: deletePost, isPending } = api.news.delete.useMutation({
    onSuccess: async () => {
      await utils.news.list.invalidate();
      router.push("/news");
    },
    onError: (error) => toast.error(<ErrorToast message={error.message} />),
  });

  return (
    <div className="flex gap-2">
      <NewsDialog
        id={newsId}
        trigger={
          <Button variant="secondary">
            <Pencil className="mr-2 h-4 w-4" />
            {t("edit")}
          </Button>
        }
      />

      <ConfirmDialog
        trigger={
          <Button
            variant="destructive"
            disabled={isPending}
          >
            <Trash className="mr-2 h-4 w-4" />
            {t("delete")}
          </Button>
        }
        title={tDialog("delete_title")}
        description={tDialog("delete_description")}
        cancelLabel={tDialog("delete_cancel")}
        confirmLabel={tDialog("delete_confirm")}
        onConfirm={() => deletePost({ id: newsId })}
        confirmClassName=""
      />
    </div>
  );
}
