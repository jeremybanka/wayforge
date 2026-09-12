import type { InlineConfig, UserConfig } from "tsdown"
import { defineConfig } from "tsdown"

import { shellSource } from "./shell-source.config.ts"

const config: UserConfig = defineConfig({
	entry: [`src/cli.ts`],
	plugins: [shellSource],

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
