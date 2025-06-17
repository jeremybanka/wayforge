import type { UserConfig, UserConfigFn } from "tsdown"
import { defineConfig } from "tsdown"

import discoverSubmodules from "./__scripts__/discover-submodules.ts"
import { fromEntries } from "./src/json/entries.ts"

const SUBMODULE_NAMES = discoverSubmodules()

const EXTERNAL = [
	/^eslint-/,
	/^@eslint-/,
	/^@typescript-eslint\//,
	`atom.io`,
	...SUBMODULE_NAMES.map((submodule) => `atom.io/${submodule}`),
]

const otherEntries = fromEntries(
	SUBMODULE_NAMES.map(
		(name) => [`${name}/index`, `src/${name}/index.ts`] as const,
	),
)

console.log({ SUBMODULE_NAMES, otherEntries })

const config: UserConfig | UserConfigFn = defineConfig({
	external: EXTERNAL,
	dts: { sourcemap: true },
	format: [`esm`],
	sourcemap: false,
	treeshake: true,
	tsconfig: `tsconfig.json`,
	clean: true,
	outDir: `dist`,
	entry: {
		"main/index": `src/main/index.ts`,
		...otherEntries,
	},
})
export default config
