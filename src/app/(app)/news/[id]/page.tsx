import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { NewsDetailContent } from "./news-detail-client";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const isAdmin = session ? await api.users.isAdmin() : false;
  const { id } = await params;

  return (
    <NewsDetailContent
      id={id}
      isAdmin={isAdmin}
    />
  );
}
