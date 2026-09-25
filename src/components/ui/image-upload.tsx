"use client";

import { Button } from "@/components/ui/button";
import { uploadFile } from "@/lib/storage/upload-client";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface ImageUploadProps {
  value?: string | null; // value = the storage key of the uploaded image
  onChange: (value: string | null) => void;
  path: string; // Destination folder prefix inside the bucket, e.g. "tournaments/foo/banners".
  previewUrl?: string | null; // Preview URL for an already-saved image.
  disabled?: boolean;
  className?: string;
}

/**
 * Upload a single image to the shared storage bucket.
 */
export function ImageUpload({
  value,
  onChange,
  path,
  previewUrl,
  disabled,
  className,
}: ImageUploadProps) {
  const t = useTranslations("image_upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Revoke the object URL when it is replaced or on unmount to avoid leaks.
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const preview = localPreview ?? (value ? (previewUrl ?? null) : null);
  const isBusy = uploading || disabled;

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const result = await uploadFile({ file, path });
      setLocalPreview(URL.createObjectURL(file));
      onChange(result.key);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setLocalPreview(null);
    setError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="bg-muted/40 relative flex aspect-video w-full max-w-sm items-center justify-center overflow-hidden rounded-lg border border-dashed">
        {preview ? (
          <Image
            src={preview}
            alt=""
            fill
            sizes="384px"
            unoptimized={preview.startsWith("blob:")}
            className="object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex flex-col items-center gap-1 text-sm">
            <ImagePlus className="h-6 w-6" />
            <span>{t("empty")}</span>
          </div>
        )}
        {uploading && (
          <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleFile(file);
          }
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          {uploading ? t("uploading") : value ? t("replace") : t("upload")}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={handleRemove}
          >
            <X className="mr-2 h-4 w-4" />
            {t("remove")}
          </Button>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
