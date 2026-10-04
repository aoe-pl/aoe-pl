"use client";

import { api } from "@/trpc/react";
import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { NewsCard } from "../news/news-card";
import { Button } from "../ui";

/** How many recent (non-featured) news posts to show on the home page. */
const LATEST_NEWS_LIMIT = 3;

/**
 * List of the most recent news posts for the home page. The featured post is
 * excluded because it is rendered separately at the top of the page.
 */
export function LatestNews() {
  const t = useTranslations("home.news");
  const locale = useLocale();
  const { data: posts = [] } = api.news.list.useQuery();

  const latestPosts = posts
    .filter((post) => !post.featured)
    .slice(0, LATEST_NEWS_LIMIT)
    .map((post) => {
      const tr = post.translations.find((tr) => tr.locale === locale);

      return {
        id: post.id,
        featured: post.featured,
        createdAt: post.createdAt,
        title: tr?.title ?? "",
        description: tr?.description,
        content: tr?.content ?? "",
        imageKey: post.imageKey,
      };
    });

  return (
    <div>
      <div className="panel-header text-center">{t("title")}</div>

      <div className="space-y-2">
        {latestPosts.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            {t("no_news")}
          </p>
        ) : (
          <>
            {latestPosts.map((news) => (
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
