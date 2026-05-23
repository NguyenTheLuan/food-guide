import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "./",
  publicDir: "public",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        dev: resolve(__dirname, "dev/index.html"),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
