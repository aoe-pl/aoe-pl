"use client";

import { useNewsStore } from "@/lib/store/news-store";
import Link from "next/link";
import { NewsDialog } from "@/components/news/news-dialog";
import { NewsCard } from "@/components/news/news-card";

export function NewsList({ isAdmin }: { isAdmin: boolean }) {
  const { posts } = useNewsStore();

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
          <Link
            key={news.id}
            href={`/news/${news.id}`}
          >
            <NewsCard news={news} />
          </Link>
        ))}
      </div>
    </>
  );
}
