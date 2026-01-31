import { createTRPCClient, httpBatchLink } from "@trpc/client"

import type { AppRouter } from "../../backend/trpc-app-router"
import { env } from "../../library/env"

export const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: env.VITE_BACKEND_ORIGIN,
			fetch(input, init) {
				if (init) {
					Object.assign(init, { credentials: `include` })
					return fetch(input, init as RequestInit)
				}
				return fetch(input)
			},
		}),
	],
})
