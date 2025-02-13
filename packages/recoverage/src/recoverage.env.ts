import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	server: {
		R2_ACCESS_KEY_ID: z.string().optional(),
		R2_SECRET_ACCESS_KEY: z.string().optional(),
		R2_TOKEN_VALUE: z.string().optional(),
		R2_URL: z.string().optional(),
	},
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
})
