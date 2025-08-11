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
  CivilizationForm,
  type CivilizationFormSchema,
} from "./civilization-form";
import type { Civ } from "@prisma/client";

export function CivilizationsList() {
  const t = useTranslations("admin.settings.civilizations");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCiv, setEditingCiv] = useState<Civ | undefined>();
  const [deletingCiv, setDeletingCiv] = useState<Civ | undefined>();

  const { data: civilizations, refetch, isLoading } = api.civs.list.useQuery();

  const { mutate: createCivilization, isPending: creationPending } =
    api.civs.create.useMutation({
      onSuccess: () => {
        void refetch();
        setIsDrawerOpen(false);
        toast.success(t("toast.create_success"));
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const { mutate: updateCivilization, isPending: updatePending } =
    api.civs.update.useMutation({
      onSuccess: () => {
        void refetch();
        setIsDrawerOpen(false);
        setEditingCiv(undefined);
        toast.success(t("toast.update_success"));
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const { mutate: deleteCivilization, isPending: deletionPending } =
    api.civs.delete.useMutation({
      onSuccess: () => {
        void refetch();
        setDeletingCiv(undefined);
        toast.success(t("toast.delete_success"));
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const handleEdit = (civ: Civ) => {
    setEditingCiv(civ);
    setIsDrawerOpen(true);
  };

  const handleDelete = (civ: Civ) => {
    setDeletingCiv(civ);
  };

  const handleAdd = () => {
    setEditingCiv(undefined);
    setIsDrawerOpen(true);
  };

  const handleSubmit = (data: CivilizationFormSchema) => {
    if (editingCiv) {
      updateCivilization({
        id: editingCiv.id,
        data,
      });
    } else {
      createCivilization(data);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingCiv) {
      deleteCivilization({ id: deletingCiv.id });
    }
  };

  const handleCancel = () => {
    setIsDrawerOpen(false);
    setEditingCiv(undefined);
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
              {t("add_civilization")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!civilizations || civilizations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-4">
                {t("no_civilizations")}
              </p>
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                {t("add_first_civilization")}
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <ScrollArea className="w-full">
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">
                        {t("table.name")}
                      </TableHead>
                      <TableHead className="min-w-[300px]">
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
                    {civilizations.map((civ) => (
                      <TableRow key={civ.id}>
                        <TableCell className="font-medium">
                          {civ.name}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {civ.description}
                        </TableCell>
                        <TableCell>
                          {civ.thumbnailUrl ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={civ.thumbnailUrl}
                                alt={civ.name}
                                className="h-8 w-8 rounded object-cover"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                asChild
                              >
                                <a
                                  href={civ.thumbnailUrl}
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
                              onClick={() => handleEdit(civ)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(civ)}
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
              {editingCiv ? t("edit_civilization") : t("add_civilization")}
            </DrawerTitle>
            <DrawerDescription>
              {editingCiv
                ? t("edit_civilization_description")
                : t("add_civilization_description")}
            </DrawerDescription>
          </DrawerHeader>
          <CivilizationForm
            initialData={editingCiv}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isPending={creationPending || updatePending}
          />
        </DrawerContent>
      </Drawer>

      <AlertDialog
        open={!!deletingCiv}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCiv(undefined);
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
