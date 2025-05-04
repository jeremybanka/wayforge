import type { Options, UserConfig } from "tsdown"
import { defineConfig } from "tsdown"

const config: UserConfig = defineConfig({
	clean: true,
	dts: true,
	entry: [`src/safedeposit.ts`],
	format: [`esm`],
	outDir: `dist`,
	platform: `node`,
	sourcemap: true,
	treeshake: true,
	tsconfig: `tsconfig.json`,
} satisfies Options)

export default config
