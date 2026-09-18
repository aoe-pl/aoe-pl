export interface NewsPost {
  id: string;
  featured: boolean;
  createdAt: Date | string;
  title: string;
  description?: string | null;
  content: string;
}

interface NewsCardProps {
  news: NewsPost;
}

export function NewsCard({ news }: NewsCardProps) {
  const isFeatured = news.featured;

  const cardStyle = isFeatured
    ? "panel-parchment border-l-4 border-[#e6c052]"
    : "panel-parchment transition-shadow hover:shadow-lg";

  return (
    <div className={`${cardStyle}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <h3 className="text-foreground text-base font-bold">{news.title}</h3>

          {news.description && (
            <p className="text-foreground text-md line-clamp-3">
              {news.description}
            </p>
          )}

          <div className={`flex gap-2 text-xs font-semibold`}>
            <span>
              📅 {new Date(news.createdAt).toLocaleDateString("pl-PL")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
