import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  // @ts-expect-error vitest expects "test" key; vite does not acknowledge
  test: {
    globals: true,
  },
})
