import { createTRPCClient, httpBatchLink } from "@trpc/client"
import { getState } from "atom.io"

import type { AppRouter } from "../../backend/router"
import { env } from "../../library/env"
import { authAtom } from "./socket-auth-service"

export const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: env.VITE_BACKEND_ORIGIN,
			headers() {
				const auth = getState(authAtom)
				if (!auth) {
					return {}
				}
				const { userId, sessionKey } = auth
				return {
					Authorization: `${userId} ${sessionKey}`,
				}
			},
		}),
	],
})
