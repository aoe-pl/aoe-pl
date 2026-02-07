"use client";

import { useNewsStore } from "@/lib/store/news-store";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

const MDPreview = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default.Markdown),
  { ssr: false },
);

export default function NewsDetailClient() {
  const t = useTranslations("news.detail");
  const params = useParams();
  const id = params.id as string;
  const { getPost } = useNewsStore();

  const newsItem = getPost(id);

  if (!newsItem) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24 text-center">
        <h1 className="text-2xl font-bold">{t("not_found")}</h1>
        <Button
          variant="link"
          asChild
          className="mt-4"
        >
          <Link href="/news">{t("back_to_list")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-10 max-w-3xl px-4 py-8 pt-24">
      <div className="mb-8">
        <Button asChild>
          <Link href="/news">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("back_to_list")}
          </Link>
        </Button>
      </div>

      <article className="prose prose-zinc max-w-none">
        <div className="mb-4 flex items-center gap-4">
          <Calendar className="h-3 w-3" />
          {new Date(newsItem.createdAt).toLocaleDateString()}
        </div>

        <h1 className="mb-6 text-4xl font-bold">{newsItem.title}</h1>

        <div
          className="leading-relaxed"
          data-color-mode="dark"
        >
          <MDPreview source={newsItem.content} />
        </div>
      </article>
    </div>
  );
}
