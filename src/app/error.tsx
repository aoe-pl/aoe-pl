"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Check if it's a TRPC UNAUTHORIZED error
  const isUnauthorized = error.message.includes("UNAUTHORIZED");

  console.log({
    error,
    message: error.message,
    cause: error.cause,
    stack: error.stack,
    name: error.name,
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h2 className="text-2xl font-bold">
          {isUnauthorized
            ? "You don't have permission to access this content"
            : "Something went wrong!"}
        </h2>
        <Link
          href="/api/auth/signin"
          className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
        >
          Sign in to continue
        </Link>
        <button
          onClick={() => reset()}
          className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
