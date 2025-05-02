import type * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import { StoreContext, useO } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function usePullAtom<J extends Json.Serializable>(
	token: AtomIO.RegularAtomToken<J>,
): J {
	const store = React.useContext(StoreContext)
	useRealtimeService(`pull:${token.key}`, (socket) =>
		RTC.pullAtom(store, socket, token),
	)
	return useO(token)
}
