import { defineConfig } from "tsup"

export default defineConfig({
	entry: [`src/index.ts`],
	dts: true,
	format: [`esm`, `cjs`],
	splitting: true,
	treeshake: true,
	sourcemap: true,
	minify: true,
	clean: true,
})
