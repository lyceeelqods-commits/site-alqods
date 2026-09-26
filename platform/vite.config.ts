import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/harasa/", // المنصة تُخدَّم ضمن الموقع الرسمي تحت /harasa/
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  server: {
    host: true,
    allowedHosts: true,
    port: 5174,
    proxy: { "/api": "http://localhost:3000" },
  },
  build: { outDir: "dist", chunkSizeWarningLimit: 2000 },
});
