import { getState } from "atom.io"
import { myUsernameState } from "atom.io/realtime-client"
import { io } from "socket.io-client"

import { env } from "./env"

export const SOCKET =
	typeof window === `undefined` || getState(myUsernameState) === null
		? null
		: io(env.NEXT_PUBLIC_REMOTE_ORIGIN, {
				auth: {
					token: `test`,
					username: getState(myUsernameState),
				},
		  })
