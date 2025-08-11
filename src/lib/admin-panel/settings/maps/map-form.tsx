"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Map, BaseMap } from "@prisma/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DrawerFooter } from "@/components/ui/drawer";
import { api } from "@/trpc/react";

const mapFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  baseMapId: z.string().min(1, "Base map is required"),
});

export type MapFormSchema = z.infer<typeof mapFormSchema>;

interface MapFormProps {
  initialData?: Map & { baseMap: BaseMap };
  onSubmit: (data: MapFormSchema) => void;
  onCancel: () => void;
  isPending: boolean;
}

export function MapForm({
  initialData,
  onSubmit,
  onCancel,
  isPending,
}: MapFormProps) {
  const t = useTranslations("admin.settings.maps.form");
  
  const { data: baseMaps, isLoading: baseMapLoading } = api.baseMaps.list.useQuery();

  const form = useForm<MapFormSchema>({
    resolver: zodResolver(mapFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      thumbnailUrl: initialData?.thumbnailUrl ?? "",
      baseMapId: initialData?.baseMapId ?? "",
    },
  });

  const handleSubmit = (data: MapFormSchema) => {
    onSubmit(data);
  };

  return (
    <ScrollArea className="h-[60vh] px-4">
      <div className="space-y-6 p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("name_placeholder")} {...field} />
                  </FormControl>
                  <FormDescription>{t("name_help")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="baseMapId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("base_map")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={baseMapLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("base_map_placeholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {baseMaps?.map((baseMap) => (
                        <SelectItem key={baseMap.id} value={baseMap.id}>
                          {baseMap.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>{t("base_map_help")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("description_placeholder")}
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("description_help")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("thumbnail_url")}</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder={t("thumbnail_url_placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("thumbnail_url_help")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DrawerFooter className="flex-row justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? initialData
                    ? t("updating")
                    : t("creating")
                  : initialData
                    ? t("update")
                    : t("create")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
            </DrawerFooter>
          </form>
        </Form>
      </div>
    </ScrollArea>
  );
}