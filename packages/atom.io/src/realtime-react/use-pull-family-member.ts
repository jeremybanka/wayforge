import * as AtomIO from "atom.io"
import * as React from "react"


import type { Json } from "~/packages/anvl/src/json"

import { RealtimeContext } from "./realtime-context"
import { StoreContext } from "../react"

export function usePullFamilyMember<J extends Json>(
	family: AtomIO.AtomFamily<J> | AtomIO.SelectorFamily<J>,
	subKey: AtomIO.Serializable,
): void {
	const token = family(subKey)
	const { socket } = React.useContext(RealtimeContext)
	const store = React.useContext(StoreContext)
	React.useEffect(() => {
		socket?.on(`serve:${token.key}`, (data: J) => {
			AtomIO.setState(family(subKey), data, store)
		})
		socket?.emit(`sub:${family.key}`, subKey)
		return () => {
			socket?.off(`serve:${token.key}`)
			socket?.emit(`unsub:${token.key}`)
		}
	}, [family.key])
}
