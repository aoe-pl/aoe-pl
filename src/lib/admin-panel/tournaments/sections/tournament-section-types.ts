import { z } from "zod";
import type {
  TournamentSection,
  TournamentSectionTranslation,
} from "@prisma/client";

export const createSectionSchema = z.object({
  title: z.string().min(1),
});
export type CreateSectionSchema = z.infer<typeof createSectionSchema>;

export const translationSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
});

export const updateSectionSchema = z.object({
  translations: z.record(z.string(), translationSchema),
});
export type UpdateSectionSchema = z.infer<typeof updateSectionSchema>;

export type SectionWithTranslations = TournamentSection & {
  translations: TournamentSectionTranslation[];
};

export interface SectionRowProps {
  section: SectionWithTranslations;
  isFirst: boolean;
  isLast: boolean;
  movePending: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSaved: () => void;
}
