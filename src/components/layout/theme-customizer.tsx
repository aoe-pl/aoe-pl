"use client";

import { useState, useLayoutEffect } from "react";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { storage } from "@/lib/local-storage";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const colorPalette = [
  // Blue
  ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"],
  // Green
  ["#ccff66", "#ccff99", "#b3ffb3", "#86efac"],
  // Yellow
  ["#ca8a04", "#eab308", "#facc15", "#fde047"],
  // Orange
  ["#ea580c", "#f97316", "#fb923c", "#fdba74"],
  // Red
  ["#dc2626", "#ef4444", "#f05656", "#fca5a5"],
  // Purple
  ["#9333ea", "#a855f7", "#c084fc", "#d8b4fe"],
  // White/Light Gray
  ["#a1a1a1", "#c5c5c5", "#d1d1d1", "#ffffff"],
];

const renderColorGrid = (
  selectedColor: string,
  onColorClick: (color: string) => void,
) => {
  const rows = 4;
  const buttons = [];

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    for (let colIndex = 0; colIndex < colorPalette.length; colIndex++) {
      const color = colorPalette[colIndex]?.[rowIndex];

      if (!color) continue;

      buttons.push(
        <button
          key={`${colIndex}-${rowIndex}`}
          onClick={() => onColorClick(color)}
          className={cn("h-9 w-9 rounded-md border")}
          style={{ backgroundColor: color }}
          title={color}
        >
          {selectedColor === color && (
            <div className="inset-0 flex justify-center">
              <Check className="h-6 w-6 text-black" />
            </div>
          )}
        </button>,
      );
    }
  }

  return buttons;
};

export function ThemeCustomizer() {
  const t = useTranslations("home.theme_customizer");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(() => {
    const savedColor = storage.getItem("themeColor");
    return savedColor ?? "#f05656";
  });

  useLayoutEffect(() => {
    applyTheme(selectedColor);
  }, [selectedColor]);

  const applyTheme = (hexColor: string) => {
    document.documentElement.style.setProperty("--primary", hexColor);
    document.documentElement.style.setProperty("--accent", hexColor);
  };

  const handleColorClick = (color: string) => {
    setSelectedColor(color);
    storage.setItem("themeColor", color);
    applyTheme(color);
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed right-4 bottom-4 z-50 h-12 w-12 rounded-full shadow-lg"
        >
          <Palette className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96"
        align="end"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("select_theme_color")}
            </label>
            <div
              className="grid gap-2 p-2"
              style={{
                gridTemplateColumns: `repeat(${colorPalette.length}, 1fr)`,
              }}
            >
              {renderColorGrid(selectedColor, handleColorClick)}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
