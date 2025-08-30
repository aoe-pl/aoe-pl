import { db } from "@/server/db";

export const rolesRepository = {
  async getAllRoles() {
    return db.role.findMany({
      orderBy: { name: "asc" },
    });
  },

  async getRoleById(id: string) {
    return db.role.findUnique({
      where: { id },
    });
  },

  async getUserRoles(userId: string) {
    return db.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
      orderBy: {
        assignedAt: "desc",
      },
    });
  },

  async assignRoleToUser(
    userId: string,
    roleId: string,
    expiresAt?: Date,
    comment?: string,
  ) {
    // Check if role is already assigned
    const existingAssignment = await db.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existingAssignment) {
      throw new Error("Role is already assigned to this user");
    }

    return db.userRole.create({
      data: {
        userId,
        roleId,
        expiresAt,
        comment,
      },
      include: {
        role: true,
      },
    });
  },

  async removeRoleFromUser(userId: string, roleId: string) {
    return db.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
  },

  async updateUserRoleExpiration(
    userId: string,
    roleId: string,
    expiresAt?: Date,
    comment?: string,
  ) {
    return db.userRole.update({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      data: {
        expiresAt,
        comment,
      },
      include: {
        role: true,
      },
    });
  },
};
