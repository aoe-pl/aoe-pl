"use client";

import { NewsCard } from "@/components/news/news-card";
import { NewsDialog } from "@/components/news/news-dialog";
import { Input } from "@/components/ui/input";
import { useNewsStore } from "@/lib/store/news-store";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

export function NewsList({ isAdmin }: { isAdmin: boolean }) {
  const { posts } = useNewsStore();
  const t = useTranslations("news");
  const [query, setQuery] = useState("");

  const filteredNews = [...posts]
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .filter((news) => news.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="panel">
      <div className={`mb-6 flex gap-3 ${isAdmin ? "justify-between" : ""}`}>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t("search_placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {isAdmin && <NewsDialog />}
      </div>

      <div className="grid gap-6">
        {filteredNews.length === 0 ? (
          <p className="py-12 text-center">{t("no_results")}</p>
        ) : (
          filteredNews.map((news) => (
            <Link
              key={news.id}
              href={`/news/${news.id}`}
            >
              <NewsCard news={news} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
