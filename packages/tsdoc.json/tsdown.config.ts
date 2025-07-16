import type { UserConfig, UserConfigFn } from "tsdown"
import { defineConfig } from "tsdown"

const config: UserConfig | UserConfigFn = defineConfig({
	external: [`tsdoc.json`],
	dts: { sourcemap: true },
	format: [`esm`],
	sourcemap: false,
	treeshake: true,
	tsconfig: `tsconfig.json`,
	clean: true,
	outDir: `dist`,
	entry: {
		"main/index": `src/main/index.ts`,
		"react/index": `src/react/index.ts`,
	},
})
export default config
