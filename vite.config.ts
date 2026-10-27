import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Порт фиксирован, потому что Tauri ждёт devUrl из tauri.conf.json.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1423,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**", "**/rust-cargo/**", "**/rustup/**", "**/tools/**"],
    },
  },
  build: {
    target: "chrome105",
    minify: "esbuild",
    sourcemap: false,
  },
});
