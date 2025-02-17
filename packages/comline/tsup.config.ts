import type { Options } from "tsup"
import { defineConfig } from "tsup"

export const OPTIONS = {
	sourcemap: true,
	treeshake: true,
	clean: true,
	tsconfig: `tsconfig.json`,
	dts: true,
	format: [`esm`],
	entry: [`src/cli.ts`],
	metafile: false,
	outDir: `dist`,
} satisfies Options

export default defineConfig(OPTIONS)
