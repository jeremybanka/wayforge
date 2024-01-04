import type * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import { StoreContext } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { RealtimeContext } from "./realtime-context"

export function usePull<J extends Json.Serializable>(
	token: AtomIO.WritableToken<J>,
): void {
	const { socket } = React.useContext(RealtimeContext)
	const store = React.useContext(StoreContext)
	React.useEffect(() => {
		if (socket) {
			return RTC.pullState(token, socket, store)
		}
	}, [token.key, socket])
}
