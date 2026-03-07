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
    authorId?: string;
    translations: {
      locale: string;
      title: string;
      description?: string;
      content: string;
    }[];
  }) {
    return db.newsPost.create({
      data: {
        featured: data.featured,
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
  },

  async update(
    id: string,
    data: {
      featured?: boolean;
      translations?: {
        locale: string;
        title?: string;
        description?: string;
        content?: string;
      }[];
    },
  ) {
    if (data.translations?.length) {
      await db.$transaction(
        data.translations.map(({ locale, title, description, content }) =>
          db.newsPostTranslation.upsert({
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
          }),
        ),
      );
    }

    if (data.featured !== undefined) {
      return db.newsPost.update({
        where: { id },
        data: { featured: data.featured },
        include: { translations: true },
      });
    }

    return db.newsPost.findUniqueOrThrow({
      where: { id },
      include: { translations: true },
    });
  },

  async delete(id: string) {
    return db.newsPost.delete({ where: { id } });
  },
};
