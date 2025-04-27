import { createTRPCClient, httpBatchLink } from "@trpc/client"

import type { AppRouter } from "../../backend/router"
import { env } from "../../library/env"

export const trpc = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: env.VITE_BACKEND_ORIGIN,
		}),
	],
})
