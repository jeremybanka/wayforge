import { defineConfig } from "tsup"

export default defineConfig({
  entry: [`src/index.ts`, `src/react/index.ts`],
  dts: true,
  format: [`esm`, `cjs`],
  splitting: false,
  sourcemap: true,
  clean: true,
})
