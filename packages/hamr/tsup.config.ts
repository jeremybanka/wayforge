import { defineConfig } from "tsup"

const entry = [
  `react-combo`,
  `react-elastic-input`,
  `react-error-boundary`,
  `react-json-editor`,
  `recoil-effect-storage`,
  `recoil-tools`,
].map((path) => `src/${path}/index.ts`)

export default defineConfig({
  entry,
  dts: true,
  format: [`esm`, `cjs`],
  splitting: false,
  sourcemap: true,
  clean: true,
})
