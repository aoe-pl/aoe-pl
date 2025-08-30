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
import { 
  Edit, 
  Trash2, 
  Eye
} from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UserForm,
  type UserFormSchema,
} from "./user-form";
import { UserDetailView } from "./user-detail-view";
import type { User } from "@prisma/client";

type UserWithCounts = {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  color: string | null;
  adminComment: string | null;
  userRoles: Array<{
    role: {
      id: string;
      name: string;
      type: string;
    };
  }>;
  _count: {
    userRoles: number;
    TournamentParticipant: number;
    userStreams: number;
  };
};

export function UsersList() {
  const t = useTranslations("admin.settings.users");
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [viewingUser, setViewingUser] = useState<string | undefined>();
  const [deletingUser, setDeletingUser] = useState<User | undefined>();

  const utils = api.useUtils();
  const { data: users, refetch, isLoading } = api.users.list.useQuery();

  const { data: userDetails } = api.users.getWithDetails.useQuery(
    { id: viewingUser! },
    { 
      enabled: !!viewingUser,
      refetchOnWindowFocus: false,
    }
  );

  const { mutate: updateUser, isPending: updatePending } =
    api.users.update.useMutation({
      onSuccess: () => {
        void refetch();
        // Also invalidate the roles queries to refresh the form
        void utils.roles.getUserRoles.invalidate();
        void utils.users.getWithDetails.invalidate();
        setIsEditDrawerOpen(false);
        setEditingUser(undefined);
        toast.success(t("toast.update_success"));
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const { mutate: deleteUser, isPending: deletionPending } =
    api.users.delete.useMutation({
      onSuccess: () => {
        void refetch();
        setDeletingUser(undefined);
        toast.success(t("toast.delete_success"));
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditDrawerOpen(true);
  };

  const handleView = (userId: string) => {
    setViewingUser(userId);
    setIsDetailDrawerOpen(true);
  };

  const handleDelete = (user: User) => {
    setDeletingUser(user);
  };

  const handleSubmit = (data: UserFormSchema) => {
    if (editingUser) {
      updateUser({
        id: editingUser.id,
        data,
      });
    }
  };

  const handleConfirmDelete = () => {
    if (deletingUser) {
      deleteUser({ id: deletingUser.id });
    }
  };

  const handleEditCancel = () => {
    setIsEditDrawerOpen(false);
    setEditingUser(undefined);
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
          </div>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-4">
                {t("no_users")}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <ScrollArea className="w-full">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">
                        {t("table.name")}
                      </TableHead>
                      <TableHead className="w-[250px]">
                        {t("table.email")}
                      </TableHead>
                      <TableHead className="w-[100px] text-center">
                        {t("table.roles")}
                      </TableHead>
                      <TableHead className="w-[100px] text-center">
                        {t("table.tournaments")}
                      </TableHead>
                      <TableHead className="w-[100px] text-center">
                        {t("table.streams")}
                      </TableHead>
                      <TableHead className="w-[150px] text-right">
                        {t("table.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: UserWithCounts) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {user.color && (
                              <div 
                                className="h-3 w-3 rounded-full border"
                                style={{ backgroundColor: user.color }}
                              />
                            )}
                            {user.name ?? "No Name"}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {user.email ?? "No Email"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {user.userRoles.length > 0 ? (
                              <>
                                {user.userRoles.map((userRole) => (
                                  <Badge
                                    key={userRole.role.id}
                                    variant={userRole.role.type === "ADMIN" ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {userRole.role.name}
                                  </Badge>
                                ))}
                                {user._count.userRoles > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{user._count.userRoles - 3}
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-xs">
                            {user._count.TournamentParticipant}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-xs">
                            {user._count.userStreams}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(user.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user)}
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

      {/* Edit User Drawer */}
      <Drawer
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {t("edit_user")}
            </DrawerTitle>
            <DrawerDescription>
              {t("edit_user_description")}
            </DrawerDescription>
          </DrawerHeader>
          <UserForm
            initialData={editingUser}
            onSubmit={handleSubmit}
            onCancel={handleEditCancel}
            isPending={updatePending}
          />
        </DrawerContent>
      </Drawer>

      {/* User Detail Drawer */}
      <Drawer
        open={isDetailDrawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDetailDrawerOpen(false);
            setViewingUser(undefined);
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {t("user_details")}
            </DrawerTitle>
            <DrawerDescription>
              {userDetails?.name ?? userDetails?.email ?? t("user_details_description")}
            </DrawerDescription>
          </DrawerHeader>
          {userDetails && <UserDetailView user={userDetails} />}
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingUser}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingUser(undefined);
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