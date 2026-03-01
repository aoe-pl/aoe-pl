import { db } from "@/server/db";
import {
  predefinedTournamentSections,
  specialTournamentSectionSlugs,
} from "@/lib/tournaments/section-constants";
export {
  predefinedTournamentSections as PREDEFINED_SECTIONS,
  specialTournamentSectionSlugs as SPECIAL_SECTION_SLUGS,
};

export const tournamentSectionRepository = {
  async getSectionsByTournamentId(tournamentId: string) {
    return db.tournamentSection.findMany({
      where: { tournamentId },
      orderBy: { displayOrder: "asc" },
    });
  },

  async getSectionBySlug(tournamentId: string, slug: string) {
    return db.tournamentSection.findUnique({
      where: { tournamentId_slug: { tournamentId, slug } },
    });
  },

  async createSection(data: {
    tournamentId: string;
    title: string;
    slug: string;
    content?: string;
    isVisible?: boolean;
    displayOrder?: number;
  }) {
    return db.tournamentSection.create({
      data: {
        tournamentId: data.tournamentId,
        title: data.title,
        slug: data.slug,
        content: data.content,
        isVisible: data.isVisible ?? true,
        displayOrder: data.displayOrder ?? 0,
      },
    });
  },

  async updateSection(
    id: string,
    data: {
      title?: string;
      content?: string;
      isVisible?: boolean;
    },
  ) {
    return db.tournamentSection.update({
      where: { id },
      data,
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

  async createPredefinedSections(
    tournamentId: string,
    titleMap: Record<string, string>,
  ) {
    const existing = await db.tournamentSection.findMany({
      where: { tournamentId },
      select: { slug: true },
    });
    const existingSlugs = new Set(existing.map((s) => s.slug));

    const toCreate = predefinedTournamentSections.filter(
      (s) => !existingSlugs.has(s.slug),
    );

    if (toCreate.length === 0) return [];

    return db.tournamentSection.createManyAndReturn({
      data: toCreate.map((s) => ({
        tournamentId,
        title: titleMap[s.slug] ?? s.slug,
        slug: s.slug,
        displayOrder: s.displayOrder,
        isVisible: true,
      })),
    });
  },
};
