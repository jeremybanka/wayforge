import { defineConfig } from "tsup"

export const BUNDLE_EXCLUDE_LIST = [
	`atom.io`,
	`atom.io/internal`,
	`atom.io/introspection`,
	`atom.io/json`,
	`atom.io/react`,
	`atom.io/react-devtools`,
	`atom.io/realtime`,
	`atom.io/realtime-client`,
	`atom.io/realtime-react`,
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

export default defineConfig({
	entry: [`src/index.ts`],
	dts: true,
	format: [`esm`, `cjs`],
	splitting: true,
	treeshake: true,
	sourcemap: true,
	clean: true,
	external: BUNDLE_EXCLUDE_LIST,
})
