"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorToast } from "@/components/ui/error-toast-content";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import type { Role } from "@prisma/client";
import { Plus, Shield, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface CurrentRole {
  id: string;
  expiresAt: Date | null;
  role: { id: string; name: string; type: string };
}

interface ProfileRolesSectionProps {
  userId: string;
  currentUserId: string;
  currentRoles: CurrentRole[];
  availableRoles: Role[];
  isAdmin: boolean;
}

export function ProfileRolesSection({
  userId,
  currentUserId,
  currentRoles,
  availableRoles,
  isAdmin,
}: ProfileRolesSectionProps) {
  const t = useTranslations("profile.roles");
  const router = useRouter();
  const now = new Date();
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  const assignedRoleIds = new Set(currentRoles.map((r) => r.role.id));
  const unassignedRoles = availableRoles.filter(
    (r) => !assignedRoleIds.has(r.id),
  );

  const { mutate: assignRole, isPending: isAssigning } =
    api.roles.assignRole.useMutation({
      onSuccess: () => {
        toast.success(t("assign_success"));
        setSelectedRoleId("");
        router.refresh();
      },
      onError: (err) => toast.error(<ErrorToast message={err.message} />),
    });

  const { mutate: removeRole, isPending: isRemoving } =
    api.roles.removeRole.useMutation({
      onSuccess: () => {
        toast.success(t("remove_success"));
        router.refresh();
      },
      onError: (err) => toast.error(<ErrorToast message={err.message} />),
    });

  const handleAssign = () => {
    if (!selectedRoleId) return;
    assignRole({ userId, roleId: selectedRoleId });
  };

  const isOwnProfile = userId === currentUserId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentRoles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {currentRoles.map((ur) => {
              const expired = ur.expiresAt != null && ur.expiresAt < now;
              const isSelfAdminRole = isOwnProfile && ur.role.type === "ADMIN";
              const canRemove = isAdmin && !isSelfAdminRole;

              return (
                <Badge
                  key={ur.id}
                  variant={expired ? "secondary" : "default"}
                  className="flex items-center gap-1 text-sm"
                >
                  {ur.role.name}
                  {expired && (
                    <span className="opacity-60">({t("expired")})</span>
                  )}
                  {canRemove && (
                    <ConfirmDialog
                      trigger={
                        <button
                          disabled={isRemoving}
                          className="ml-1 rounded hover:opacity-70"
                          aria-label={t("remove_role")}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      }
                      title={t("remove_confirm_title")}
                      description={t("remove_confirm_description", {
                        role: ur.role.name,
                      })}
                      cancelLabel={t("remove_cancel")}
                      confirmLabel={t("remove_confirm")}
                      onConfirm={() =>
                        removeRole({ userId, roleId: ur.role.id })
                      }
                    />
                  )}
                </Badge>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t("none")}</p>
        )}

        {isAdmin && unassignedRoles.length > 0 && (
          <div className="flex items-center gap-2">
            <Select
              value={selectedRoleId}
              onValueChange={setSelectedRoleId}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("add_role_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {unassignedRoles.map((role) => (
                  <SelectItem
                    key={role.id}
                    value={role.id}
                  >
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleAssign}
              disabled={!selectedRoleId || isAssigning}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              {t("add_role")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
