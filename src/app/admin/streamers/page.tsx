"use client";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { CreateStreamerDialog } from "./create-streamer-dialog";
import { EditStreamerDialog } from "./edit-streamer-dialog";
import { DeleteStreamerDialog } from "./delete-streamer-dialog";

type Streamer = {
  id: string;
  streamerName: string;
  streamerUrl: string;
  isActive: boolean;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

export default function StreamersPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingStreamer, setEditingStreamer] = useState<Streamer | null>(null);
  const [deletingStreamer, setDeletingStreamer] = useState<Streamer | null>(
    null,
  );

  const { data: streamers, isLoading, refetch } = api.streamers.list.useQuery();

  const toggleActiveMutation = api.streamers.update.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const handleToggleActive = async (streamer: Streamer) => {
    await toggleActiveMutation.mutateAsync({
      id: streamer.id,
      isActive: !streamer.isActive,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex min-h-64 items-center justify-center">
          <div className="text-muted-foreground">Loading streamers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Streamers</h1>
          <p className="text-muted-foreground">Manage streamer profiles</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Streamer
        </Button>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left font-medium">Streamer Name</th>
                <th className="p-4 text-left font-medium">User</th>
                <th className="p-4 text-left font-medium">URL</th>
                <th className="p-4 text-left font-medium">Status</th>
                <th className="p-4 text-left font-medium">Created</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {streamers?.map((streamer) => (
                <tr
                  key={streamer.id}
                  className="border-b last:border-b-0"
                >
                  <td className="p-4 font-medium">{streamer.streamerName}</td>
                  <td className="p-4">
                    {streamer.user ? (
                      <div>
                        <div className="font-medium">
                          {streamer.user.name ?? "No name"}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {streamer.user.email}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm">
                        No user assigned
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <a
                      href={streamer.streamerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {streamer.streamerUrl}
                    </a>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleActive(streamer)}
                      className="flex items-center gap-2"
                    >
                      {streamer.isActive ? (
                        <>
                          <Eye className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-500">Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="text-muted-foreground p-4">
                    {new Date(streamer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingStreamer(streamer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingStreamer(streamer)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!streamers || streamers.length === 0) && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-muted-foreground p-8 text-center"
                  >
                    No streamers found. Create your first streamer to get
                    started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateStreamerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => void refetch()}
      />

      {editingStreamer && (
        <EditStreamerDialog
          streamer={editingStreamer}
          open={!!editingStreamer}
          onOpenChange={(open: boolean) => !open && setEditingStreamer(null)}
          onSuccess={() => void refetch()}
        />
      )}

      {deletingStreamer && (
        <DeleteStreamerDialog
          streamer={deletingStreamer}
          open={!!deletingStreamer}
          onOpenChange={(open: boolean) => !open && setDeletingStreamer(null)}
          onSuccess={() => void refetch()}
        />
      )}
    </div>
  );
}
