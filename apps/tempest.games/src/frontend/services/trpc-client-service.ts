import { createTRPCClient, httpBatchLink } from "@trpc/client"

import type { AppRouter } from "../../backend.bun"

export const trpc = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `https://localhost:4444`,
		}),
	],
})
