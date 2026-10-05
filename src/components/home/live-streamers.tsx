import { TwitchIcon } from "@/components/icons";
import { PlayerLink } from "@/components/player-link";
import { api } from "@/trpc/server";
import { Eye, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

/**
 * Placeholder shown while the live streamers are being resolved.
 */
export function LiveStreamersLoading() {
  const t = useTranslations("home.live_streamers");

  return (
    <div>
      <div className="panel-header text-center">{t("title")}</div>
      <div className="flex items-center justify-center py-8">
        <Loader2 className="text-accent h-6 w-6 animate-spin" />
        <span className="text-muted-foreground ml-3 text-sm">
          {t("loading")}
        </span>
      </div>
    </div>
  );
}

/**
 * Players that have a stream link set and are currently live on Twitch playing
 * an Age of Empires game. Renders nothing when nobody is live.
 */
export async function LiveStreamers() {
  const t = useTranslations("home.live_streamers");

  let streamers: Awaited<ReturnType<typeof api.streams.getLiveStreamers>> = [];
  try {
    streamers = await api.streams.getLiveStreamers();
  } catch (error) {
    console.error("Failed to fetch live streamers:", error);
    return null;
  }

  if (streamers.length === 0) return null;

  return (
    <div className="border-medieval-wood-border mt-8 border-t pt-8">
      <div className="panel-header flex items-center justify-center gap-2 text-center">
        <span
          className="relative flex h-2.5 w-2.5"
          aria-hidden
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
        {t("title")}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {streamers.map((streamer) => (
          <div
            key={streamer.streamUrl}
            className="panel-parchment flex flex-col gap-3"
          >
            <a
              href={streamer.streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-video w-full overflow-hidden rounded-lg"
            >
              {streamer.thumbnailUrl && (
                <Image
                  src={streamer.thumbnailUrl}
                  alt={streamer.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 320px"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              )}

              <span className="absolute top-2 left-2 flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white shadow">
                <TwitchIcon className="size-3.5" />
                {t("live")}
              </span>

              <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
                <Eye className="h-3 w-3" />
                {streamer.viewerCount.toLocaleString()}
              </span>
            </a>

            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-foreground truncate font-bold">
                  <PlayerLink
                    playerNumber={streamer.playerNumber}
                    name={streamer.name}
                  />
                </span>
                {streamer.twitchName !== streamer.name && (
                  <span className="text-muted-foreground shrink-0 truncate text-sm">
                    {streamer.twitchName}
                  </span>
                )}
              </div>
              <a
                href={streamer.streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/80 line-clamp-2 text-sm hover:underline"
              >
                {streamer.title}
              </a>
              <div className="text-muted-foreground mt-1 truncate text-xs font-semibold">
                {streamer.gameName}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
