import type * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import { StoreContext } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"

import { RealtimeContext } from "./realtime-context"

export function usePullFamilyMember<J extends Json.Serializable>(
	token: AtomIO.StateToken<J>,
): void {
	const { socket } = React.useContext(RealtimeContext)
	const store = React.useContext(StoreContext)
	React.useEffect(() => RTC.pullFamilyMember(token, socket, store), [token.key])
}
