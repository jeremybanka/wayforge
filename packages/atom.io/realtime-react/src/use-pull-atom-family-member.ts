import type * as AtomIO from "atom.io"
import { findInStore } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { StoreContext, useO } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function usePullAtomFamilyMember<
	J extends Json.Serializable,
	K extends Json.Serializable,
	Key extends K,
>(family: AtomIO.RegularAtomFamilyToken<J, K>, subKey: Key): J {
	const store = React.useContext(StoreContext)
	const token = findInStore(family, subKey, store)
	useRealtimeService(`pull:${token.key}`, (socket) =>
		RTC.pullAtomFamilyMember(token, socket, store),
	)
	return useO(token)
}
