import { createEnv } from "@t3-oss/env-core"
import { type } from "arktype"

export const env = createEnv({
	server: { FLIGHTDECK_SECRET: type(`string`, `|`, `undefined`) },
	clientPrefix: `NEVER`,
	client: {},
	runtimeEnv: import.meta.env as Record<string, string>,
	emptyStringAsUndefined: true,
})
