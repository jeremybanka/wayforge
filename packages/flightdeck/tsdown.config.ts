import type { Options } from "tsdown"
import { defineConfig } from "tsdown"

export const OPTIONS = {
	clean: true,
	dts: true,
	entry: [`src/lib.ts`, `src/flightdeck.x.ts`, `src/klaxon.x.ts`],
	format: [`esm`],
	outDir: `dist`,
	sourcemap: true,
	treeshake: true,
	tsconfig: `tsconfig.json`,
} satisfies Options

export default defineConfig(OPTIONS)
