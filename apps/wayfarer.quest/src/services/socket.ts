import { io } from "socket.io-client"

import { env } from "./env"

export const SOCKET =
	typeof window === `undefined`
		? null
		: io(env.NEXT_PUBLIC_REMOTE_ORIGIN, {
				auth: {
					token: `test`,
					username: `test_user`,
				},
		  })
