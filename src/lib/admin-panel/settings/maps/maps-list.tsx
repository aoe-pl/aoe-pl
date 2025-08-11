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
import { MapForm, type MapFormSchema } from "./map-form";
import type { Map, BaseMap } from "@prisma/client";

type MapWithBaseMap = Map & { baseMap: BaseMap };

export function MapsList() {
  const t = useTranslations("admin.settings.maps");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingMap, setEditingMap] = useState<MapWithBaseMap | undefined>();
  const [deletingMap, setDeletingMap] = useState<MapWithBaseMap | undefined>();

  const { data: maps, refetch, isLoading } = api.maps.list.useQuery();

  const { mutate: createMap, isPending: creationPending } =
    api.maps.create.useMutation({
      onSuccess: () => {
        void refetch();
        setIsDrawerOpen(false);
        toast.success(t("toast.create_success"));
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const { mutate: updateMap, isPending: updatePending } =
    api.maps.update.useMutation({
      onSuccess: () => {
        void refetch();
        setIsDrawerOpen(false);
        setEditingMap(undefined);
        toast.success(t("toast.update_success"));
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const { mutate: deleteMap, isPending: deletionPending } =
    api.maps.delete.useMutation({
      onSuccess: () => {
        void refetch();
        setDeletingMap(undefined);
        toast.success(t("toast.delete_success"));
      },
      onError: (error) => {
        let errorMessage = error.message;
        // Handle structured errors from server
        if (error.message.startsWith("MAP_IN_USE:")) {
          const count = parseInt(error.message.split(":")[1] ?? "0", 10);
          errorMessage = t("errors.MAP_IN_USE", { count });
        }
        toast.error(<ErrorToast message={errorMessage} />);
      },
    });

  const handleEdit = (map: MapWithBaseMap) => {
    setEditingMap(map);
    setIsDrawerOpen(true);
  };

  const handleDelete = (map: MapWithBaseMap) => {
    setDeletingMap(map);
  };

  const handleAdd = () => {
    setEditingMap(undefined);
    setIsDrawerOpen(true);
  };

  const handleSubmit = (data: MapFormSchema) => {
    if (editingMap) {
      updateMap({
        id: editingMap.id,
        data,
      });
    } else {
      createMap(data);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingMap) {
      deleteMap({ id: deletingMap.id });
    }
  };

  const handleCancel = () => {
    setIsDrawerOpen(false);
    setEditingMap(undefined);
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
              {t("add_map")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!maps || maps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-4">{t("no_maps")}</p>
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                {t("add_first_map")}
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <ScrollArea className="w-full">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">
                        {t("table.name")}
                      </TableHead>
                      <TableHead className="w-[150px]">
                        {t("table.base_map")}
                      </TableHead>
                      <TableHead className="min-w-[250px]">
                        {t("table.description")}
                      </TableHead>
                      <TableHead className="w-[120px]">
                        {t("table.thumbnail")}
                      </TableHead>
                      <TableHead className="w-[100px] text-right">
                        {t("table.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maps.map((map) => (
                      <TableRow key={map.id}>
                        <TableCell className="font-medium">
                          {map.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{map.baseMap.name}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {map.description ?? "-"}
                        </TableCell>
                        <TableCell>
                          {map.thumbnailUrl ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={map.thumbnailUrl}
                                alt={map.name}
                                className="h-8 w-8 rounded object-cover"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                asChild
                              >
                                <a
                                  href={map.thumbnailUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          ) : (
                            <Badge variant="secondary">
                              {t("no_thumbnail")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(map)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(map)}
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

      <Drawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingMap ? t("edit_map") : t("add_map")}
            </DrawerTitle>
            <DrawerDescription>
              {editingMap
                ? t("edit_map_description")
                : t("add_map_description")}
            </DrawerDescription>
          </DrawerHeader>
          <MapForm
            initialData={editingMap}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isPending={creationPending || updatePending}
          />
        </DrawerContent>
      </Drawer>

      <AlertDialog
        open={!!deletingMap}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingMap(undefined);
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
