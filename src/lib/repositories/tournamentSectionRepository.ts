import { db } from "@/server/db";
import { predefinedTournamentSections } from "@/lib/tournaments/section-constants";

export const tournamentSectionRepository = {
  async getSectionsByTournamentId(tournamentId: string) {
    return db.tournamentSection.findMany({
      where: { tournamentId },
      orderBy: { displayOrder: "asc" },
      include: { translations: true },
    });
  },

  async getSectionBySlug(tournamentId: string, slug: string) {
    return db.tournamentSection.findUnique({
      where: { tournamentId_slug: { tournamentId, slug } },
      include: { translations: true },
    });
  },

  async createSection(data: {
    tournamentId: string;
    slug: string;
    isVisible?: boolean;
    displayOrder?: number;
    translations: { locale: string; title: string; content?: string }[];
  }) {
    return db.tournamentSection.create({
      data: {
        tournamentId: data.tournamentId,
        slug: data.slug,
        isVisible: data.isVisible ?? true,
        displayOrder: data.displayOrder ?? 0,
        translations: {
          create: data.translations.map(({ locale, title, content }) => ({
            locale,
            title,
            content,
          })),
        },
      },
      include: { translations: true },
    });
  },

  async updateSection(
    id: string,
    data: {
      isVisible?: boolean;
      translations?: { locale: string; title?: string; content?: string }[];
    },
  ) {
    if (data.translations?.length) {
      await db.$transaction(
        data.translations.map(({ locale, title, content }) =>
          db.tournamentSectionTranslation.upsert({
            where: { sectionId_locale: { sectionId: id, locale } },
            update: {
              ...(title !== undefined && { title }),
              ...(content !== undefined && { content }),
            },
            create: { sectionId: id, locale, title: title ?? "", content },
          }),
        ),
      );
    }

    if (data.isVisible !== undefined) {
      return db.tournamentSection.update({
        where: { id },
        data: { isVisible: data.isVisible },
        include: { translations: true },
      });
    }

    return db.tournamentSection.findUniqueOrThrow({
      where: { id },
      include: { translations: true },
    });
  },

  async deleteSection(id: string) {
    return db.tournamentSection.delete({ where: { id } });
  },

  async reorderSections(updates: { id: string; displayOrder: number }[]) {
    return db.$transaction(
      updates.map(({ id, displayOrder }) =>
        db.tournamentSection.update({ where: { id }, data: { displayOrder } }),
      ),
    );
  },

  async createPredefinedSections(tournamentId: string) {
    const existing = await db.tournamentSection.findMany({
      where: { tournamentId },
      select: { slug: true },
    });
    const existingSlugs = new Set(existing.map((s) => s.slug));

    const sectionsToCreate = predefinedTournamentSections.filter(
      (s) => !existingSlugs.has(s.slug),
    );

    if (sectionsToCreate.length === 0) return [];

    return Promise.all(
      sectionsToCreate.map((s) =>
        db.tournamentSection.create({
          data: {
            tournamentId,
            slug: s.slug,
            displayOrder: s.displayOrder,
            isVisible: true,
          },
          include: { translations: true },
        }),
      ),
    );
  },
};
