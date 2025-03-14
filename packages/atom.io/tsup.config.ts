import type { Options } from "tsup"
import { defineConfig } from "tsup"

import discoverSubmodules from "./__scripts__/discover-submodules"

export const ALL_SUBMODULES = [
	`atom.io`,
	...discoverSubmodules().map((submodule) => `atom.io/${submodule}`),
]

export const BASE_OPTIONS: Options = {
	esbuildOptions: (options) => {
		options.chunkNames = `dist/[name]-[hash]`
		options.assetNames = `dist/[name]-[hash]`
	},
	external: ALL_SUBMODULES,
	format: [`esm`],
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
		"data/dist/index": `data/src/index.ts`,
		"eslint-plugin/dist/index": `eslint-plugin/src/index.ts`,
		"internal/dist/index": `internal/src/index.ts`,
		"introspection/dist/index": `introspection/src/index.ts`,
		"json/dist/index": `json/src/index.ts`,
		"react-devtools/dist/index": `react-devtools/src/index.ts`,
		"react/dist/index": `react/src/index.ts`,
		"realtime/dist/index": `realtime/src/index.ts`,
		"realtime-client/dist/index": `realtime-client/src/index.ts`,
		"realtime-react/dist/index": `realtime-react/src/index.ts`,
		"realtime-server/dist/index": `realtime-server/src/index.ts`,
		"realtime-testing/dist/index": `realtime-testing/src/index.ts`,
		"transceivers/set-rtx/dist/index": `transceivers/set-rtx/src/index.ts`,
		"web/dist/index": `web/src/index.ts`,
	},
	outDir: `.`,
}

export const DTS_OPTIONS: Options = {
	...BASE_OPTIONS,
	dts: { only: true },
	format: [`esm`],
	entry: [`src/index.ts`],
	metafile: false,
	outDir: `dist`,
}

export default defineConfig((options) => {
	console.log(options)
	return options.dts ? DTS_OPTIONS : JS_OPTIONS
})
