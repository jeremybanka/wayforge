import { createEnv } from "@t3-oss/env-core"
import { z } from "zod/v4"

export const env = createEnv({
	server: { FLIGHTDECK_SECRET: z.string().optional() },
	clientPrefix: `NEVER`,
	client: {},
	runtimeEnv: import.meta.env as Record<string, string>,
	emptyStringAsUndefined: true,
})
