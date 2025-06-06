import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { usersRepository } from "@/lib/repositories/usersRepository";

export const usersRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return usersRepository.getUsers();
  }),
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return usersRepository.getUserById(input.id);
    }),
}); 