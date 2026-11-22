"use client";

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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, type RouterOutputs } from "@/trpc/react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

type RoleGroup = RouterOutputs["discordRoles"]["listGroups"][number];

const ROLE_ID_PATTERN = /^\d{17,20}$/;
const MAX_GROUP_NAME_LENGTH = 64;

interface DiscordRoleGroupsProps {
  onChanged?: () => void;
}

export function DiscordRoleGroups({ onChanged }: DiscordRoleGroupsProps) {
  const t = useTranslations("admin.discordRoles");
  const groupsQuery = api.discordRoles.listGroups.useQuery();

  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<RoleGroup | null>(null);

  const resetForm = () => {
    setName("");
    setRoleId("");
    setEditingId(null);
  };

  const handleMutationSuccess = () => {
    void groupsQuery.refetch();
    onChanged?.();
  };

  const createMutation = api.discordRoles.createGroup.useMutation({
    onSuccess: () => {
      resetForm();
      handleMutationSuccess();
      toast.success(t("role_groups.toast.created"));
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = api.discordRoles.updateGroup.useMutation({
    onSuccess: () => {
      resetForm();
      handleMutationSuccess();
      toast.success(t("role_groups.toast.updated"));
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = api.discordRoles.deleteGroup.useMutation({
    onSuccess: () => {
      setDeletingGroup(null);
      handleMutationSuccess();
      toast.success(t("role_groups.toast.deleted"));
    },
    onError: (error) => toast.error(error.message),
  });

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedRoleId = roleId.trim();

    if (
      trimmedName.length === 0 ||
      trimmedName.length > MAX_GROUP_NAME_LENGTH ||
      !ROLE_ID_PATTERN.test(trimmedRoleId)
    ) {
      toast.error(t("role_groups.invalid"));
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: { name: trimmedName, roleId: trimmedRoleId },
      });
    } else {
      createMutation.mutate({ name: trimmedName, roleId: trimmedRoleId });
    }
  };

  const handleEdit = (group: RoleGroup) => {
    setEditingId(group.id);
    setName(group.name);
    setRoleId(group.roleId);
  };

  const groups = groupsQuery.data ?? [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("role_groups.title")}</CardTitle>
          <CardDescription>{t("role_groups.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("role_groups.name_placeholder")}
              maxLength={MAX_GROUP_NAME_LENGTH}
              className="sm:max-w-xs"
              disabled={isPending}
            />
            <Input
              value={roleId}
              onChange={(event) => setRoleId(event.target.value)}
              placeholder={t("role_groups.role_id_placeholder")}
              inputMode="numeric"
              className="font-mono sm:max-w-xs"
              disabled={isPending}
            />
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingId ? (
                <Check className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingId ? t("role_groups.save") : t("role_groups.add")}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isPending}
              >
                <X className="h-4 w-4" />
                {t("role_groups.cancel")}
              </Button>
            )}
          </form>

          <p className="text-muted-foreground text-xs">
            {t("role_groups.hint")}
          </p>

          {groupsQuery.isLoading && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("role_groups.loading")}
            </div>
          )}

          {!groupsQuery.isLoading && groups.length === 0 && (
            <p className="text-muted-foreground text-sm">
              {t("role_groups.empty")}
            </p>
          )}

          {groups.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("role_groups.group_name")}</TableHead>
                  <TableHead>{t("role_groups.role_id")}</TableHead>
                  <TableHead className="w-[100px] text-right">
                    {t("role_groups.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>
                      <code className="text-xs">{group.roleId}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(group)}
                          disabled={isPending}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">
                            {t("role_groups.edit")}
                          </span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingGroup(group)}
                          disabled={isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">
                            {t("role_groups.delete")}
                          </span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deletingGroup}
        onOpenChange={(open) => {
          if (!open) setDeletingGroup(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("role_groups.delete_dialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("role_groups.delete_dialog.description", {
                name: deletingGroup?.name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {t("role_groups.delete_dialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (deletingGroup) {
                  deleteMutation.mutate({ id: deletingGroup.id });
                }
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending
                ? t("role_groups.delete_dialog.deleting")
                : t("role_groups.delete_dialog.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
