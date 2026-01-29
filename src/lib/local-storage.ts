/**
 * Centralized localStorage keys
 */
const storageKeys = {
  themePrimary: "theme-primary",
  themeAccent: "theme-accent",
} as const;

type StorageKey = keyof typeof storageKeys;

// Check if code is running on client side
const isClient = typeof window !== "undefined";

export const storage = {
  getItem: (key: StorageKey): string | null => {
    if (!isClient) return null;

    return localStorage.getItem(storageKeys[key]);
  },

  setItem: (key: StorageKey, value: string): void => {
    if (!isClient) return;

    localStorage.setItem(storageKeys[key], value);
  },

  removeItem: (key: StorageKey): void => {
    if (!isClient) return;

    localStorage.removeItem(storageKeys[key]);
  },
};
