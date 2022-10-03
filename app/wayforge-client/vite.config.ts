import react from "@vitejs/plugin-react"
import { sassPlugin } from "esbuild-sass-plugin"
import { defineConfig } from "vite"
import svgrPlugin from "vite-plugin-svgr"
import tsconfigPaths from "vite-tsconfig-paths"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: `@emotion/react`,
      babel: {
        plugins: [`@emotion/babel-plugin`],
      },
    }),
    tsconfigPaths(),
    sassPlugin(),
    svgrPlugin({
      svgrOptions: {
        icon: true,
        // ...svgr options (https://react-svgr.com/docs/options/)
      },
    }),
  ],

  esbuild: {
    define: {
      this: `window`,
    },
  },

  // @ts-expect-error vitest expects "test" key; vite does not acknowledge
  test: {
    globals: true,
    environment: `jsdom`,
    setupFiles: `./before-tests.ts`,
    // parsing CSS is slow
    css: false,
  },
})
