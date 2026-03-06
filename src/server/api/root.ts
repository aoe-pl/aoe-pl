import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { baseMapRouter } from "./baseMap";
import { civRouter } from "./civ";
import { leaderboardRouter } from "./leaderboard";
import { mapRouter } from "./map";
import { newsRouter } from "./news";
import { rolesRouter } from "./roles";
import { testRouter } from "./test";
import { tournamentRouter } from "./tournament";
import { usersRouter } from "./users";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  test: testRouter,
  tournaments: tournamentRouter,
  users: usersRouter,
  maps: mapRouter,
  baseMaps: baseMapRouter,
  civs: civRouter,
  roles: rolesRouter,
  leaderboard: leaderboardRouter,
  news: newsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
