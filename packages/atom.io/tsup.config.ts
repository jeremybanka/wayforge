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
