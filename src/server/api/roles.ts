import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { rolesRepository } from "@/lib/repositories/rolesRepository";

const assignRoleSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
  expiresAt: z.date().optional(),
  comment: z.string().optional(),
});

const updateRoleSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
  expiresAt: z.date().optional(),
  comment: z.string().optional(),
});

export const rolesRouter = createTRPCRouter({
  list: adminProcedure.query(async ({ ctx }) => {
    const allRoles = await rolesRepository.getAllRoles();

    // Check if current user is admin
    if (!ctx.session?.user?.id) {
      return allRoles.filter((role) => role.modAssignable);
    }

    const isUserAdmin = await rolesRepository.getUserRoles(ctx.session.user.id);
    const hasAdminRole = isUserAdmin.some((ur) => ur.role.type === "ADMIN");

    // If user is admin, show all roles
    if (hasAdminRole) {
      return allRoles;
    }

    // If user is moderator, only show roles that are modAssignable
    return allRoles.filter((role) => role.modAssignable);
  }),

  getUserRoles: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return rolesRepository.getUserRoles(input.userId);
    }),

  assignRole: adminProcedure
    .input(assignRoleSchema)
    .mutation(async ({ input, ctx }) => {
      // Check if role can be assigned by current user
      const role = await rolesRepository.getRoleById(input.roleId);
      if (!role) {
        throw new Error("Role not found");
      }

      // Check if current user is admin
      if (!ctx.session?.user?.id) {
        throw new Error("User session not found");
      }

      const currentUserRoles = await rolesRepository.getUserRoles(
        ctx.session.user.id,
      );
      const hasAdminRole = currentUserRoles.some(
        (ur) => ur.role.type === "ADMIN",
      );

      // If user is not admin and role is not modAssignable, deny
      if (!hasAdminRole && !role.modAssignable) {
        throw new Error("You don't have permission to assign this role");
      }

      return rolesRepository.assignRoleToUser(
        input.userId,
        input.roleId,
        input.expiresAt,
        input.comment,
      );
    }),

  removeRole: adminProcedure
    .input(z.object({ userId: z.string(), roleId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Check if role can be removed by current user
      const role = await rolesRepository.getRoleById(input.roleId);
      if (!role) {
        throw new Error("Role not found");
      }

      // Check if current user is admin
      if (!ctx.session?.user?.id) {
        throw new Error("User session not found");
      }

      const currentUserRoles = await rolesRepository.getUserRoles(
        ctx.session.user.id,
      );
      const hasAdminRole = currentUserRoles.some(
        (ur) => ur.role.type === "ADMIN",
      );

      // If user is not admin and role is not modAssignable, deny
      if (!hasAdminRole && !role.modAssignable) {
        throw new Error("You don't have permission to remove this role");
      }

      return rolesRepository.removeRoleFromUser(input.userId, input.roleId);
    }),

  updateRole: adminProcedure
    .input(updateRoleSchema)
    .mutation(async ({ input }) => {
      return rolesRepository.updateUserRoleExpiration(
        input.userId,
        input.roleId,
        input.expiresAt,
        input.comment,
      );
    }),
});
