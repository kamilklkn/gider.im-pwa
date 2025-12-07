import { paraglide } from "@inlang/paraglide-vite";
import react from "@vitejs/plugin-react-swc";
import fs from "node:fs";
import path from "node:path";
import Unfonts from "unplugin-fonts/vite";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    optimizeDeps: {
      exclude: ["@evolu/react", "@sqlite.org/sqlite-wasm"],
      include: ["react-dom"],
    },
    worker: {
      format: "es",
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      "process.env.VITE_FIREBASE_API_KEY": JSON.stringify(env.VITE_FIREBASE_API_KEY),
      "process.env.VITE_FIREBASE_AUTH_DOMAIN": JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
      "process.env.VITE_FIREBASE_PROJECT_ID": JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
      "process.env.VITE_FIREBASE_STORAGE_BUCKET": JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
      "process.env.VITE_FIREBASE_MESSAGING_SENDER_ID": JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      "process.env.VITE_FIREBASE_APP_ID": JSON.stringify(env.VITE_FIREBASE_APP_ID),
    },
    server: {
      host: "0.0.0.0",
      port: 5171,
      strictPort: true,

      ...(process.env.NODE_ENV === "development" &&
        fs.existsSync("./localhost-key.pem") &&
        fs.existsSync("./localhost.pem") && {
          https: {
            key: fs.readFileSync(path.resolve(__dirname, "./localhost-key.pem")),
            cert: fs.readFileSync(path.resolve(__dirname, "./localhost.pem")),
          },
        }),
    },
    plugins: [
      react(),
      Unfonts({
        fontsource: {
          families: ["Inter Variable", "Roboto Mono Variable"],
        },
      }),
      paraglide({
        project: "./project.inlang",
        outdir: "./src/paraglide",
      }),
      VitePWA({
        registerType: "prompt",
        injectRegister: null,
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico,wasm}"],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
        },
        devOptions: {
          type: "module",
          navigateFallback: "index.html",
          suppressWarnings: true,
          enabled: true,
        },
        manifest: {
          orientation: "portrait",
          name: "gider.im",
          short_name: "gider.im",
          description:
            "Privacy first, local first, no tracking, no ads, no data collection.",
          theme_color: "#ffffff",
          icons: [
            {
              src: "pwa-64x64.png",
              sizes: "64x64",
              type: "image/png",
            },
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
      }),
    ],
    build: {
      sourcemap: process.env.NODE_ENV === "development",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});