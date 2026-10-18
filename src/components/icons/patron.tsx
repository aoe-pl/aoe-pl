import { cn } from "@/lib/utils";
import type { JSX } from "react";

/**
 * Emblem shown next to the name of players that hold the PATRON role.
 */
export function PatronIcon({
  size = 20,
  className,
  ...props
}: JSX.IntrinsicElements["svg"] & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="7.3 42.3 196.3 248.5"
      fill="currentColor"
      className={cn("shrink-0", className)}
      {...props}
    >
      <path
        opacity={0.35}
        d="M174.3,123.5l-70.2-81.2l-69.4,83L7.3,194L37,263l69.8,27.8l69-29.7l27.8-69.8L174.3,123.5z"
      />
      <path
        strokeWidth={5}
        stroke="currentColor"
        fill="currentColor"
        d="M169,254.6l-62.4,26.8l-44.4-17.7l-0.8-51.3l7.6,17.7l37.1,14.8l36.7-15.8l47.4-27.7L169,254.6z    M17.5,195.9L63,169.1l-9.7,24.4l0.4,66.9l-10.1-4L17.5,195.9z M41.1,132.8l50.5,13.5l-23.5,10.1l-47.4,27.7L41.1,132.8z    M104.3,55.6l61.6,71.2l-13.9,52l-10.1-23.6L98.2,62.8L104.3,55.6z M157.6,192l14-53.1l21.8,50.7L148.1,216L157.6,192z M104.9,150   l30.4,12.1l12.9,30.1l-12.1,30.5L106,235.5l-30.4-12.1l-12.9-30.1l12.1-30.5L104.9,150z M104.8,140.5l-58.6-15.4l45.9-54.9   l37.9,80.4L104.8,140.5z M174.3,123.5l-70.2-81.2l-69.4,83L7.3,194L37,263l69.8,27.8l69-29.7l27.8-69.8L174.3,123.5z"
      />
    </svg>
  );
}
