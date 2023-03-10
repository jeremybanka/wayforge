import { defineConfig } from "tsup"

export default defineConfig({
  entry: [`src/node/index.ts`, `src/recoil/index.ts`],
  dts: true,
  format: [`esm`, `cjs`],
  splitting: false,
  sourcemap: true,
  clean: true,
})
