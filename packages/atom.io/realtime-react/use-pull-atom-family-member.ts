import type * as AtomIO from "atom.io"
import { findInStore } from "atom.io/internal"
import type { Canonical, Json } from "atom.io/json"
import { StoreContext, useO } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function usePullAtomFamilyMember<
	J extends Json.Serializable,
	K extends Canonical,
	Key extends K,
>(family: AtomIO.RegularAtomFamilyToken<J, K>, subKey: Key): J {
	const store = React.useContext(StoreContext)
	const token = findInStore(store, family, subKey)
	useRealtimeService(`pull:${token.key}`, (socket) =>
		RTC.pullAtomFamilyMember(store, socket, token),
	)
	return useO(token)
}
