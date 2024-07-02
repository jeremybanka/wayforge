import type { Options } from "tsup"
import { defineConfig } from "tsup"

export const BUNDLE_EXCLUDE_LIST = [
	`@microsoft/tsdoc`,
	`colors`,
	`react`,
	`tsdoc.json`,
]

export const BASE_OPTIONS: Options = {
	esbuildOptions: (options) => {
		options.chunkNames = `dist/[name]-[hash]`
		options.assetNames = `dist/[name]-[hash]`
	},
	external: BUNDLE_EXCLUDE_LIST,
	format: `esm`,
	jsxFactory: `React.createElement`,
	loader: { ".scss": `css` },
	metafile: true,
	sourcemap: false,
	treeshake: true,
	tsconfig: `tsconfig.json`,
}

export const JS_OPTIONS: Options = {
	...BASE_OPTIONS,
	clean: false,
	dts: false,
	entry: {
		"dist/index": `src/index.ts`,
		"react/dist/index": `react/src/index.ts`,
	},
	outDir: `.`,
}

export const DTS_OPTIONS: Options = {
	...BASE_OPTIONS,
	dts: { only: true },
	entry: [`src/index.ts`],
	metafile: false,
	outDir: `dist`,
}

export default defineConfig((options) => {
	console.log(options)
	const using = options.dts ? DTS_OPTIONS : JS_OPTIONS
	console.log({ using })
	return using
})
