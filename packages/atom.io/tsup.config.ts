import type { Options } from "tsup"
import { defineConfig } from "tsup"
import discoverSubmodules from "./__scripts__/discover-submodules.node"

export const BUNDLE_EXCLUDE_LIST = [
	...discoverSubmodules().map((submodule) => `atom.io/${submodule}`),
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
	loader: { ".scss": `css` },
	metafile: true,
	sourcemap: true,
	treeshake: true,
	jsxFactory: `React.createElement`,
	tsconfig: `tsconfig.json`,
}

export const JS_OPTIONS: Options = {
	...BASE_OPTIONS,
	clean: false,
	entry: {
		"dist/index": `src/index.ts`,
		"data/dist/index": `data/src/index.ts`,
		"internal/dist/index": `internal/src/index.ts`,
		"introspection/dist/index": `introspection/src/index.ts`,
		"json/dist/index": `json/src/index.ts`,
		"react/dist/index": `react/src/index.ts`,
		"react-devtools/dist/index": `react-devtools/src/index.ts`,
		"realtime-client/dist/index": `realtime-client/src/index.ts`,
		"realtime-react/dist/index": `realtime-react/src/index.ts`,
		"realtime-server/dist/index": `realtime-server/src/index.ts`,
		"realtime-testing/dist/index": `realtime-testing/src/index.ts`,
		"transceivers/set-rtx/dist/index": `transceivers/set-rtx/src/index.ts`,
	},
	outDir: `.`,
}

export const DTS_OPTIONS: Options = {
	...BASE_OPTIONS,
	dts: { only: true },
	entry: [`src/index.ts`],
	outDir: `dist`,
}

export default defineConfig((options) =>
	options.dts ? DTS_OPTIONS : JS_OPTIONS,
)
