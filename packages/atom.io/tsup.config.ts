import type { Options } from "tsup"
import { defineConfig } from "tsup"

export const BUNDLE_EXCLUDE_LIST = [
	`atom.io`,
	`atom.io/data`,
	`atom.io/internal`,
	`atom.io/introspection`,
	`atom.io/json`,
	`atom.io/react`,
	`atom.io/react-devtools`,
	`atom.io/realtime-client`,
	`atom.io/realtime-react`,
	`atom.io/realtime-server`,
	`atom.io/realtime-testing`,
	`atom.io/transceivers/set-rtx`,
	`socket.io`,
	`socket.io-client`,
	`react`,
	`@types/react`,
	`@testing-library/react`,
	`@floating-ui/react`,
	`framer-motion`,
	`happy-dom`,
]

export const BASE_CONFIG_OPTIONS: Options = {
	clean: false,
	outDir: `.`,
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
	esbuildOptions: (options) => {
		options.chunkNames = `dist/[name]-[hash]`
		options.assetNames = `dist/[name]-[hash]`
	},
	external: BUNDLE_EXCLUDE_LIST,
	format: [`esm`, `cjs`],
	metafile: true,
	sourcemap: true,
	treeshake: true,
	jsxFactory: `React.createElement`,
	loader: {
		".scss": `css`,
	},
}

export const DECLARATION: Options = {
	...BASE_CONFIG_OPTIONS,
	entry: [`src/index.ts`],
	outDir: `dist`,
	dts: {
		only: true,
	},
}

export default defineConfig({
	...BASE_CONFIG_OPTIONS,
	tsconfig: `tsconfig.json`,
})
