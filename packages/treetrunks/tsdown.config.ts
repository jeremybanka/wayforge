import type { InlineConfig, UserConfig } from "tsdown"
import { defineConfig } from "tsdown"

export const config: UserConfig = defineConfig({
	entry: [`src/treetrunks.ts`],

	clean: true,
	dts: { sourcemap: true },
	fixedExtension: false,
	format: `esm`,
	outDir: `dist`,
	platform: `neutral`,
	sourcemap: true,
	treeshake: true,
	tsconfig: `tsconfig.json`,
} satisfies InlineConfig)

export default config
