/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/consistent-type-imports */

export let ark: typeof import("arktype") | undefined
export let zod: typeof import("zod") | undefined
try {
	ark = await import(`arktype`)
} catch (_) {}
try {
	zod = await import(`zod`)
} catch (_) {}
export const schemaPkg: typeof import("arktype") | typeof import("zod") =
	ark ?? zod!
