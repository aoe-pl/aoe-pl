"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BaseMapForm,
  type BaseMapFormSchema,
} from "./base-map-form";
import type { BaseMap } from "@prisma/client";

export function BaseMapsList() {
  const t = useTranslations("admin.settings.base_maps");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBaseMap, setEditingBaseMap] = useState<BaseMap | undefined>();
  const [deletingBaseMap, setDeletingBaseMap] = useState<BaseMap | undefined>();

  const { data: baseMaps, refetch, isLoading } = api.baseMaps.list.useQuery();

  const { mutate: createBaseMap, isPending: creationPending } =
    api.baseMaps.create.useMutation({
      onSuccess: () => {
        void refetch();
        setIsDrawerOpen(false);
        toast.success(t("toast.create_success"));
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const { mutate: updateBaseMap, isPending: updatePending } =
    api.baseMaps.update.useMutation({
      onSuccess: () => {
        void refetch();
        setIsDrawerOpen(false);
        setEditingBaseMap(undefined);
        toast.success(t("toast.update_success"));
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const { mutate: deleteBaseMap, isPending: deletionPending } =
    api.baseMaps.delete.useMutation({
      onSuccess: () => {
        void refetch();
        setDeletingBaseMap(undefined);
        toast.success(t("toast.delete_success"));
      },
      onError: (error) => {
        let errorMessage = error.message;
        // Handle structured errors from server
        if (error.message.startsWith("BASE_MAP_IN_USE:")) {
          const count = parseInt(error.message.split(":")[1] ?? "0", 10);
          errorMessage = t("errors.BASE_MAP_IN_USE", { count });
        }
        toast.error(<ErrorToast message={errorMessage} />);
      },
    });

  const handleEdit = (baseMap: BaseMap) => {
    setEditingBaseMap(baseMap);
    setIsDrawerOpen(true);
  };

  const handleDelete = (baseMap: BaseMap) => {
    setDeletingBaseMap(baseMap);
  };

  const handleAdd = () => {
    setEditingBaseMap(undefined);
    setIsDrawerOpen(true);
  };

  const handleSubmit = (data: BaseMapFormSchema) => {
    if (editingBaseMap) {
      updateBaseMap({
        id: editingBaseMap.id,
        data,
      });
    } else {
      createBaseMap(data);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingBaseMap) {
      deleteBaseMap({ id: deletingBaseMap.id });
    }
  };

  const handleCancel = () => {
    setIsDrawerOpen(false);
    setEditingBaseMap(undefined);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{t("loading")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>{t("title")}</CardTitle>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              {t("add_base_map")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!baseMaps || baseMaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-4">{t("no_base_maps")}</p>
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                {t("add_first_base_map")}
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <ScrollArea className="w-full">
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">{t("table.name")}</TableHead>
                      <TableHead className="min-w-[300px]">{t("table.description")}</TableHead>
                      <TableHead className="w-[120px]">{t("table.thumbnail")}</TableHead>
                      <TableHead className="w-[100px] text-right">
                        {t("table.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {baseMaps.map((baseMap) => (
                      <TableRow key={baseMap.id}>
                        <TableCell className="font-medium">{baseMap.name}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {baseMap.description ?? "-"}
                        </TableCell>
                        <TableCell>
                          {baseMap.thumbnailUrl ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={baseMap.thumbnailUrl}
                                alt={baseMap.name}
                                className="h-8 w-8 rounded object-cover"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                asChild
                              >
                                <a
                                  href={baseMap.thumbnailUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          ) : (
                            <Badge variant="secondary">{t("no_thumbnail")}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(baseMap)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(baseMap)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingBaseMap ? t("edit_base_map") : t("add_base_map")}
            </DrawerTitle>
            <DrawerDescription>
              {editingBaseMap
                ? t("edit_base_map_description")
                : t("add_base_map_description")}
            </DrawerDescription>
          </DrawerHeader>
          <BaseMapForm
            initialData={editingBaseMap}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isPending={creationPending || updatePending}
          />
        </DrawerContent>
      </Drawer>

      <AlertDialog
        open={!!deletingBaseMap}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingBaseMap(undefined);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_dialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete_dialog.description")}
              <br />
              <br />
              {t("delete_dialog.warning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("delete_dialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deletionPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletionPending
                ? t("delete_dialog.deleting")
                : t("delete_dialog.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}