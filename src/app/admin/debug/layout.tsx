export default function AdminDebugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="ml-16 flex-1 p-8 md:ml-64">{children}</div>;
}
