import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getIsProductionEnv = () => {
  return process.env.NODE_ENV === "production";
};

/**
 * Determines if a hex color is bright or dark.
 * @param hexColor Hex color string.
 * @returns True if the color is bright, false if dark.
 */
export function isBrightColor(hexColor: string): boolean {
  const hex = hexColor.replace("#", "");

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate perceived brightness (using formula for relative luminance)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 120;
}
