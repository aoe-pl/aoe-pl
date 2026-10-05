import { FeaturedNews } from "@/components/home/featured-news";
import { LatestNews } from "@/components/home/latest-news";
import {
  LiveStreamers,
  LiveStreamersLoading,
} from "@/components/home/live-streamers";
import { TopPlayers, TopPlayersLoading } from "@/components/home/top-players";
import { UpcomingMatches } from "@/components/home/upcoming-matches";
import { DiscordIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { env } from "@/env";
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

          <div className="mt-8 flex justify-center">
            <Button
              asChild
              size="lg"
              className="text-primary-foreground bg-accent gap-2 font-semibold shadow-lg"
            >
              <a
                href={env.DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <DiscordIcon className="size-5" />
                {t("discord_button")}
              </a>
            </Button>
          </div>
        </div>
      </div>

      <main className="relative z-10 mx-auto -mt-14 max-w-6xl px-4 pb-16">
        <FeaturedNews />

        <div className="panel">
          <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
            <section className="lg:border-medieval-wood-border lg:col-span-2 lg:border-r lg:pr-8">
              <div className="pb-8">
                <LatestNews />
              </div>

              <div className="border-medieval-wood-border border-t pt-8 lg:border-t-0 lg:pt-0">
                <UpcomingMatches />
              </div>
            </section>

            <aside className="border-medieval-wood-border mt-8 border-t pt-8 lg:mt-0 lg:border-t-0 lg:pt-0">
              <Suspense fallback={<TopPlayersLoading />}>
                <TopPlayers />
              </Suspense>
            </aside>
          </div>

          <Suspense fallback={<LiveStreamersLoading />}>
            <LiveStreamers />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
