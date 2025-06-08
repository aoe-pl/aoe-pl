import { Sidebar } from "@/lib/admin-panel/components/sidebar";
import { Toaster } from "sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
