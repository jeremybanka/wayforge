import type { Options, UserConfig, UserConfigFn } from "tsdown"
import { defineConfig } from "tsdown"

export const config: UserConfig | UserConfigFn = defineConfig({
	clean: true,
	dts: true,
	entry: [`src/venerate.ts`],
	format: [`esm`],
	outDir: `dist`,
	sourcemap: true,
	treeshake: true,
	tsconfig: `tsconfig.json`,
} satisfies Options)

export default config
