import type { Options } from "tsup"
import { defineConfig } from "tsup"
import discoverSubmodules from "./__scripts__/discover-submodules.node"

import { entriesToRecord } from "anvl/object"

const SUBMODULE_NAMES = discoverSubmodules()

export const BUNDLE_EXCLUDE_LIST = [
	`hamr`,
	...SUBMODULE_NAMES.map((submodule) => `hamr/${submodule}`),
	`socket.io`,
	`socket.io-client`,
	`react`,
	`@types/react`,
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
	sourcemap: true,
	treeshake: true,
	tsconfig: `tsconfig.json`,
}

export const JS_OPTIONS: Options = {
	...BASE_OPTIONS,
	clean: false,
	dts: false,
	entry: {
		...entriesToRecord(
			SUBMODULE_NAMES.map((submodule) => [
				`hamr/${submodule}/dist/index`,
				`hamr/${submodule}/src/index.ts`,
			]),
		),
	},
	outDir: `.`,
}

export default defineConfig(JS_OPTIONS)
