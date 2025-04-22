import type { Options } from "tsdown"
import { defineConfig } from "tsdown"

export const OPTIONS = {
	clean: true,
	dts: true,
	entry: [`src/safedeposit.ts`],
	format: [`esm`],
	outDir: `dist`,
	platform: `node`,
	sourcemap: true,
	treeshake: true,
	tsconfig: `tsconfig.json`,
} satisfies Options

export default defineConfig(OPTIONS)
