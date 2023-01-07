/// <reference types="vitest" />

import { resolve } from "path"

import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  test: { globals: true },
  resolve: {
    alias: {
      "~": resolve(__dirname, `..`),
    },
  },
})
