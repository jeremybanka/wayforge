import { createEnv } from "@t3-oss/env-core"
import { type } from "arktype"

export const BUILDING_WITH_VITE = `__vite_start_time` in globalThis
export const HAS_WINDOW = typeof window !== `undefined`
export const IS_SERVER = !BUILDING_WITH_VITE && !HAS_WINDOW
export const IS_TEST = `vitest` in globalThis

const str = type(`string`)
const requiredBool = type(`"true" | "false"`).pipe((s) => s === `true`)
const optionalBool = type(`"true" | "false" | undefined`).pipe(
	(s) => s === `true`,
)

export const env = createEnv({
	isServer: IS_SERVER,

	server: {
		ROOT_USERNAME: str,
		CI: type(`string | undefined`).pipe(Boolean),
		POSTGRES_USER: str,
		POSTGRES_PASSWORD: str,
		POSTGRES_DATABASE: str,
		POSTGRES_HOST: str,
		POSTGRES_PORT: str.pipe((s) => Number.parseInt(s, 10)),
		BACKEND_PORT: str.pipe((s) => Number.parseInt(s, 10)),
		RUN_WORKERS_FROM_SOURCE: optionalBool,
		FRONTEND_PORT: str.pipe((s) => Number.parseInt(s, 10)),
		FRONTEND_ORIGINS: str.pipe.try((s) => JSON.parse(s), type(`string[]`)),
		API_KEY_OPENAI: type(`string | undefined`),
		API_KEY_RESEND: type(`string | undefined`),
	},

	/**
	 * The prefix that client-side variables must have. This is enforced both at
	 * a type-level and at runtime.
	 */
	clientPrefix: `VITE_`,

	client: {
		VITE_HIDE_DEVTOOLS: requiredBool,
		VITE_BACKEND_ORIGIN: str,
		VITE_DEV_FRONTEND_HOST: type(`string | undefined`),
		VITE_DEV_HTTPS: optionalBool,
	},

	/**
	 * What object holds the environment variables at runtime. This is usually
	 * `process.env` or `import.meta.env`.
	 */
	runtimeEnv: import.meta.env,

	/**
	 * By default, this library will feed the environment variables directly to
	 * the Zod validator.
	 *
	 * This means that if you have an empty string for a value that is supposed
	 * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
	 * it as a type mismatch violation. Additionally, if you have an empty string
	 * for a value that is supposed to be a string with a default value (e.g.
	 * `DOMAIN=` in an ".env" file), the default value will never be applied.
	 *
	 * In order to solve these issues, we recommend that all new projects
	 * explicitly specify this option as true.
	 */
	emptyStringAsUndefined: true,
})
