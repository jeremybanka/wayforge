import { defineConfig } from "tsup"

export default defineConfig({
	entry: [`./src/index.ts`],
	outDir: `./dist`,
	dts: true,
	format: [`esm`, `cjs`],
	splitting: true,
	treeshake: true,
	sourcemap: true,
	minify: true,
	clean: true,
	jsxFactory: `React.createElement`,
	external: [`atom.io`, `react`, `@emotion/react`],
})
