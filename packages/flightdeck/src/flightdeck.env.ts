import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	server: { FLIGHTDECK_SECRET: z.string() },
	clientPrefix: `NEVER`,
	client: {},
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
})
