import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: `@emotion/react`,
      babel: {
        plugins: [`@emotion/babel-plugin`],
      },
    }),
  ],

  // @ts-expect-error vitest expects "test" key; vite does not acknowledge
  test: {
    globals: true,
    environment: `jsdom`,
    setupFiles: `./before-tests.ts`,
    // parsing CSS is slow
    css: false,
  },

  define: {
    this: `window`,
  },
})
