import * as AtomIO from "atom.io"
import { type Json, parseJson } from "atom.io/json"
import { StoreContext } from "atom.io/react"
import * as React from "react"
import type { Socket } from "socket.io-client"

import { RealtimeContext } from "./realtime-context"

export function pullFamilyMember<J extends Json.Serializable>(
	token: AtomIO.AtomToken<J>,
	socket: Socket,
	store: AtomIO.Store,
): () => void {
	if (!(`family` in token)) {
		console.error(`Token is not a family member:`, token)
		return () => {}
	}
	const { key: familyKey, subKey: serializedSubKey } = token.family
	const subKey = parseJson(serializedSubKey)
	socket?.on(`serve:${token.key}`, (data: J) => {
		AtomIO.setState(token, data, store)
	})
	socket?.emit(`sub:${familyKey}`, subKey)
	return () => {
		socket?.off(`serve:${token.key}`)
		socket?.emit(`unsub:${token.key}`)
	}
}

export function usePullFamilyMember<J extends Json.Serializable>(
	token: AtomIO.AtomToken<J>,
): void {
	const { socket } = React.useContext(RealtimeContext)
	const store = React.useContext(StoreContext)
	React.useEffect(() => pullFamilyMember(token, socket, store), [token.key])
}
