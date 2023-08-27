import * as AtomIO from "atom.io"
import { StoreContext } from "atom.io/react"
import * as React from "react"

import { RealtimeContext } from "./realtime-context"

const TX_SUBS = new Map<string, number>()
export function useServerAction<ƒ extends AtomIO.ƒn>(
	token: AtomIO.TransactionToken<ƒ>,
): (...parameters: Parameters<ƒ>) => ReturnType<ƒ> {
	const store = React.useContext(StoreContext)
	const { socket } = React.useContext(RealtimeContext)
	React.useEffect(() => {
		const count = TX_SUBS.get(token.key) ?? 0
		TX_SUBS.set(token.key, count + 1)
		const unsubscribe =
			count === 0
				? AtomIO.subscribeToTransaction(
						token,
						(update) => socket.emit(`tx:${token.key}`, update),
						`use-server-action`,
						store,
				  )
				: () => null
		return () => {
			const newCount = TX_SUBS.get(token.key) ?? 0
			TX_SUBS.set(token.key, newCount - 1)
			unsubscribe()
		}
	}, [token.key])
	return AtomIO.runTransaction(token, store)
}
