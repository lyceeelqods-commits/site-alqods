import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
    allowedHosts: true,
    // في وضع التطوير: تمرير منصة الحراسة وواجهتها البرمجية إلى خادم المنصة (منفذ 3000)
    proxy: {
      "/harasa": "http://localhost:3000",
      "/api": "http://localhost:3000",
    },
  },
  preview: {
    host: true,
    allowedHosts: true,
    proxy: {
      "/harasa": "http://localhost:3000",
      "/api": "http://localhost:3000",
    },
  },
});
