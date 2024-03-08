import * as path from "node:path"

import { defineConfig } from "tsup"

export default defineConfig({
	entry: [`src/index.ts`],
	outDir: path.join(__dirname, `../dist`),
	dts: true,
	format: [`esm`, `cjs`],
	splitting: false,
	sourcemap: true,
	clean: true,
})
