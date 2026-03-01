import { z } from "zod";
import type { TournamentSection } from "@prisma/client";

export const createSectionSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany"),
});
export type CreateSectionSchema = z.infer<typeof createSectionSchema>;

export const updateSectionSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
});
export type UpdateSectionSchema = z.infer<typeof updateSectionSchema>;

export interface SectionRowProps {
  section: TournamentSection;
  isFirst: boolean;
  isLast: boolean;
  movePending: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSaved: () => void;
}
