import { db } from "@/server/db";

export interface CreateStreamerInput {
  userId?: string;
  streamerName: string;
  streamerUrl: string;
}

export interface UpdateStreamerInput {
  id: string;
  streamerName?: string;
  streamerUrl?: string;
  isActive?: boolean;
}

export const streamerRepository = {
  async getStreamers() {
    return db.streamer.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { streamerName: "asc" },
    });
  },

  async getStreamerById(id: string) {
    return db.streamer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  async getStreamerByUserId(userId: string) {
    return db.streamer.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  async createStreamer(data: CreateStreamerInput) {
    return db.streamer.create({
      data: {
        userId: data.userId ?? undefined,
        streamerName: data.streamerName,
        streamerUrl: data.streamerUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  async updateStreamer(data: UpdateStreamerInput) {
    const { id, ...updateData } = data;
    return db.streamer.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  async deleteStreamer(id: string) {
    return db.streamer.delete({
      where: { id },
    });
  },

  async getAvailableUsers() {
    // Get users who don't have a streamer profile yet
    return db.user.findMany({
      where: {
        streamer: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });
  },
};
