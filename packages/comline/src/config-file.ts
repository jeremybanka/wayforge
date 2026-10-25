import { readFileSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { extname, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { types } from "node:util"

function isModulePath(absolutePath: string): boolean {
	return [`.ts`, `.mts`, `.cts`, `.js`, `.mjs`, `.cjs`].includes(
		extname(absolutePath),
	)
}

/** Load modules with the host runtime, preserving Comline's synchronous API. */
export function readConfigFile(configPath: string): unknown {
	const absolutePath = resolve(configPath)
	if (!isModulePath(absolutePath)) {
		return JSON.parse(readFileSync(absolutePath, `utf-8`))
	}
	try {
		const configModule: unknown = createRequire(absolutePath)(absolutePath)
		return types.isModuleNamespaceObject(configModule)
			? (configModule as { default?: unknown }).default
			: configModule
	} catch (cause) {
		if (
			cause &&
			typeof cause === `object` &&
			`code` in cause &&
			cause.code === `ERR_REQUIRE_ASYNC_MODULE`
		) {
			throw new Error(
				`Configuration "${configPath}" requires asynchronous module loading. Use await parse.async(argv) instead.`,
				{ cause },
			)
		}
		throw cause
	}
}

/** Keep the export boxed so async return-value assimilation cannot unwrap it. */
export async function readConfigFileAsync(
	configPath: string,
): Promise<{ value: unknown }> {
	const absolutePath = resolve(configPath)
	if (isModulePath(absolutePath)) {
		const configModule = await import(pathToFileURL(absolutePath).href)
		return { value: configModule.default }
	}
	return { value: JSON.parse(await readFile(absolutePath, `utf-8`)) }
}
