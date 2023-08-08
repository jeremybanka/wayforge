import { defineConfig } from "tsup"

export default defineConfig({
	entry: [`../src/recoil-error-boundary/index.ts`],
	outDir: `./dist`,
	dts: true,
	format: [`esm`, `cjs`],
	splitting: false,
	sourcemap: true,
	clean: true,
	external: [`react`, `@emotion/react`, `fp-ts`, `recoil`],
})
