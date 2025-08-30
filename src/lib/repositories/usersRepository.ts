import { db } from "@/server/db";

export const usersRepository = {
  async getUsers() {
    return db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        color: true,
        adminComment: true,
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
          take: 3, // Only show first 3 roles in list
        },
        _count: {
          select: {
            userRoles: true,
            TournamentParticipant: true,
            userStreams: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  },

  async getUserById(id: string) {
    return db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  },

  async getUserWithDetails(id: string) {
    return db.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        userStreams: {
          include: {
            platform: true,
          },
        },
        TournamentParticipant: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
          orderBy: {
            registrationDate: "desc",
          },
          take: 10,
        },
        _count: {
          select: {
            TournamentParticipant: true,
            userRoles: true,
            userStreams: true,
          },
        },
      },
    });
  },

  async updateUser(id: string, data: {
    name?: string;
    email?: string;
    color?: string;
    adminComment?: string;
    roleIds?: string[];
  }, currentUserId?: string) {
    // Handle roles update separately if provided
    if (data.roleIds !== undefined) {
      return db.$transaction(async (tx) => {
        // Update user basic info
        const updatedUser = await tx.user.update({
          where: { id },
          data: {
            name: data.name,
            email: data.email,
            color: data.color,
            adminComment: data.adminComment,
          },
        });

        // Get current roles
        const currentRoles = await tx.userRole.findMany({
          where: { userId: id },
          select: { roleId: true },
        });
        const currentRoleIds = currentRoles.map(ur => ur.roleId);

        // Calculate roles to add and remove
        const newRoleIds = data.roleIds ?? [];
        const rolesToAdd = newRoleIds.filter(roleId => !currentRoleIds.includes(roleId));
        const rolesToRemove = currentRoleIds.filter(roleId => !newRoleIds.includes(roleId));

        // If currentUserId is provided, validate permissions for role changes
        if (currentUserId && (rolesToAdd.length > 0 || rolesToRemove.length > 0)) {
          // Check if current user is admin
          const currentUserRoles = await tx.userRole.findMany({
            where: { userId: currentUserId },
            include: { role: true },
          });
          const hasAdminRole = currentUserRoles.some(ur => ur.role.type === "ADMIN");
          
          if (!hasAdminRole) {
            // For non-admin users, check if all roles being added/removed are modAssignable
            const affectedRoleIds = [...rolesToAdd, ...rolesToRemove];
            const affectedRoles = await tx.role.findMany({
              where: { id: { in: affectedRoleIds } },
            });
            
            const nonModAssignableRoles = affectedRoles.filter(role => !role.modAssignable);
            if (nonModAssignableRoles.length > 0) {
              throw new Error(
                `You don't have permission to modify these roles: ${nonModAssignableRoles.map(r => r.name).join(', ')}`
              );
            }
          }
        }

        // Remove roles
        if (rolesToRemove.length > 0) {
          await tx.userRole.deleteMany({
            where: {
              userId: id,
              roleId: { in: rolesToRemove },
            },
          });
        }

        // Add new roles
        if (rolesToAdd.length > 0) {
          await tx.userRole.createMany({
            data: rolesToAdd.map(roleId => ({
              userId: id,
              roleId,
            })),
          });
        }

        return updatedUser;
      });
    }

    // Regular update without roles
    return db.user.update({
      where: { id },
      data,
    });
  },

  async deleteUser(id: string) {
    // Check if user has any tournament participations
    const participationCount = await db.tournamentParticipant.count({
      where: { userId: id },
    });

    if (participationCount > 0) {
      throw new Error(
        `Cannot delete user. They have participated in ${participationCount} tournament(s).`,
      );
    }

    return db.user.delete({
      where: { id },
    });
  },

  async getUserUsageCount(id: string) {
    const counts = await db.user.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            TournamentParticipant: true,
            userRoles: true,
            userStreams: true,
          },
        },
      },
    });

    return (
      (counts?._count.TournamentParticipant ?? 0) +
      (counts?._count.userRoles ?? 0) +
      (counts?._count.userStreams ?? 0)
    );
  },

  async isUserAdmin(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        userRoles: {
          select: {
            role: true,
          },
        },
      },
    });

    return user?.userRoles.some((ur) => ur.role.type === "ADMIN") ?? false;
  },
};
