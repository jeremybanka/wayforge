import type { Options } from "tsup"
import { defineConfig } from "tsup"

export const OPTIONS = {
	esbuildOptions: (options) => {
		options.chunkNames = `dist/[name]-[hash]`
		options.assetNames = `dist/[name]-[hash]`
	},
	sourcemap: true,
	treeshake: true,
	clean: true,
	tsconfig: `tsconfig.json`,
	dts: true,
	format: [`esm`],
	entry: [`src/recoverage.x.ts`],
	metafile: false,
	outDir: `dist`,
} satisfies Options

export default defineConfig(OPTIONS)
