import type { Options } from "tsup"
import { defineConfig } from "tsup"

export const OPTIONS = {
	esbuildOptions: (options) => {
		options.chunkNames = `dist/[name]-[hash]`
		options.assetNames = `dist/[name]-[hash]`
	},
	sourcemap: true,
	treeshake: true,
	tsconfig: `tsconfig.json`,
	dts: { only: true },
	format: [`esm`],
	entry: [`src/index.ts`],
	metafile: false,
	outDir: `dist`,
} satisfies Options

export default defineConfig(OPTIONS)
