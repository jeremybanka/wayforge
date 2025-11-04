import type { InlineConfig } from "tsdown"
import { defineConfig } from "tsdown"

export const OPTIONS = {
	entry: [`src/lib.ts`, `src/flightdeck.x.ts`, `src/klaxon.x.ts`],
	external: [/^atom\.io/, `safedeposit`],

	clean: true,
	dts: { sourcemap: true },
	fixedExtension: false,
	format: `esm`,
	outDir: `dist`,
	platform: `node`,
	sourcemap: true,
	treeshake: true,
	tsconfig: `tsconfig.json`,
} satisfies InlineConfig

export default defineConfig(OPTIONS)
