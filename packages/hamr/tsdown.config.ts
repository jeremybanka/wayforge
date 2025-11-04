import type { UserConfig, UserConfigFn } from "tsdown"
import { defineConfig } from "tsdown"

import { fromEntries } from "../../packages/atom.io/src/json/entries.ts"
import discoverSubmodules from "./__scripts__/discover-submodules.node.ts"

const SUBMODULE_NAMES = discoverSubmodules()

const EXTERNAL = [
	/^eslint-/,
	/^@eslint-/,
	/^@typescript-eslint\//,
	`atom.io`,
	...SUBMODULE_NAMES.map((submodule) => `atom.io/${submodule}`),
]

const ALL_ENTRIES = fromEntries(
	SUBMODULE_NAMES.map(
		(name) => [`${name}/index`, `src/${name}/index.ts`] as const,
	),
)

console.log({ SUBMODULE_NAMES, ALL_ENTRIES })

const config: UserConfig | UserConfigFn = defineConfig({
	entry: ALL_ENTRIES,

	clean: true,
	dts: { sourcemap: true },
	external: EXTERNAL,
	fixedExtension: false,
	format: `esm`,
	platform: `browser`,
	outDir: `dist`,
	sourcemap: false,
	treeshake: true,
	tsconfig: `tsconfig.json`,
})
export default config
