import { db } from "@/server/db";
import type { RegistrationFieldType } from "@prisma/client";

export const tournamentRegistrationFieldRepository = {
  async list(tournamentId: string) {
    return db.tournamentRegistrationField.findMany({
      where: { tournamentId },
      orderBy: { displayOrder: "asc" },
      include: { translations: true },
    });
  },

  async create(data: {
    tournamentId: string;
    translations: { locale: string; label: string }[];
    type: RegistrationFieldType;
    required: boolean;
    displayOrder?: number;
  }) {
    const { translations, ...rest } = data;
    return db.tournamentRegistrationField.create({
      data: {
        ...rest,
        translations: { create: translations },
      },
      include: { translations: true },
    });
  },

  async update(
    id: string,
    data: {
      translations?: { locale: string; label: string }[];
      type?: RegistrationFieldType;
      required?: boolean;
    },
  ) {
    const { translations, ...rest } = data;

    if (translations?.length) {
      await db.$transaction(
        translations.map(({ locale, label }) =>
          db.tournamentRegistrationFieldTranslation.upsert({
            where: { fieldId_locale: { fieldId: id, locale } },
            update: { label },
            create: { fieldId: id, locale, label },
          }),
        ),
      );
    }

    if (Object.keys(rest).length) {
      return db.tournamentRegistrationField.update({
        where: { id },
        data: rest,
        include: { translations: true },
      });
    }

    return db.tournamentRegistrationField.findUniqueOrThrow({
      where: { id },
      include: { translations: true },
    });
  },

  async delete(id: string) {
    return db.tournamentRegistrationField.delete({ where: { id } });
  },

  async reorder(updates: { id: string; displayOrder: number }[]) {
    return db.$transaction(
      updates.map(({ id, displayOrder }) =>
        db.tournamentRegistrationField.update({
          where: { id },
          data: { displayOrder },
        }),
      ),
    );
  },
};
