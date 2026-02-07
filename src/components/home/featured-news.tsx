"use client";

import { Flame, ArrowRight } from "lucide-react";
import { Button } from "../ui";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useNewsStore } from "@/lib/store/news-store";
import { NewsCard } from "../news/news-card";

export function FeaturedNews() {
  const t = useTranslations("home.news");
  const { posts } = useNewsStore(); // TODO Fetch posts from database when connected

  const featuredPosts = [...posts]
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 3);

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
