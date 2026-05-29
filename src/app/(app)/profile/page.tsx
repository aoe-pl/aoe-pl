import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin");
  }

  const profile = await api.users.getOwnProfile();
  if (!profile) redirect("/");

  redirect(`/players/${profile.playerNumber}`);
}
