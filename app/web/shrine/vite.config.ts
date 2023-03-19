/// <reference types="vitest" />
import { defineConfig } from "vite"
import svgrPlugin from "vite-plugin-svgr"
import tsconfigPaths from "vite-tsconfig-paths"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths()],

  esbuild: {
    define: {
      this: `window`,
    },
  },

  test: {
    globals: true,
    environment: `happy-dom`,
    css: false,
  },
})
