import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { extname, resolve } from "node:path"
import { types } from "node:util"

/** Load modules with the host runtime, preserving Comline's synchronous API. */
export function readConfigFile(configPath: string): unknown {
	const absolutePath = resolve(configPath)
	switch (extname(absolutePath)) {
		case `.ts`:
		case `.mts`:
		case `.cts`:
		case `.js`:
		case `.mjs`:
		case `.cjs`: {
			const configModule: unknown = createRequire(absolutePath)(absolutePath)
			return types.isModuleNamespaceObject(configModule)
				? (configModule as { default?: unknown }).default
				: configModule
		}
		default:
			return JSON.parse(readFileSync(absolutePath, `utf-8`))
	}
}
