import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	server: {
		S3_ACCESS_KEY_ID: z.string().optional(),
		S3_BUCKET: z.string().optional(),
		S3_ENDPOINT: z.string().optional(),
		S3_SECRET_ACCESS_KEY: z.string().optional(),
		RECOVERAGE_CLOUD_TOKEN: z.string().optional(),
		RECOVERAGE_CLOUD_URL: z.string().optional(),
		CI: z
			.string()
			.optional()
			.transform((v) => Boolean(v) && v !== `false` && v !== `0`),
	},
	runtimeEnv: import.meta.env as Record<string, string>,
	emptyStringAsUndefined: true,
})

export type S3Credentials = {
	accessKeyId: string
	bucket: string
	endpoint: string
	secretAccessKey: string
}
export const S3_CREDENTIALS: S3Credentials | undefined =
	env.S3_ACCESS_KEY_ID &&
	env.S3_BUCKET &&
	env.S3_ENDPOINT &&
	env.S3_SECRET_ACCESS_KEY
		? {
				accessKeyId: env.S3_ACCESS_KEY_ID,
				bucket: env.S3_BUCKET,
				endpoint: env.S3_ENDPOINT,
				secretAccessKey: env.S3_SECRET_ACCESS_KEY,
			}
		: undefined
