import { setState } from "atom.io"
import type { StateToken } from "atom.io"
import type { Json } from "atom.io/json"

import type { ServerConfig } from ".."

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const useReceiveState = ({ socket, store }: ServerConfig) => {
	return function receiveState<J extends Json.Serializable>(
		token: StateToken<J>,
	): () => void {
		const publish = (newValue: J) => setState(token, newValue, store)

		const fillPubUnclaim = () => {
			socket.off(`pub:${token.key}`, publish)
			socket.off(`unclaim:${token.key}`, fillPubUnclaim)
		}
		const fillPubClaim = () => {
			socket.on(`pub:${token.key}`, publish)
			socket.on(`unclaim:${token.key}`, fillPubUnclaim)
		}

		socket.on(`claim:${token.key}`, fillPubClaim)

		return () => {
			socket.off(`claim:${token.key}`, fillPubClaim)
			socket.off(`pub:${token.key}`, publish)
		}
	}
}
