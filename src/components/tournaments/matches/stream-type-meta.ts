import type { StreamType } from "@prisma/client";
import { Mic, Video, type LucideIcon } from "lucide-react";

/**
 * Shared icon/label mapping for user-marked match streams, used by the matches
 * list, the calendar tiles and the match detail page.
 */
export const STREAM_TYPE_META: Record<
  StreamType,
  { icon: LucideIcon; labelKey: string; className: string }
> = {
  POV: {
    icon: Video,
    labelKey: "stream.type.pov",
    className: "text-red-500",
  },
  COMMENTARY: {
    icon: Mic,
    labelKey: "stream.type.commentary",
    className: "text-red-500",
  },
};
