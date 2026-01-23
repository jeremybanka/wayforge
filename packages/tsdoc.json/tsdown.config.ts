import type { InlineConfig, UserConfig } from "tsdown"
import { defineConfig } from "tsdown"

const config: UserConfig = defineConfig({
	entry: {
		"main/index": `src/main/index.ts`,
		"react/index": `src/react/index.ts`,
	},
	external: [`react`, `typescript`, `tsdoc.json`],

	clean: true,
	dts: { sourcemap: true },
	fixedExtension: false,
	format: `esm`,
	outDir: `dist`,
	platform: `node`,
	sourcemap: false,
	treeshake: true,
	tsconfig: `tsconfig.json`,
} satisfies InlineConfig)
export default config
