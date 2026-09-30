import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface RoleBadgeItem {
  id: string;
  expiresAt: Date | null;
  role: { id: string; name: string; type: string };
}

interface ProfileRoleBadgesProps {
  roles: RoleBadgeItem[];
}

/**
 * Read-only list of a player's role labels (e.g. "Admin") shown beneath
 * their name in the profile header.
 */
export function ProfileRoleBadges({ roles }: ProfileRoleBadgesProps) {
  const t = useTranslations("profile.roles");

  if (roles.length === 0) return null;

  const now = new Date();

  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((userRole) => {
        const expired = userRole.expiresAt != null && userRole.expiresAt < now;

        return (
          <Badge
            key={userRole.id}
            variant={expired ? "secondary" : "default"}
            className="text-xs"
          >
            {userRole.role.name}
            {expired && <span className="opacity-60">({t("expired")})</span>}
          </Badge>
        );
      })}
    </div>
  );
}
