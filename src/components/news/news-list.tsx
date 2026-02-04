"use client";

import { useNewsStore } from "@/lib/store/news-store";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { NewsDialog } from "@/components/news/news-dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { NewsCard } from "@/components/news/news-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function NewsList({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations("news");
  const { posts, deletePost } = useNewsStore();

  const sortedNews = [...posts].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <>
      {isAdmin && (
        <div className="mb-8 flex justify-end">
          <NewsDialog />
        </div>
      )}

      <div className="grid gap-6">
        {sortedNews.map((news) => (
          <div
            key={news.id}
            className="group relative block"
          >
            <Link href={`/news/${news.id}`}>
              <NewsCard news={news} />
            </Link>

            {isAdmin && (
              <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <NewsDialog
                  id={news.id}
                  trigger={
                    <Button
                      variant="secondary"
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="h-8 w-8"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("dialog.delete_title")}
                      </AlertDialogTitle>

                      <AlertDialogDescription>
                        {t("dialog.delete_description")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("dialog.delete_cancel")}
                      </AlertDialogCancel>

                      <AlertDialogAction onClick={() => deletePost(news.id)}>
                        {t("dialog.delete_confirm")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
