import { Suspense } from "react";
import { FeaturedNews } from "@/components/home/featured-news";
import { TopPlayers, TopPlayersLoading } from "@/components/home/top-players";
import { UpcomingMatches } from "@/components/home/upcoming-matches";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("home.hero");
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="relative overflow-hidden pt-20">
        <Image
          src="/aoe2-bg.png"
          alt=""
          fill
          priority
          className="object-cover object-[center_30%]"
          quality={75}
        />
        <div className="from-background/80 via-background/60 to-background absolute inset-0 bg-gradient-to-b via-50%" />
        <div className="from-background absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 text-center">
            <h1 className="text-foreground mb-4 text-4xl font-bold text-balance drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
              {t("title")}
            </h1>
            <div className="mb-6 flex items-center justify-center gap-3">
              <div
                className="from-primary to-accent h-1 w-12 bg-gradient-to-r"
                aria-hidden="true"
              />
              <span className="text-primary text-base font-semibold tracking-wider uppercase drop-shadow-lg sm:text-lg">
                {t("subtitle")}
              </span>
              <div
                className="from-primary to-accent h-1 w-12 bg-gradient-to-l"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-4 max-w-6xl px-4 py-8">
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
