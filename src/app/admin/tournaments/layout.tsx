import { Sidebar } from "@/lib/admin-panel/components/sidebar";

export default function AdminTournamentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-16 flex-1 p-8 md:ml-64">{children}</main>
    </div>
  );
}
