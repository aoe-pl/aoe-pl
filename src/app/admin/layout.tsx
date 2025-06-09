import { Sidebar } from "@/lib/admin-panel/components/sidebar";
import { Toaster } from "sonner";

import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await api.users.isAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="flex">
      <div>
        <Sidebar />
      </div>
      <main className="flex-1">{children}</main>
      <Toaster />
    </div>
  );
}
