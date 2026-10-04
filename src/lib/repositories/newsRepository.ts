import { db } from "@/server/db";

export const newsRepository = {
  async list() {
    return db.newsPost.findMany({
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: { translations: true },
    });
  },

  async getById(id: string) {
    return db.newsPost.findUnique({
      where: { id },
      include: { translations: true },
    });
  },

  async create(data: {
    featured: boolean;
    imageKey?: string | null;
    authorId?: string;
    translations: {
      locale: string;
      title: string;
      description?: string;
      content: string;
    }[];
  }) {
    return db.$transaction(async (tx) => {
      // Only one news post can be featured at a time.
      if (data.featured) {
        await tx.newsPost.updateMany({
          where: { featured: true },
          data: { featured: false },
        });
      }

      return tx.newsPost.create({
        data: {
          featured: data.featured,
          imageKey: data.imageKey ?? null,
          authorId: data.authorId,
          translations: {
            create: data.translations.map(
              ({ locale, title, description, content }) => ({
                locale,
                title,
                description,
                content,
              }),
            ),
          },
        },
        include: { translations: true },
      });
    });
  },

  async update(
    id: string,
    data: {
      featured?: boolean;
      imageKey?: string | null;
      translations?: {
        locale: string;
        title?: string;
        description?: string;
        content?: string;
      }[];
    },
  ) {
    return db.$transaction(async (tx) => {
      if (data.translations?.length) {
        for (const {
          locale,
          title,
          description,
          content,
        } of data.translations) {
          await tx.newsPostTranslation.upsert({
            where: { newsPostId_locale: { newsPostId: id, locale } },
            update: {
              ...(title !== undefined && { title }),
              ...(description !== undefined && { description }),
              ...(content !== undefined && { content }),
            },
            create: {
              newsPostId: id,
              locale,
              title: title ?? "",
              description,
              content: content ?? "",
            },
          });
        }
      }

      // Only one news post can be featured at a time.
      if (data.featured) {
        await tx.newsPost.updateMany({
          where: { featured: true, id: { not: id } },
          data: { featured: false },
        });
      }

      const postData: { featured?: boolean; imageKey?: string | null } = {};
      if (data.featured !== undefined) postData.featured = data.featured;
      if (data.imageKey !== undefined) postData.imageKey = data.imageKey;

      if (Object.keys(postData).length > 0) {
        return tx.newsPost.update({
          where: { id },
          data: postData,
          include: { translations: true },
        });
      }

      return tx.newsPost.findUniqueOrThrow({
        where: { id },
        include: { translations: true },
      });
    });
  },

  async delete(id: string) {
    return db.newsPost.delete({ where: { id } });
  },
};
