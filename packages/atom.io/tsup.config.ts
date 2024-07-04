import type { Options } from "tsup"
import { defineConfig } from "tsup"

import discoverSubmodules from "./__scripts__/discover-submodules"

export const BUNDLE_EXCLUDE_LIST = [
	`atom.io`,
	...discoverSubmodules().map((submodule) => `atom.io/${submodule}`),
	`socket.io`,
	`socket.io-client`,
	`react`,
	`@types/react`,
	`@typescript-eslint/utils`,
	`@testing-library/react`,
	`@floating-ui/react`,
	`framer-motion`,
	`happy-dom`,
]

export const BASE_OPTIONS: Options = {
	esbuildOptions: (options) => {
		options.chunkNames = `dist/[name]-[hash]`
		options.assetNames = `dist/[name]-[hash]`
	},
	external: BUNDLE_EXCLUDE_LIST,
	format: [`esm`, `cjs`],
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
		"eslint-plugin/dist/index": `eslint-plugin/src/index.ts`,
	},
	outDir: `.`,
}

export default defineConfig((options) => {
	console.log(options)
	const using = JS_OPTIONS
	console.log({ using })
	console.log(`bundle exclude list: ${discoverSubmodules().join(`, `)}`)
	return using
})
