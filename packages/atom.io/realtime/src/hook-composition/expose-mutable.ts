import * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import type { MutableAtomToken } from "atom.io/mutable"
import { getJsonToken, getTrackerToken } from "atom.io/mutable"

import type { Transceiver } from "~/packages/anvl/reactivity/transceiver"

import type { ServerConfig } from ".."

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const useExposeMutable = ({ socket, store }: ServerConfig) => {
	return function exposeMutable<
		Core extends Transceiver<Json.Serializable>,
		SerializableCore extends Json.Serializable,
	>(token: MutableAtomToken<Core, SerializableCore>): () => void {
		let unsubscribeFromStateUpdates: (() => void) | null = null

		const jsonToken = getJsonToken(token)
		const trackerToken = getTrackerToken(token)

		const fillUnsubRequest = () => {
			socket.off(`unsub:${token.key}`, fillUnsubRequest)
			unsubscribeFromStateUpdates?.()
			unsubscribeFromStateUpdates = null
		}

		const fillSubRequest = () => {
			socket.emit(`init:${token.key}`, AtomIO.getState(jsonToken, store))
			unsubscribeFromStateUpdates = AtomIO.subscribe(
				trackerToken,
				({ newValue }) => {
					socket.emit(`next:${token.key}`, newValue)
				},
				`expose-single:${socket.id}`,
				store,
			)
			socket.on(`unsub:${token.key}`, fillUnsubRequest)
		}

		socket.on(`sub:${token.key}`, fillSubRequest)

		return () => {
			socket.off(`sub:${token.key}`, fillSubRequest)
			unsubscribeFromStateUpdates?.()
		}
	}
}
