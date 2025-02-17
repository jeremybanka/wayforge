import { join } from "node:path"

import { defineConfig } from "tsup"

export default defineConfig({
	clean: true,
	dts: true,
	entry: [`src/index.ts`],
	format: [`esm`, `cjs`],
	outDir: join(import.meta.dirname, `dist`),
	sourcemap: true,
	splitting: false,
})
