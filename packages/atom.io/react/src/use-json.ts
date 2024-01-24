import type {
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableToken,
} from "atom.io"
import { findInStore, getJsonToken } from "atom.io/internal"
import type { Json } from "atom.io/json"
import * as React from "react"

import { StoreContext } from "./store-context"
import { useO } from "./use-o"

export function useJSON<Serializable extends Json.Serializable>(
	token: MutableAtomToken<any, Serializable>,
): Serializable

export function useJSON<
	Serializable extends Json.Serializable,
	Key extends Json.Serializable,
>(token: MutableAtomFamilyToken<any, Serializable, Key>, key: Key): Serializable

export function useJSON<
	Serializable extends Json.Serializable,
	Key extends Serializable,
>(
	token:
		| MutableAtomFamilyToken<any, Serializable, Key>
		| MutableAtomToken<any, Serializable>,
	key?: Key,
): Serializable {
	const store = React.useContext(StoreContext)
	const stateToken: ReadableToken<any> =
		token.type === `mutable_atom_family`
			? findInStore(token, key as Key, store)
			: token
	const jsonToken = getJsonToken(stateToken)
	return useO(jsonToken)
}
