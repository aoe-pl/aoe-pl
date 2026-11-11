"use client";

import { useEffect, useState } from "react";

/**
 * Returns false during server rendering and the initial hydration pass, then
 * true once mounted on the client.
 */
export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return mounted;
}
