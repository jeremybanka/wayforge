import { defineConfig } from "tsup"

export default defineConfig({
  entry: [`../src/react-devtools/index.ts`],
  outDir: `./dist`,
  dts: true,
  format: [`esm`, `cjs`],
  splitting: false,
  sourcemap: true,
  clean: true,
  loader: {
    ".scss": `css`,
  },
  external: [
    `atom.io`,
    `@emotion/react`,
    `fp-ts`,
    `react`,
    `framer-motion`,
    `hamt_plus`,
    `recoil`,
    `rxjs`,
    `ajv`,
  ],
})
