"use client";

import { api } from "@/trpc/react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { NewsCard } from "../news/news-card";

/**
 * The single pinned/"featured" news post, shown full width at the top of the
 * home page. Renders nothing when no post is featured.
 */
export function FeaturedNews() {
  const locale = useLocale();
  const { data: posts = [] } = api.news.list.useQuery();

  const featured = posts.find((post) => post.featured);

  if (!featured) return null;

  const tr = featured.translations.find((tr) => tr.locale === locale);

  const news = {
    id: featured.id,
    featured: true,
    createdAt: featured.createdAt,
    title: tr?.title ?? "",
    description: tr?.description,
    content: tr?.content ?? "",
    imageKey: featured.imageKey,
  };

  return (
    <Link
      href={`/news/${news.id}`}
      className="mb-8 block"
    >
      <NewsCard
        news={news}
        variant="featured"
      />
    </Link>
  );
}
