"use client";

import { Check } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, isBrightColor } from "@/lib/utils";

/**
 * Standard Ant League group colours.
 */
export const defaultColorPresets = [
  "#9966FF", // Master of the Ants
  "#D7BC78", // Gold Ants
  "#A8A0A0", // Rotation groups
  "#FF6666", // Red Ants
  "#3D3D3D", // Black Ants
  "#0099FF", // Blue Ants
  "#009933", // Green Ants
  "#B59A0C", // Yellow Ants
] as const;

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

type RgbInput = {
  r: string;
  g: string;
  b: string;
};

function normalizeHexColor(input?: string | null): string | null {
  if (!input) return null;

  let hex = input.trim().replace(/^#/, "");

  if (/^[0-9a-f]{3}$/i.test(hex)) {
    hex = hex
      .split("")
      .map((character) => character + character)
      .join("");
  }

  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : null;
}

function hexToRgb(hex: string | null): RgbColor | null {
  if (!hex) return null;

  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }: RgbColor): string {
  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function rgbToInput(rgb: RgbColor | null): RgbInput {
  return rgb
    ? { r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) }
    : { r: "", g: "", b: "" };
}

function parseChannel(input: string): number | null {
  const trimmed = input.trim();

  if (!/^\d{1,3}$/.test(trimmed)) return null;

  const value = Number(trimmed);
  return value <= 255 ? value : null;
}

type ColorPickerProps = Omit<
  React.ComponentProps<"button">,
  "value" | "onChange" | "type"
> & {
  value?: string | null;
  onChange: (value: string) => void;
  presets?: readonly string[];
};

export function ColorPicker({
  value,
  onChange,
  presets = defaultColorPresets,
  disabled,
  className,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...triggerProps
}: ColorPickerProps) {
  const generatedId = React.useId();
  const fieldsId = id ?? generatedId;

  const normalizedValue = React.useMemo(
    () => normalizeHexColor(value),
    [value],
  );

  const [hexInput, setHexInput] = React.useState(value ?? "");
  const [rgbInput, setRgbInput] = React.useState<RgbInput>(() =>
    rgbToInput(hexToRgb(normalizedValue)),
  );
  const lastEmittedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    // Skip external updates caused by our own onChange calls so partial input
    // (for example a three-digit hex being typed) is not rewritten.
    if (value === lastEmittedRef.current) return;

    setHexInput(value ?? "");
    setRgbInput(rgbToInput(hexToRgb(normalizedValue)));
  }, [value, normalizedValue]);

  const colorPresets = React.useMemo(
    () =>
      presets
        .map((preset) => normalizeHexColor(preset))
        .filter((preset): preset is string => preset !== null),
    [presets],
  );

  const selectColor = (
    color: string,
    options?: { keepHexInput?: boolean; keepRgbInput?: boolean },
  ) => {
    const normalized = normalizeHexColor(color);
    if (!normalized) return;

    lastEmittedRef.current = normalized;
    onChange(normalized);

    if (!options?.keepHexInput) {
      setHexInput(normalized);
    }

    if (!options?.keepRgbInput) {
      setRgbInput(rgbToInput(hexToRgb(normalized)));
    }
  };

  const handleHexChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setHexInput(nextValue);

    const normalized = normalizeHexColor(nextValue);
    if (normalized) {
      selectColor(normalized, { keepHexInput: true });
    }
  };

  const handleHexBlur = () => {
    setHexInput(normalizedValue ?? "");
  };

  const handleRgbChange = (
    channel: keyof RgbInput,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextInput = { ...rgbInput, [channel]: event.target.value };
    setRgbInput(nextInput);

    const r = parseChannel(nextInput.r);
    const g = parseChannel(nextInput.g);
    const b = parseChannel(nextInput.b);

    if (r !== null && g !== null && b !== null) {
      selectColor(rgbToHex({ r, g, b }), {
        keepHexInput: false,
        keepRgbInput: true,
      });
    }
  };

  const handleRgbBlur = () => {
    const r = parseChannel(rgbInput.r);
    const g = parseChannel(rgbInput.g);
    const b = parseChannel(rgbInput.b);

    setRgbInput(
      rgbToInput(
        r !== null && g !== null && b !== null
          ? { r, g, b }
          : hexToRgb(normalizedValue),
      ),
    );
  };

  const handleClear = () => {
    lastEmittedRef.current = "";
    onChange("");
    setHexInput("");
    setRgbInput({ r: "", g: "", b: "" });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          disabled={disabled}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          className={cn("w-full justify-start gap-2 font-normal", className)}
          {...triggerProps}
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-5 shrink-0 rounded-sm border",
              !normalizedValue && "border-dashed",
            )}
            style={
              normalizedValue ? { backgroundColor: normalizedValue } : undefined
            }
          />
          <span
            className={cn(
              "font-mono text-xs",
              !normalizedValue && "text-muted-foreground",
            )}
          >
            {normalizedValue ?? "Pick a color"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 space-y-3 p-3"
      >
        <div className="grid grid-cols-4 gap-2">
          {colorPresets.map((preset) => {
            const isSelected = normalizedValue === preset;

            return (
              <button
                key={preset}
                type="button"
                title={preset}
                aria-label={`Select color ${preset}`}
                aria-pressed={isSelected}
                className={cn(
                  "focus-visible:ring-ring flex size-10 items-center justify-center rounded-md border transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:outline-none",
                  isSelected && "ring-ring ring-2 ring-offset-2",
                )}
                style={{ backgroundColor: preset }}
                onClick={() => selectColor(preset)}
              >
                {isSelected && (
                  <Check
                    className="size-4"
                    style={{
                      color: isBrightColor(preset) ? "#000000" : "#FFFFFF",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="bg-border h-px" />

        <div className="grid gap-1.5">
          <label
            htmlFor={`${fieldsId}-hex`}
            className="text-muted-foreground text-xs font-medium"
          >
            Hex
          </label>
          <Input
            id={`${fieldsId}-hex`}
            value={hexInput}
            onChange={handleHexChange}
            onBlur={handleHexBlur}
            placeholder="#FF6666"
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            className="h-8 font-mono"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(["r", "g", "b"] as const).map((channel) => (
            <div
              key={channel}
              className="grid gap-1.5"
            >
              <label
                htmlFor={`${fieldsId}-${channel}`}
                className="text-muted-foreground text-xs font-medium"
              >
                {channel.toUpperCase()}
              </label>
              <Input
                id={`${fieldsId}-${channel}`}
                type="number"
                min={0}
                max={255}
                value={rgbInput[channel]}
                onChange={(event) => handleRgbChange(channel, event)}
                onBlur={handleRgbBlur}
                placeholder="0"
                disabled={disabled}
                className="h-8 px-2 font-mono"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs">
            Use a preset, hex, or RGB values.
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled === true || !normalizedValue}
            onClick={handleClear}
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
