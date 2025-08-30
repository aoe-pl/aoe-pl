import { z } from "zod";
  import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "@/server/api/trpc";
import { usersRepository } from "@/lib/repositories/usersRepository";

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email").optional(),
  color: z.string().optional(),
  adminComment: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
});

export const usersRouter = createTRPCRouter({
  list: adminProcedure.query(async () => {
    return usersRepository.getUsers();
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return usersRepository.getUserById(input.id);
    }),

  getWithDetails: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return usersRepository.getUserWithDetails(input.id);
    }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: updateUserSchema }))
    .mutation(async ({ input, ctx }) => {
      return usersRepository.updateUser(
        input.id,
        input.data,
        ctx.session?.user?.id,
      );
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const usageCount = await usersRepository.getUserUsageCount(input.id);
      if (usageCount > 0) {
        throw new Error(
          `Cannot delete user. They have ${usageCount} associated record(s).`,
        );
      }
      return usersRepository.deleteUser(input.id);
    }),

  getUsageCount: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return usersRepository.getUserUsageCount(input.id);
    }),

  isAdmin: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      return false;
    }

    return usersRepository.isUserAdmin(ctx.session.user.id);
  }),
});
