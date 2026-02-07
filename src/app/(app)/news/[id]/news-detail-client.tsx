"use client";

import { useNewsStore } from "@/lib/store/news-store";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { NewsAdminActions } from "@/components/news/news-admin-actions";
import { NewsContent } from "@/components/news/news-content";

interface NewsDetailContentProps {
  id: string;
  isAdmin: boolean;
}

export function NewsDetailContent({ id, isAdmin }: NewsDetailContentProps) {
  const t = useTranslations("news.detail");
  const { getPost } = useNewsStore();

  const newsItem = getPost(id);

  if (!newsItem) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24 text-center">
        <h1 className="text-2xl font-bold">{t("not_found")}</h1>
        <Button
          variant="link"
          asChild
          className="mt-4"
        >
          <Link href="/news">{t("back_to_list")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-10 max-w-3xl px-4 py-8 pt-24">
      <div className="mb-8 flex items-center justify-between">
        <Button asChild>
          <Link href="/news">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("back_to_list")}
          </Link>
        </Button>

        {isAdmin && <NewsAdminActions newsId={id} />}
      </div>

      <NewsContent news={newsItem} />
    </div>
  );
}
