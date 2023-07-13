import { defineConfig } from "tsup"

export default defineConfig({
	entry: [`../src/react/index.ts`],
	outDir: `./dist`,
	dts: true,
	format: [`esm`, `cjs`],
	splitting: false,
	sourcemap: true,
	clean: true,
	jsxFactory: `React.createElement`,
	external: [`atom.io`, `react`, `@emotion/react`],
})
