import { newsRepository } from "@/lib/repositories/newsRepository";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";
import { z } from "zod";

const translationSchema = z.object({
  locale: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
});

export const newsRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return newsRepository.list();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return newsRepository.getById(input.id);
    }),

  create: adminProcedure
    .input(
      z.object({
        featured: z.boolean().default(false),
        translations: z.array(translationSchema).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return newsRepository.create({
        featured: input.featured,
        authorId: ctx.session!.user.id, // Must be logged in as admin to create news posts, can assert session is not null
        translations: input.translations,
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        featured: z.boolean().optional(),
        translations: z
          .array(
            z.object({
              locale: z.string(),
              title: z.string().optional(),
              description: z.string().optional(),
              content: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return newsRepository.update(id, data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return newsRepository.delete(input.id);
    }),
});
