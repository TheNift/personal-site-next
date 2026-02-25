import vinext from "vinext";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [vinext()],
  define: command === 'build' ? {
    'process.env.NODE_ENV': '"production"',
  } : {},
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
}));
