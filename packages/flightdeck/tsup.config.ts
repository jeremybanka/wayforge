import type { Options } from "tsup"
import { defineConfig } from "tsup"

export const OPTIONS = {
	clean: true,
	dts: true,
	entry: [`src/lib.ts`, `src/flightdeck.x.ts`, `src/klaxon.x.ts`],
	format: [`esm`],
	metafile: false,
	outDir: `dist`,
	sourcemap: true,
	treeshake: true,
	tsconfig: `tsconfig.json`,
} satisfies Options

export default defineConfig(OPTIONS)
