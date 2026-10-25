import type { AdminStreamStatus } from "@prisma/client";
import { Eye, Mic, RadioTower, type LucideIcon } from "lucide-react";

/**
 * Shared icon/label mapping for the admin coverage marker, used by both the
 * matches list and the calendar match tiles.
 */
export const ADMIN_MARKER_META: Record<
  AdminStreamStatus,
  { icon: LucideIcon; labelKey: string; className: string }
> = {
  WILL_BE_COMMENTATED: {
    icon: Mic,
    labelKey: "admin_stream.will_be_commentated",
    className: "text-medieval-gold-muted",
  },
  WILL_BE_WATCHED: {
    icon: Eye,
    labelKey: "admin_stream.will_be_watched",
    className: "text-medieval-gold-muted",
  },
  WATCHED: {
    icon: Eye,
    labelKey: "admin_stream.watched",
    className: "text-medieval-gold",
  },
  COMMENTATED: {
    icon: Mic,
    labelKey: "admin_stream.commentated",
    className: "text-medieval-gold",
  },
  WILL_BE_STREAMED_LIVE: {
    icon: RadioTower,
    labelKey: "admin_stream.will_be_streamed_live",
    className: "text-red-500",
  },
};
