"use client";

import { api } from "@/trpc/react";
import { ArrowRight, Flame } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { NewsCard } from "../news/news-card";
import { Button } from "../ui";

/**
 * Featured news for home page.
 */
export function FeaturedNews() {
  const t = useTranslations("home.news");
  const locale = useLocale();
  const { data: posts = [] } = api.news.list.useQuery();

  const featuredPosts = posts.slice(0, 3).map((post) => {
    const tr = post.translations.find((tr) => tr.locale === locale);

    return {
      id: post.id,
      featured: post.featured,
      createdAt: post.createdAt,
      title: tr?.title ?? "",
      description: tr?.description,
      content: tr?.content ?? "",
    };
  });

  return (
    <div className="panel">
      <div className="panel-header flex items-center gap-2">
        <Flame className="h-5 w-5" />
        {t("title")}
      </div>

      <div className="space-y-2">
        {featuredPosts.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            {t("no_news")}
          </p>
        ) : (
          <>
            {featuredPosts.map((news) => (
              <Link
                key={news.id}
                href={`/news/${news.id}`}
                className="block"
              >
                <NewsCard news={news} />
              </Link>
            ))}

            <Button
              asChild
              className="bg-primary text-primary-foreground w-full"
            >
              <Link href="/news">
                {t("all_news_button")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
