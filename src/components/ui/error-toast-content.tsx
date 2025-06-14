import { useState } from "react";

export function ErrorToast({
  message,
  customTitle,
}: {
  message: string;
  customTitle?: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex max-w-xs flex-col gap-2 p-2">
      <div className="text-accent text-sm">
        {customTitle ??
          "Something went wrong, please copy the error message and contact devs"}
      </div>
      <div className="bg-muted text-destructive border-destructive/30 max-h-40 overflow-auto rounded border px-2 py-1 font-mono text-xs">
        <pre className="break-all whitespace-pre-wrap">{message}</pre>
      </div>
      <button
        onClick={handleCopy}
        className="text-primary-foreground hover:text-primary-foreground/80 self-end text-xs underline"
        type="button"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
