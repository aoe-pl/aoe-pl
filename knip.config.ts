import type { KnipConfig } from "knip";

const config = {
  ignore: ["src/components/ui/**", "src/trpc/**"],
  // sharp is used in nextjs image optimization
  ignoreDependencies: ["sharp", "eslint"],
} satisfies KnipConfig;

export default config;
