import { cn, isBrightColor } from "@/lib/utils";

interface GroupLabelProps {
  name: string;
  color?: string | null;
  className?: string;
}

/**
 * Renders a tournament group name as a label tinted with the group's colour,
 */
export function GroupLabel({ name, color, className }: GroupLabelProps) {
  return (
    <span
      className={cn(
        "inline-block rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        !color && "bg-secondary/40 text-foreground/80",
        className,
      )}
      style={
        color
          ? {
              backgroundColor: color,
              color: isBrightColor(color) ? "black" : "white",
            }
          : undefined
      }
    >
      {name}
    </span>
  );
}
