import type { Options } from "tsup"
import { defineConfig } from "tsup"
import discoverSubmodules from "./__scripts__/discover-submodules.node"

export const BUNDLE_EXCLUDE_LIST = [
	`atom.io`,
	...discoverSubmodules().map((submodule) => `atom.io/${submodule}`),
	`socket.io`,
	`socket.io-client`,
	`react`,
	`@testing-library/react`,
	`@floating-ui/react`,
	`framer-motion`,
	`happy-dom`,
]

export const BASE_CONFIG_OPTIONS: Options = {
	clean: true,
	dts: true,
	entry: [`src/index.ts`],
	external: BUNDLE_EXCLUDE_LIST,
	format: [`esm`, `cjs`],
	metafile: true,
	outDir: `./dist`,
	sourcemap: true,
	splitting: true,
	treeshake: true,
}

export default defineConfig({
	...BASE_CONFIG_OPTIONS,
	tsconfig: `tsconfig.json`,
})
