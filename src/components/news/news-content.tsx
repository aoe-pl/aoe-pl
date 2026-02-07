"use client";

import { Calendar } from "lucide-react";
import dynamic from "next/dynamic";
import type { NewsPost } from "@/lib/mock-news";

const MDPreview = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default.Markdown),
  { ssr: false },
);

interface NewsContentProps {
  news: NewsPost;
}

export function NewsContent({ news }: NewsContentProps) {
  return (
    <article className="prose prose-zinc max-w-none">
      <div className="mb-4 flex items-center gap-4">
        <Calendar className="h-3 w-3" />
        {new Date(news.createdAt).toLocaleDateString()}
      </div>

      <h1 className="mb-6 text-4xl font-bold">{news.title}</h1>

      <div className="leading-relaxed">
        <MDPreview source={news.content} />
      </div>
    </article>
  );
}
