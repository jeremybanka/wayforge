import { join } from "node:path"

import { defineConfig } from "tsup"

export default defineConfig({
	entry: [`src/index.ts`],
	outDir: join(import.meta.dirname, `dist`),
	dts: true,
	format: [`esm`, `cjs`],
	splitting: false,
	sourcemap: true,
	clean: true,
})
