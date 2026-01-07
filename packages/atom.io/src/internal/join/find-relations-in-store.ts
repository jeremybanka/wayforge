import type { JoinStates, JoinToken } from "atom.io"

import { capitalize } from "../capitalize"
import { findInStore } from "../families"
import type { Store } from "../store"
import { getJoin } from "./get-join"

export function findRelationsInStore<
	AName extends string,
	A extends string,
	BName extends string,
	B extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	store: Store,
	token: JoinToken<AName, A, BName, B, Cardinality>,
	key: A | B,
): JoinStates<AName, A, BName, B, Cardinality> {
	const myJoin = getJoin(store, token)
	let relations: JoinStates<AName, A, BName, B, Cardinality>
	switch (token.cardinality satisfies `1:1` | `1:n` | `n:n`) {
		case `1:1`: {
			const keyAB = `${token.a}KeyOf${capitalize(token.b)}`
			const keyBA = `${token.b}KeyOf${capitalize(token.a)}`
			relations = {
				get [keyAB]() {
					// @ts-expect-error way too complicated to represent
					const familyAB = myJoin.states[keyAB as any]
					const state = findInStore(store, familyAB, key)
					return state
				},
				get [keyBA]() {
					// @ts-expect-error way too complicated to represent
					const familyBA = myJoin.states[keyBA as any]
					const state = findInStore(store, familyBA, key)
					return state
				},
			} as JoinStates<AName, A, BName, B, Cardinality>
			break
		}
		case `1:n`: {
			const keyAB = `${token.a}KeyOf${capitalize(token.b)}`
			const keysBA = `${token.b}KeysOf${capitalize(token.a)}`
			relations = {
				get [keyAB]() {
					// @ts-expect-error way too complicated to represent
					const familyAB = myJoin.states[keyAB as any]
					const state = findInStore(store, familyAB, key)
					return state
				},
				get [keysBA]() {
					// @ts-expect-error way too complicated to represent
					const familyBA = myJoin.states[keysBA as any]
					const state = findInStore(store, familyBA, key)
					return state
				},
			} as JoinStates<AName, A, BName, B, Cardinality>
			break
		}
		case `n:n`: {
			const keysAB = `${token.a}KeysOf${capitalize(token.b)}`
			const keysBA = `${token.b}KeysOf${capitalize(token.a)}`
			relations = {
				get [keysAB]() {
					// @ts-expect-error way too complicated to represent
					const familyAB = myJoin.states[keysAB as any]
					const state = findInStore(store, familyAB, key)
					return state
				},
				get [keysBA]() {
					// @ts-expect-error way too complicated to represent
					const familyBA = myJoin.states[keysBA as any]
					const state = findInStore(store, familyBA, key)
					return state
				},
			} as JoinStates<AName, A, BName, B, Cardinality>
		}
	}
	return relations
}
