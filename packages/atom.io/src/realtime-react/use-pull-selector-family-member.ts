import type * as AtomIO from "atom.io"
import { findInStore } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { StoreContext, useO } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function usePullSelectorFamilyMember<T, K extends Canonical>(
	familyToken: AtomIO.SelectorFamilyToken<T, K>,
	key: NoInfer<K>,
): AtomIO.ViewOf<T> {
	const store = React.useContext(StoreContext)
	const token = findInStore(store, familyToken, key)
	useRealtimeService(`pull:${token.key}`, (socket) =>
		RTC.pullSelectorFamilyMember(store, socket, familyToken, key),
	)
	return useO(token)
}
