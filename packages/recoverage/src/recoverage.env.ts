import { createEnv } from "@t3-oss/env-core"
import { $ } from "bun"
import { z } from "zod"

export const env = createEnv({
	server: {
		R2_ACCESS_KEY_ID: z.string().optional(),
		R2_SECRET_ACCESS_KEY: z.string().optional(),
		R2_TOKEN_VALUE: z.string().optional(),
		R2_URL: z.string().optional(),
		RECOVERAGE_CLOUD_TOKEN: z.string().optional(),
		RECOVERAGE_CLOUD_URL: z.string().optional(),
		CI: z
			.string()
			.optional()
			.transform((v) => Boolean(v) && v !== `false` && v !== `0`),
	},
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
})
