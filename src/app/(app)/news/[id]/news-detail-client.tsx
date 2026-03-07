"use client";

import { NewsAdminActions } from "@/components/news/news-admin-actions";
import { NewsContent } from "@/components/news/news-content";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

interface NewsDetailContentProps {
  id: string;
  isAdmin: boolean;
}

export function NewsDetailContent({ id, isAdmin }: NewsDetailContentProps) {
  const t = useTranslations("news.detail");
  const locale = useLocale();
  const { data: post } = api.news.getById.useQuery({ id });

  if (!post) {
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

  const tr = post.translations.find((tr) => tr.locale === locale);

  const newsItem = {
    id: post.id,
    featured: post.featured,
    createdAt: post.createdAt,
    title: tr?.title ?? "",
    description: tr?.description,
    content: tr?.content ?? "",
  };

  return (
    <div className="container mx-auto mt-10 max-w-3xl px-4 py-8 pt-24">
      <div className="mb-8 flex items-center justify-between">
        <Button
          asChild
          variant="secondary"
        >
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
