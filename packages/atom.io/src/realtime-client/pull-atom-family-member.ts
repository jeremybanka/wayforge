import type * as AtomIO from "atom.io"
import { findInStore, setIntoStore, type Store } from "atom.io/internal"
import type { Canonical, Json } from "atom.io/json"
import type { Socket } from "atom.io/realtime"

export function pullAtomFamilyMember<
	J extends Json.Serializable,
	K extends Canonical,
>(
	store: Store,
	socket: Socket,
	family: AtomIO.AtomFamilyToken<J, K, any>,
	key: NoInfer<K>,
): () => void {
	const token = findInStore(store, family, key)
	const setServedValue = (data: J) => {
		setIntoStore(store, token, data)
	}
	socket?.on(`serve:${token.key}`, setServedValue)
	socket?.emit(`sub:${family.key}`, key)
	return () => {
		socket?.off(`serve:${token.key}`, setServedValue)
		socket?.emit(`unsub:${token.key}`)
	}
}
