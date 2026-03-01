"use client";

import { Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { NewsDialog } from "@/components/news/news-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useNewsStore } from "@/lib/store/news-store";
import { useRouter } from "next/navigation";

interface NewsAdminActionsProps {
  newsId: string;
}

export function NewsAdminActions({ newsId }: NewsAdminActionsProps) {
  const t = useTranslations("news.detail");
  const tDialog = useTranslations("news.dialog");
  const { deletePost } = useNewsStore();
  const router = useRouter();

  const handleDelete = () => {
    deletePost(newsId);
    router.push("/news");
  };

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
          <Button variant="destructive">
            <Trash className="mr-2 h-4 w-4" />
            {t("delete")}
          </Button>
        }
        title={tDialog("delete_title")}
        description={tDialog("delete_description")}
        cancelLabel={tDialog("delete_cancel")}
        confirmLabel={tDialog("delete_confirm")}
        onConfirm={handleDelete}
        confirmClassName=""
      />
    </div>
  );
}
