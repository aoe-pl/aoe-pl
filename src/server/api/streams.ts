import { usersRepository } from "@/lib/repositories/usersRepository";
import { fetchLiveAgeOfEmpiresStreams, isTwitchConfigured } from "@/lib/twitch";
import { getTwitchLoginFromUrl } from "@/lib/utils";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const streamsRouter = createTRPCRouter({
  /**
   * Players that linked a Twitch channel and are currently live playing an
   * Age of Empires game, sorted by viewer count.
   */
  getLiveStreamers: publicProcedure.query(async () => {
    if (!isTwitchConfigured) return [];

    const users = await usersRepository.getUsersWithStreamUrl();

    // Map each Twitch channel to the player that owns it. Only Twitch links
    // can be checked for live status; other platforms are ignored.
    const byLogin = new Map<
      string,
      { playerNumber: number; name: string | null; streamUrl: string }
    >();

    for (const user of users) {
      if (!user.streamUrl) continue;

      const login = getTwitchLoginFromUrl(user.streamUrl);

      if (!login || byLogin.has(login)) continue;

      byLogin.set(login, {
        playerNumber: user.playerNumber,
        name: user.name,
        streamUrl: user.streamUrl,
      });
    }

    const streams = await fetchLiveAgeOfEmpiresStreams([...byLogin.keys()]);

    return streams
      .map((stream) => {
        const player = byLogin.get(stream.login);

        if (!player) return null;

        return {
          playerNumber: player.playerNumber,
          name: player.name ?? stream.userName,
          twitchName: stream.userName,
          title: stream.title,
          gameName: stream.gameName,
          viewerCount: stream.viewerCount,
          startedAt: stream.startedAt,
          thumbnailUrl: stream.thumbnailUrl,
          streamUrl: player.streamUrl,
        };
      })
      .filter((stream) => stream !== null)
      .sort((a, b) => b.viewerCount - a.viewerCount);
  }),
});
