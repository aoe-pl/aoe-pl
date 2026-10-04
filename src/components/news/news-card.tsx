import { cn } from "@/lib/utils";
import Image from "next/image";
import type { ReactNode } from "react";

export interface NewsPost {
  id: string;
  featured: boolean;
  createdAt: Date | string;
  title: string;
  description?: string | null;
  content: string;
  imageKey?: string | null;
}

/**
 * Build the public URL that serves the news cover image out of the storage
 * bucket. Returns `null` when the post has no image attached.
 */
export function getNewsImageUrl(
  news: Pick<NewsPost, "id" | "imageKey">,
): string | null {
  return news.imageKey
    ? `/api/news/${news.id}/image?v=${encodeURIComponent(news.imageKey)}`
    : null;
}

interface NewsCardProps {
  news: NewsPost;
  /**
   * `featured` renders the large, full-width variant used on top of the home
   * page. `default` is the compact card used in lists.
   */
  variant?: "default" | "featured";
  /** Optional content rendered above the title (e.g. a "featured" badge). */
  badge?: ReactNode;
}

/**
 * News card with an image on the left and the text on the right.
 */
export function NewsCard({ news, variant = "default", badge }: NewsCardProps) {
  const isFeatured = variant === "featured";
  const showFeaturedAccent = news.featured && !isFeatured;
  const imageUrl = getNewsImageUrl(news);

  return (
    <div
      className={cn(
        "panel-parchment flex overflow-hidden",
        isFeatured
          ? "gap-6 border-x-4 border-[#e6c052] p-6"
          : "h-32 gap-3 p-3 transition-shadow hover:shadow-lg",
        showFeaturedAccent && "border-x-4 border-[#e6c052]",
      )}
    >
      {imageUrl && (
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded-lg",
            isFeatured ? "aspect-video w-[30%]" : "w-28 sm:w-36",
          )}
        >
          <Image
            src={imageUrl}
            alt={news.title}
            fill
            sizes={
              isFeatured
                ? "(max-width: 1024px) 40vw, 320px"
                : "(min-width: 640px) 144px, 112px"
            }
            className="object-cover"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {badge}

        <h3
          className={cn(
            "text-foreground font-bold",
            isFeatured ? "text-2xl sm:text-3xl" : "line-clamp-1 text-base",
          )}
        >
          {news.title}
        </h3>

        {news.description && (
          <p
            className={cn(
              "text-foreground",
              isFeatured ? "line-clamp-3 text-base" : "line-clamp-2 text-sm",
            )}
          >
            {news.description}
          </p>
        )}

        <div className="mt-auto flex gap-2 text-xs font-semibold">
          <span>📅 {new Date(news.createdAt).toLocaleDateString("pl-PL")}</span>
        </div>
      </div>
    </div>
  );
}
