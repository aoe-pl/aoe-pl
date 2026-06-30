"use client";

import { cn } from "@/lib/utils";
import { UploadCloudIcon } from "lucide-react";
import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

interface DropZoneProps {
  onFiles: (files: File[]) => void | Promise<void>;
  existingCount: number;
}

/**
 * Drop zone for files. Supports drag-and-drop and click-to-select.
 */
export function DropZone({ onFiles, existingCount }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);

      if (files.length) await onFiles(files);
    },
    [onFiles],
  );

  const handleChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);

      if (files.length) await onFiles(files);

      e.target.value = "";
    },
    [onFiles],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Drop recordings here or click to select"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors select-none",
        dragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-accent/30",
      )}
    >
      <UploadCloudIcon className="text-muted-foreground size-8" />
      <p className="text-muted-foreground text-sm">
        Drag &amp; drop <code>.aoe2record</code> file(s) here, or{" "}
        <span className="text-primary underline">click to select</span>
      </p>
      {existingCount > 0 && (
        <p className="text-muted-foreground text-xs">
          {existingCount} file{existingCount > 1 ? "s" : ""} added — add more if
          the game was restored
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".aoe2record"
        multiple
        className="sr-only"
        onChange={handleChange}
        tabIndex={-1}
      />
    </div>
  );
}
