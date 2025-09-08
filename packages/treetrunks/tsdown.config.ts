import type { Options, UserConfig, UserConfigFn } from "tsdown"
import { defineConfig } from "tsdown"

export const config: UserConfig | UserConfigFn = defineConfig({
	clean: true,
	dts: { sourcemap: true },
	entry: [`src/treetrunks.ts`],
	format: [`esm`],
	outDir: `dist`,
	sourcemap: true,
	treeshake: true,
	tsconfig: `tsconfig.json`,
} satisfies Options)

export default config
