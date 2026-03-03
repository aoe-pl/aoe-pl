"use client";

import dynamic from "next/dynamic";
import {
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface MarkdownEditorFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  height?: number;
}

export function MarkdownEditorField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  height = 250,
}: MarkdownEditorFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <div
              data-color-mode="dark"
              className="[&_.w-md-editor]:!bg-background [&_.w-md-editor]:!border-border [&_.w-md-editor-toolbar]:!bg-background/50 [&_.wmde-markdown]:!bg-background [&_.w-md-editor-text]:!bg-background [&_.w-md-editor-text-pre]:!bg-background"
            >
              <MDEditor
                value={(field.value as string) ?? ""}
                onChange={(val) => field.onChange(val ?? "")}
                preview="edit"
                height={height}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
