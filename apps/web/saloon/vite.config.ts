/// <reference types="vitest" />
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import svgrPlugin from "vite-plugin-svgr"
import tsconfigPaths from "vite-tsconfig-paths"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    vanillaExtractPlugin(),
    svgrPlugin({
      svgrOptions: {
        icon: true,
        // ...svgr options (https://react-svgr.com/docs/options/)
      },
    }),
  ],
  server: {
    fs: {
      allow: [`src`], // `../../../packages`],
      strict: true,
    },
  },
  build: {
    sourcemap: true,
  },
  esbuild: {
    exclude: `../sample`,
  },

  // esbuild: {
  //   define: {
  //     this: `window`,
  //   },
  // },

  test: {
    globals: true,
    environment: `happy-dom`,
    css: false,
  },
})
