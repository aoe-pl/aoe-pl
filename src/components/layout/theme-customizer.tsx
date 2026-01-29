"use client";

import { useState, useEffect } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { storage } from "@/lib/local-storage";

const DEFAULT_COLORS = {
  primary: "#e85d4d",
  accent: "#f07c5f",
};

export function ThemeCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_COLORS.primary);
  const [accentColor, setAccentColor] = useState(DEFAULT_COLORS.accent);

  useEffect(() => {
    const savedPrimary = storage.getItem("themePrimary");
    const savedAccent = storage.getItem("themeAccent");

    if (savedPrimary) {
      setPrimaryColor(savedPrimary);
      applyColor("--primary", savedPrimary);
    }
    if (savedAccent) {
      setAccentColor(savedAccent);
      applyColor("--accent", savedAccent);
    }
  }, []);

  const applyColor = (variable: string, hexColor: string) => {
    document.documentElement.style.setProperty(variable, hexColor);
  };

  const handleColorChange = (value: string) => {
    setPrimaryColor(value);
    setAccentColor(value);
    applyColor("--primary", value);
    applyColor("--accent", value);
    storage.setItem("themePrimary", value);
    storage.setItem("themeAccent", value);
  };

  const resetColors = () => {
    document.documentElement.style.removeProperty("--primary");
    document.documentElement.style.removeProperty("--accent");
    storage.removeItem("themePrimary");
    storage.removeItem("themeAccent");

    setPrimaryColor(DEFAULT_COLORS.primary);
    setAccentColor(DEFAULT_COLORS.accent);
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
        className="w-80"
        align="end"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Kolor</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="h-10 w-20 cursor-pointer rounded border"
              />
              <div className="text-muted-foreground flex-1 font-mono text-xs">
                {primaryColor}
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={resetColors}
          >
            Przywróć domyślne
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
