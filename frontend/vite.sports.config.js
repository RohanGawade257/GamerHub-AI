import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: path.resolve(__dirname, "sports"),
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, "dist-sports"),
    emptyOutDir: true,
  },
});
