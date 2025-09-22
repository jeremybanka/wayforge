import type { JoinStates, JoinToken } from "atom.io"

import { capitalize } from "../capitalize"
import { findInStore } from "../families"
import type { RootStore } from "../transaction"
import { getJoin } from "./get-join"

export function findRelationsInStore<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	token: JoinToken<ASide, AType, BSide, BType, Cardinality>,
	key: AType | BType,
	store: RootStore,
): JoinStates<ASide, AType, BSide, BType, Cardinality> {
	const myJoin = getJoin(token, store)
	let relations: JoinStates<ASide, AType, BSide, BType, Cardinality>
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
			} as JoinStates<ASide, AType, BSide, BType, Cardinality>
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
			} as JoinStates<ASide, AType, BSide, BType, Cardinality>
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
			} as JoinStates<ASide, AType, BSide, BType, Cardinality>
		}
	}
	return relations
}
