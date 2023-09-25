import { defineConfig } from "tsup"
import { BUNDLE_EXCLUDE_LIST } from "~/packages/atom.io/tsup.config"

export default defineConfig({
	entry: [`./src/index.ts`],
	outDir: `./dist`,
	dts: true,
	format: [`esm`, `cjs`],
	splitting: true,
	treeshake: true,
	sourcemap: true,
	clean: true,
	external: BUNDLE_EXCLUDE_LIST,
})
