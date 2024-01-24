import type * as AtomIO from "atom.io"
import { findInStore } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { StoreContext, useO } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function usePullSelectorFamilyMember<
	T,
	K extends Json.Serializable,
	Key extends K,
>(familyToken: AtomIO.SelectorFamilyToken<T, K>, key: Key): T {
	const store = React.useContext(StoreContext)
	const token = findInStore(familyToken, key, store)
	useRealtimeService(`pull:${token.key}`, (socket) =>
		RTC.pullSelectorFamilyMember(token, socket, store),
	)
	return useO(token)
}
