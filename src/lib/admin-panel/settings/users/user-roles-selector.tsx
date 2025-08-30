"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Calendar } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { ErrorToast } from "@/components/ui/error-toast-content";
import type { Role, UserRole } from "@prisma/client";

type UserRoleWithRole = UserRole & { role: Role };

interface UserRolesSelectorProps {
  userId: string;
}

export function UserRolesSelector({ userId }: UserRolesSelectorProps) {
  const t = useTranslations("admin.settings.users.roles");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [comment, setComment] = useState("");

  // Queries
  const { data: allRoles, isLoading: rolesLoading } = api.roles.list.useQuery();
  const { 
    data: userRoles, 
    refetch: refetchUserRoles, 
    isLoading: userRolesLoading 
  } = api.roles.getUserRoles.useQuery({ userId });

  // Mutations
  const { mutate: assignRole, isPending: assignPending } = api.roles.assignRole.useMutation({
    onSuccess: () => {
      void refetchUserRoles();
      setIsDialogOpen(false);
      setSelectedRoleId("");
      setExpiresAt("");
      setComment("");
      toast.success(t("toast.assign_success"));
    },
    onError: (error) => {
      toast.error(<ErrorToast message={error.message} />);
    },
  });

  const { mutate: removeRole, isPending: removePending } = api.roles.removeRole.useMutation({
    onSuccess: () => {
      void refetchUserRoles();
      toast.success(t("toast.remove_success"));
    },
    onError: (error) => {
      toast.error(<ErrorToast message={error.message} />);
    },
  });

  const handleAssignRole = () => {
    if (!selectedRoleId) return;

    assignRole({
      userId,
      roleId: selectedRoleId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      comment: comment ?? undefined,
    });
  };

  const handleRemoveRole = (roleId: string) => {
    removeRole({ userId, roleId });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  // Get available roles (not already assigned)
  const assignedRoleIds = userRoles?.map(ur => ur.roleId) ?? [];
  const availableRoles = allRoles?.filter(role => !assignedRoleIds.includes(role.id)) ?? [];

  if (rolesLoading || userRolesLoading) {
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
            {availableRoles.length > 0 && (
              <Button onClick={() => setIsDialogOpen(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t("assign_role")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!userRoles || userRoles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-4">
                {t("no_roles")}
              </p>
              {availableRoles.length > 0 && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("assign_first_role")}
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.role_name")}</TableHead>
                    <TableHead>{t("table.type")}</TableHead>
                    <TableHead>{t("table.assigned_at")}</TableHead>
                    <TableHead>{t("table.expires_at")}</TableHead>
                    <TableHead>{t("table.comment")}</TableHead>
                    <TableHead className="w-[100px] text-right">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRoles.map((userRole: UserRoleWithRole) => (
                    <TableRow key={userRole.id}>
                      <TableCell className="font-medium">
                        {userRole.role.name}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={userRole.role.type === "ADMIN" ? "default" : "secondary"}
                        >
                          {userRole.role.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(userRole.assignedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {userRole.expiresAt ? (
                            <>
                              <Calendar className="h-3 w-3" />
                              {formatDate(userRole.expiresAt)}
                            </>
                          ) : (
                            <span className="text-muted-foreground">{t("never_expires")}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {userRole.comment ?? "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRole(userRole.roleId)}
                            disabled={removePending}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("assign_dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("assign_dialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("assign_dialog.role")}</label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("assign_dialog.select_role")} />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <span>{role.name}</span>
                        <Badge 
                          variant={role.type === "ADMIN" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {role.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">{t("assign_dialog.expires_at")}</label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("assign_dialog.expires_help")}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">{t("assign_dialog.comment")}</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("assign_dialog.comment_placeholder")}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={assignPending}
            >
              {t("assign_dialog.cancel")}
            </Button>
            <Button
              onClick={handleAssignRole}
              disabled={!selectedRoleId || assignPending}
            >
              {assignPending ? t("assign_dialog.assigning") : t("assign_dialog.assign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}