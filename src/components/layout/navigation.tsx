import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui";
import type { Session } from "next-auth";
import { api } from "@/trpc/server";

const navItems = [
  { label: "Główna", href: "/" },
  { label: "Wiadomości", href: "#" },
  { label: "Turnieje", href: "#" },
];

interface NavigationProps {
  session: Session | null;
}

export async function Navigation({ session }: NavigationProps) {
  const isAdmin = session ? await api.users.isAdmin() : false;

  return (
    <nav className="from-background/95 to-background/70 border-primary/20 fixed top-0 z-50 w-full border-b bg-gradient-to-b shadow-lg backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link
          href="/"
          className="group flex items-center gap-3"
        >
          <div className="group-hover:shadow-primary/50 flex h-12 w-12 transform items-center justify-center overflow-hidden rounded-lg shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl">
            <Image
              src="/logo.png"
              alt="AoE2 Polska Logo"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-accent hidden text-xl font-bold sm:inline">
              AoE2 Polska
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1 md:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-foreground/80 hover:text-accent group relative px-4 py-2 text-sm font-semibold transition-colors"
            >
              {item.label}
              <div className="from-primary to-accent absolute bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="text-foreground/80 hover:text-accent group relative px-4 py-2 text-sm font-semibold transition-colors"
            >
              Admin
              <div className="from-primary to-accent absolute bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r transition-all duration-300 group-hover:w-full" />
            </Link>
          )}
          {session && (
            <span className="text-foreground/70 ml-2 hidden text-sm md:inline">
              Zalogowano jako{" "}
              <span className="text-accent font-semibold">
                {session.user?.name}
              </span>
            </span>
          )}
          <Button
            asChild
            className="from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground hover:shadow-primary/50 ml-4 transform bg-gradient-to-r font-semibold shadow-lg transition-all duration-300 hover:scale-105"
          >
            <Link href={session ? "/api/auth/signout" : "/api/auth/signin"}>
              {session ? "Wyloguj" : "Zaloguj się"}
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
