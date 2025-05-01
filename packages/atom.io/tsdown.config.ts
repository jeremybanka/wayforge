import type { Options, UserConfig } from "tsdown"
import { defineConfig } from "tsdown"

import discoverSubmodules from "./__scripts__/discover-submodules.ts"
import { fromEntries } from "./json/src/entries.ts"

const SUBMODULE_NAMES = discoverSubmodules()

const SUBMODULE_NAMES_PREFIXED = [
	`atom.io`,
	...SUBMODULE_NAMES.map((submodule) => `atom.io/${submodule}`),
]

export const BASE_OPTIONS: Options = {
	external: SUBMODULE_NAMES_PREFIXED,
	format: [`esm`],
	sourcemap: false,
	treeshake: true,
	tsconfig: `tsconfig.json`,
}

const otherEntries = fromEntries(
	SUBMODULE_NAMES.map(
		(name) =>
			[name === `react` ? `TEST` : name, `${name}/src/index.ts`] as const,
	),
)

console.log({ SUBMODULE_NAMES, otherEntries })

export const JS_OPTIONS: Options = {
	...BASE_OPTIONS,
	clean: true,
	outDir: `dist`,
	entry: {
		atom: `src/index.ts`,
		...otherEntries,
	},
}

// export const DTS_OPTIONS: Options = {
// 	...BASE_OPTIONS,
// 	dts: { only: true },
// 	format: [`esm`],
// 	entry: [`src/index.ts`],
// 	metafile: false,
// 	outDir: `dist`,
// }

const config: UserConfig = defineConfig(JS_OPTIONS)
export default config
