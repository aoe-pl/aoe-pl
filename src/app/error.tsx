"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-sm text-gray-400">
          This is unexpected error, please contact admin.
        </p>
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
