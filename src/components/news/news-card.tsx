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
 *
 * The image occupies roughly 30% of the card width and fades out towards the
 * text using a CSS mask, so it blends into the parchment background.
 */
export function NewsCard({ news, variant = "default", badge }: NewsCardProps) {
  const isFeatured = variant === "featured";
  const imageUrl = getNewsImageUrl(news);

  return (
    <div
      className={cn(
        "panel-parchment flex overflow-hidden",
        isFeatured
          ? "gap-6 border-l-4 border-[#e6c052] p-6"
          : "gap-4 transition-shadow hover:shadow-lg",
      )}
    >
      {imageUrl && (
        <div
          className={cn(
            "relative w-[30%] shrink-0 overflow-hidden rounded-lg",
            isFeatured ? "aspect-video" : "aspect-[4/3]",
          )}
        >
          <Image
            src={imageUrl}
            alt={news.title}
            fill
            sizes="(max-width: 1024px) 40vw, 320px"
            className="[mask-image:linear-gradient(to_right,#000_55%,transparent)] object-cover"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {badge}

        <h3
          className={cn(
            "text-foreground font-bold",
            isFeatured ? "text-2xl sm:text-3xl" : "text-base",
          )}
        >
          {news.title}
        </h3>

        {news.description && (
          <p
            className={cn(
              "text-foreground line-clamp-3",
              isFeatured ? "text-base" : "text-sm",
            )}
          >
            {news.description}
          </p>
        )}

        <div className="mt-auto flex gap-2 pt-2 text-xs font-semibold">
          <span>📅 {new Date(news.createdAt).toLocaleDateString("pl-PL")}</span>
        </div>
      </div>
    </div>
  );
}
