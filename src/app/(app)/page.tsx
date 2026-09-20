import { FeaturedNews } from "@/components/home/featured-news";
import { TopPlayers, TopPlayersLoading } from "@/components/home/top-players";
import { UpcomingMatches } from "@/components/home/upcoming-matches";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

export default function Home() {
  const t = useTranslations("home.hero");
  return (
    <div className="text-foreground min-h-screen">
      <div className="relative mx-auto max-w-6xl px-4 py-32">
        <div className="text-center">
          <h1 className="text-foreground mb-4 text-4xl font-bold text-balance drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
            {t("title")}
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="from-accent to-accent h-1 w-12 bg-gradient-to-r" />
            <span className="text-accent text-base font-semibold tracking-wider uppercase drop-shadow-lg sm:text-lg">
              {t("subtitle")}
            </span>
            <div className="from-accent to-accent h-1 w-12 bg-gradient-to-l" />
          </div>
        </div>
      </div>

      <main className="relative z-10 mx-auto -mt-14 max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="space-y-8 lg:col-span-2">
            <FeaturedNews />
            <UpcomingMatches />
          </section>

          <aside>
            <Suspense fallback={<TopPlayersLoading />}>
              <TopPlayers />
            </Suspense>
          </aside>
        </div>
      </main>
    </div>
  );
}
