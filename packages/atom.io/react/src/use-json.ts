import type {
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableToken,
} from "atom.io"
import { findInStore, getJsonToken } from "atom.io/internal"
import type { Canonical, Json } from "atom.io/json"
import * as React from "react"

import { StoreContext } from "./store-context"
import { useO } from "./use-o"

export function useJSON<Serializable extends Json.Serializable>(
	token: MutableAtomToken<any, Serializable>,
): Serializable

export function useJSON<
	Serializable extends Json.Serializable,
	Key extends Canonical,
>(token: MutableAtomFamilyToken<any, Serializable, Key>, key: Key): Serializable

export function useJSON<
	Serializable extends Json.Serializable,
	Key extends Canonical,
>(
	token:
		| MutableAtomFamilyToken<any, Serializable, Key>
		| MutableAtomToken<any, Serializable>,
	key?: Key,
): Serializable {
	const store = React.useContext(StoreContext)
	const stateToken: ReadableToken<any> =
		token.type === `mutable_atom_family`
			? findInStore(store, token, key as Key)
			: token
	const jsonToken = getJsonToken(store, stateToken)
	return useO(jsonToken)
}
