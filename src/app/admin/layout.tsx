import { Sidebar } from "@/lib/admin-panel/components/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <div className="w-64">
        <Sidebar />
      </div>
      <main className="flex-1">{children}</main>
    </div>
  );
}
