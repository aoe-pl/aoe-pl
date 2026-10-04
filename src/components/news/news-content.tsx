"use client";

import { getNewsImageUrl, type NewsPost } from "@/components/news/news-card";
import { Calendar } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { ReactNode } from "react";

const MDPreview = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default.Markdown),
  { ssr: false },
);

interface NewsContentProps {
  news: NewsPost;
  actions?: ReactNode;
}

export function NewsContent({ news, actions }: NewsContentProps) {
  const imageUrl = getNewsImageUrl(news);

  return (
    <article className="panel prose prose-zinc max-w-none">
      {actions && (
        <div className="not-prose mb-6 flex flex-wrap items-center justify-between gap-2">
          {actions}
        </div>
      )}

      {imageUrl && (
        <div className="not-prose relative mb-6 aspect-video w-full overflow-hidden rounded-lg">
          <Image
            src={imageUrl}
            alt={news.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}

      <div className="text-secondary-foreground mb-4 flex items-center gap-4">
        <Calendar className="h-3 w-3" />
        {new Date(news.createdAt).toLocaleDateString("pl-PL")}
      </div>

      <h1 className="text-secondary-foreground mb-6 text-4xl font-bold">
        {news.title}
      </h1>

      <div className="leading-relaxed">
        <MDPreview source={news.content} />
      </div>
    </article>
  );
}
