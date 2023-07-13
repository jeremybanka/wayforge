import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	runtimeEnvStrict: {
		VITE_REMOTE_ORIGIN: import.meta.env.VITE_REMOTE_ORIGIN,
		// CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
	},
	clientPrefix: `VITE_`,
	client: {
		VITE_REMOTE_ORIGIN: z.string().url(),
	},
	server: {
		// CLIENT_ORIGIN: z.string().url(),
	},
})
