import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5174,
    proxy: {
      // ALL /api/* requests → http://localhost/prc-management-system/backend/api/*
      // Covers: /api/auth.php, /api/users.php, /api/announcements.php, etc.
      "/api": {
        target: "http://localhost/prc-management-system/backend",
        changeOrigin: true,
        // /api/auth.php → /api/auth.php on target (no rewrite needed)
      },
    },
  },
});
