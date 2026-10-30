import { defineConfig } from "vite";
import { resolve } from "node:path";

// Relative base: the same build works at a domain root, under /isracard/new/ on
// GitHub Pages, or in any folder of a shared host.
export default defineConfig({
  base: "./",
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: { input: { main: resolve(import.meta.dirname, "index.html"), vitrine: resolve(import.meta.dirname, "vitrine.html") } },
  },
});
