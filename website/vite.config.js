import { defineConfig } from "vite";

// Relative base: the same build works at a domain root, under /isracard/new/ on
// GitHub Pages, or in any folder of a shared host.
export default defineConfig({ base: "./", build: { chunkSizeWarningLimit: 600 } });
