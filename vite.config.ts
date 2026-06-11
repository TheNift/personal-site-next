import { cloudflare } from "@cloudflare/vite-plugin";
import vinext from "vinext";
import { defineConfig } from "vite";

// Ensure all Vite environments (client, rsc, ssr) share the same RSC compatibility ID.
// Without this, vinext generates a random UUID per environment, causing the client to
// see a different ID than the server — which forces a full page reload on every navigation.
process.env.__VINEXT_SHARED_RSC_COMPATIBILITY_ID = "personal-site";

export default defineConfig(({ command }) => ({
  plugins: [vinext(), cloudflare({ viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] } })],
  define: {
    ...(command === 'build' ? { 'process.env.NODE_ENV': '"production"' } : {}),
    'process.env.__VINEXT_RSC_COMPATIBILITY_ID': '"personal-site"',
  },
  optimizeDeps: {
    include: ["react/jsx-runtime", "react/jsx-dev-runtime", "react", "react-dom", "react-dom/client"]
  },
  ssr: {
    noExternal: ["detect-gpu"]
  },
  build: {
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        if (warning.code === 'SOURCEMAP_ERROR') return;
        defaultHandler(warning);
      },
    },
  },
  environments: {
    rsc: {
      build: {
        rollupOptions: {
          external: (id: string) =>
            id.includes("BackgroundScene") ||
            id.includes("/BackgroundScene.tsx") ||
            id.includes("\\BackgroundScene.tsx"),
        },
      },
    },
    ssr: {
      build: {
        rollupOptions: {
          external: (id: string) =>
            id.includes("BackgroundScene") ||
            id.includes("/BackgroundScene.tsx") ||
            id.includes("\\BackgroundScene.tsx"),
        },
      },
    },
  },
}));
