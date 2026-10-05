/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import createNextIntlPlugin from "next-intl/plugin";
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      // Twitch stream preview thumbnails.
      { protocol: "https", hostname: "static-cdn.jtvnw.net" },
    ],
  },
  webpack(webpackConfig) {
    webpackConfig.experiments = {
      ...webpackConfig.experiments,
      asyncWebAssembly: true,
    };
    return webpackConfig;
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(config);
