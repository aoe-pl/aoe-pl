import { Flame, ArrowRight } from "lucide-react";
import { Button } from "../ui";
import { useTranslations } from "next-intl";

// Mock data - will be replaced with real news from database
const mockNews = [
  {
    id: 1,
    title: "Ant League 2026 - Edycja Zimowa",
    description:
      "AoEII ANThology: Ant League to polska liga Age of Empires II Definitive Edition, która jest projektem autorskim GwizdeK & newt. W każdym roku kalendarzowym planowane są dwie edycje: Wiosenna/Letnia i Jesienna/Zimowa. Głównym założeniem ligi jest zapewnienie wyrównanego poziomu dla każdego gracza - nie ważne czy jest doświadczony, początkujący czy dopiero stawia pierwsze kroki.",
    date: "01.01.2026 - 14.04.2026",
    featured: true,
  },
  {
    id: 2,
    title: "Nowy patch - stand ground patrol naprawiony!",
    hoursAgo: 2,
  },
  {
    id: 3,
    title: "Robin5Hood opowiada o swojej strategii",
    hoursAgo: 5,
  },
];

export function FeaturedNews() {
  const t = useTranslations("home.news");

  return (
    <div className="panel">
      <div className="panel-header flex items-center gap-2">
        <Flame className="h-5 w-5" />
        {t("title")}
      </div>

      <div className="space-y-4">
        {mockNews.map((news) =>
          news.featured ? (
            <div
              key={news.id}
              className="from-primary/20 to-accent/10 border-primary/30 rounded-xl border bg-gradient-to-br p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-foreground mb-2 text-lg font-bold">
                    {news.title}
                  </h3>
                  <p className="text-foreground/80 mb-4 text-sm">
                    {news.description}
                  </p>
                  <div className="text-accent flex items-center gap-2 text-xs font-semibold">
                    <span>📅 {news.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              key={news.id}
              className="bg-background/50 border-border/50 hover:border-accent/50 cursor-pointer rounded-lg border p-3 transition-colors"
            >
              <div className="text-foreground text-sm font-semibold">
                {news.title}
              </div>
              <div className="text-muted-foreground mt-1 text-xs">
                {t("hours_ago", { hours: news.hoursAgo ?? 0 })}
              </div>
            </div>
          ),
        )}

        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full gap-2">
          {t("all_news_button")}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
