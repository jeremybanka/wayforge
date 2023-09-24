import * as AtomIO from "atom.io"
import { getJsonToken, getUpdateToken } from "atom.io/internal"
import type { Json } from "atom.io/json"

import type { Transceiver } from "~/packages/anvl/reactivity/transceiver"

import type { ServerConfig } from ".."

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const useExposeMutable = ({ socket, store }: ServerConfig) => {
	return function exposeMutable<
		Core extends Transceiver<Json.Serializable>,
		SerializableCore extends Json.Serializable,
	>(token: AtomIO.MutableAtomToken<Core, SerializableCore>): () => void {
		let unsubscribeFromStateUpdates: (() => void) | null = null

		const jsonToken = getJsonToken(token)
		const trackerToken = getUpdateToken(token)

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
