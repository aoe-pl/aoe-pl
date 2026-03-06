"use client";

import type { NewsPost } from "@/lib/mock-news";
import { Calendar } from "lucide-react";
import dynamic from "next/dynamic";

const MDPreview = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default.Markdown),
  { ssr: false },
);

interface NewsContentProps {
  news: NewsPost;
}

export function NewsContent({ news }: NewsContentProps) {
  return (
    <article className="panel prose prose-zinc max-w-none">
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
