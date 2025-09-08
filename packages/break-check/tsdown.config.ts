import type { Options, UserConfig, UserConfigFn } from "tsdown"
import { defineConfig } from "tsdown"

const config: UserConfig | UserConfigFn = defineConfig({
	clean: true,
	dts: { sourcemap: true },
	entry: [`src/break-check.ts`, `src/break-check.x.ts`],
	format: [`esm`],
	outDir: `dist`,
	sourcemap: true,
	treeshake: true,
	tsconfig: `tsconfig.json`,
} satisfies Options)

export default config
