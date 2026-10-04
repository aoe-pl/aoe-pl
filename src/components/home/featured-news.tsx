"use client";

import { api } from "@/trpc/react";
import { ArrowRight } from "lucide-react";
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
    <div>
      <div className="panel-header text-center">{t("title")}</div>

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
              className="w-full font-semibold text-[#221a10] shadow-md transition-colors hover:text-[#221a10]"
              style={{ backgroundColor: "#e6c052" }}
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
