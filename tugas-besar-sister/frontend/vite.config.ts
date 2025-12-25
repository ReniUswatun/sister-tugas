import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const port = parseInt(process.env.VITE_PORT || "5173", 10);

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    host: "0.0.0.0",
    port: port,
    middlewareMode: false,
    hmr: {
      host: "localhost",
      port: port,
    },
  },
  ssr: {
    noExternal: [],
  },
});
