"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpoilerProtectionProps {
  children: React.ReactNode;
  isSpoiler: boolean;
  className?: string;
}

export function SpoilerProtection({
  children,
  isSpoiler,
  className,
}: SpoilerProtectionProps) {
  const [showSpoiler, setShowSpoiler] = useState(false);

  if (!isSpoiler) {
    return <span className={className}>{children}</span>;
  }

  return (
    <div className="inline-flex items-center gap-1">
      <span
        className={cn(
          "transition-all duration-200",
          showSpoiler ? "blur-none" : "blur-sm select-none",
          className,
        )}
      >
        {children}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowSpoiler(!showSpoiler)}
        className="ml-1 h-6 w-6 p-0"
      >
        {showSpoiler ? (
          <EyeOff className="h-3 w-3" />
        ) : (
          <Eye className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

interface SpoilerTextProps {
  text: string;
  isSpoiler: boolean;
  fallbackText?: string;
  className?: string;
}

export function SpoilerText({
  text,
  isSpoiler,
  fallbackText = "•••",
  className,
}: SpoilerTextProps) {
  const [showSpoiler, setShowSpoiler] = useState(false);

  if (!isSpoiler) {
    return <span className={className}>{text}</span>;
  }

  return (
    <div className="inline-flex items-center gap-1">
      <span
        className={cn(
          "transition-all duration-200",
          showSpoiler ? "blur-none" : "blur-sm select-none",
          className,
        )}
      >
        {showSpoiler ? text : fallbackText}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowSpoiler(!showSpoiler)}
        className="ml-1 h-6 w-6 p-0"
      >
        {showSpoiler ? (
          <EyeOff className="h-3 w-3" />
        ) : (
          <Eye className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
