import type { InlineConfig, UserConfig } from "tsdown"
import { defineConfig } from "tsdown"

export const config: UserConfig = defineConfig({
	entry: [`src/venerate.ts`],

	clean: true,
	dts: { sourcemap: true },
	fixedExtension: false,
	format: `esm`,
	outDir: `dist`,
	platform: `node`,
	sourcemap: true,
	treeshake: true,
	tsconfig: `tsconfig.json`,
} satisfies InlineConfig)

export default config
