import type { UserConfig, UserConfigFn } from "tsdown"
import { defineConfig } from "tsdown"

import discoverSubmodules from "./__scripts__/discover-submodules.ts"
import { fromEntries } from "./src/json/entries.ts"

const SUBMODULE_NAMES = discoverSubmodules()

const EXTERNAL = [
	/^node:/,
	/^eslint-/,
	/^@eslint\//,
	/^@typescript-eslint\//,
	`atom.io`,
	...SUBMODULE_NAMES.map((submodule) => `atom.io/${submodule}`),
]

const ALL_ENTRIES = {
	"main/index": `src/main/index.ts`,
	...fromEntries(
		SUBMODULE_NAMES.map(
			(name) => [`${name}/index`, `src/${name}/index.ts`] as const,
		),
	),
}

console.log({ SUBMODULE_NAMES, ALL_ENTRIES })

const config: UserConfig | UserConfigFn = defineConfig({
	entry: ALL_ENTRIES,
	external: EXTERNAL,

	clean: true,
	dts: { sourcemap: true },
	fixedExtension: false,
	format: `esm`,
	outDir: `dist`,
	platform: `neutral`,
	sourcemap: false,
	treeshake: true,
	tsconfig: `tsconfig.json`,
})

export default config
