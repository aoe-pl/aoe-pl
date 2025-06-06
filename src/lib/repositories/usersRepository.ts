import { db } from "@/server/db";

export const usersRepository = {
  async getUsers() {
    return db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
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
}; 