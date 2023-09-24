import { defineConfig } from "tsup"

export default defineConfig({
	entry: [`./src/index.ts`],
	outDir: `./dist`,
	dts: true,
	format: [`esm`, `cjs`],
	splitting: true,
	treeshake: true,
	sourcemap: true,
	clean: true,
	external: [`atom.io`],
})
