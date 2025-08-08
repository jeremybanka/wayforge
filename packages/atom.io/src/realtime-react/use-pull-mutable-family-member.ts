import type * as AtomIO from "atom.io"
import type { Transceiver } from "atom.io/internal"
import { findInStore } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { StoreContext, useO } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { useRealtimeService } from "./use-realtime-service"

export function usePullMutableAtomFamilyMember<
	T extends Transceiver<any, any>,
	K extends Canonical,
	Key extends K,
>(familyToken: AtomIO.MutableAtomFamilyToken<T, K>, key: Key): T {
	const store = React.useContext(StoreContext)
	const token = findInStore(store, familyToken, key)
	useRealtimeService(`pull:${token.key}`, (socket) =>
		RTC.pullMutableAtomFamilyMember(store, socket, token),
	)
	return useO(token)
}
