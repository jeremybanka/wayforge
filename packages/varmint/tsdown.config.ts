import type { Options, UserConfig, UserConfigFn } from "tsdown"
import { defineConfig } from "tsdown"

const config: UserConfig | UserConfigFn = defineConfig({
	clean: true,
	dts: { sourcemap: true },
	entry: [`src/index.ts`, `src/varmint.x.ts`],
	format: [`esm`],
	outDir: `dist`,
	sourcemap: true,
	treeshake: true,
	tsconfig: `tsconfig.json`,
} satisfies Options)

export default config
