import type { NewsPost } from "@/lib/mock-news";

interface NewsCardProps {
  news: NewsPost;
}

export function NewsCard({ news }: NewsCardProps) {
  const isFeatured = news.featured;

  const cardStyle = isFeatured
    ? "rounded-xl border p-4 from-primary/20 to-accent/10 border-primary/30 bg-gradient-to-br"
    : "rounded-xl border p-4 bg-card/50 border-border/50 hover:border-primary/50 hover:shadow-lg";

  return (
    <div className={`${cardStyle}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <h3 className="text-foreground text-base font-bold">{news.title}</h3>

          {news.description && (
            <p className="text-foreground/80 line-clamp-3 text-sm">
              {news.description}
            </p>
          )}

          <div className={`flex gap-2 text-xs font-semibold text-white`}>
            <span>📅 {new Date(news.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
