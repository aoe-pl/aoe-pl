import { Sidebar } from '@/lib/admin-panel/components/sidebar';

export default function AdminTournamentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#1a202c]">
      <Sidebar />
      <main className="flex-1 p-8 ml-16 md:ml-64">{children}</main>
    </div>
  );
} 