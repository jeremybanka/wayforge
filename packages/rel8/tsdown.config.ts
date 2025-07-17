import type { UserConfig, UserConfigFn } from "tsdown"
import { defineConfig } from "tsdown"

const config: UserConfig | UserConfigFn = defineConfig({
	dts: { sourcemap: true },
	format: [`esm`],
	sourcemap: false,
	treeshake: true,
	tsconfig: `tsconfig.json`,
	clean: true,
	outDir: `dist`,
	entry: {
		"types/index": `src/types/index.ts`,
		"junction/index": `src/junction/index.ts`,
	},
})
export default config
