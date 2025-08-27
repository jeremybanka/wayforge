import type { JoinStates, JoinToken } from "atom.io"
import type { Json } from "atom.io/json"

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
	Content extends Json.Object | null,
>(
	token: JoinToken<ASide, AType, BSide, BType, Cardinality, Content>,
	key: AType | BType,
	store: RootStore,
): JoinStates<ASide, AType, BSide, BType, Cardinality, Content> {
	const myJoin = getJoin(token, store)
	let relations: JoinStates<ASide, AType, BSide, BType, Cardinality, Content>
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
			} as JoinStates<ASide, AType, BSide, BType, Cardinality, Content>
			const entryAB = `${token.a}EntryOf${capitalize(token.b)}`
			if (entryAB in myJoin.states) {
				const entryBA = `${token.b}EntryOf${capitalize(token.a)}`
				Object.assign(relations, {
					get [entryAB]() {
						// @ts-expect-error way too complicated to represent
						const familyAB = myJoin.states[entryAB as any]
						const state = findInStore(store, familyAB, key)
						return state
					},
					get [entryBA]() {
						// @ts-expect-error way too complicated to represent
						const familyBA = myJoin.states[entryBA as any]
						const state = findInStore(store, familyBA, key)
						return state
					},
				})
			}
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
			} as JoinStates<ASide, AType, BSide, BType, Cardinality, Content>
			const entryAB = `${token.a}EntryOf${capitalize(token.b)}`
			if (entryAB in myJoin.states) {
				const entriesBA = `${token.b}EntriesOf${capitalize(token.a)}`
				Object.assign(relations, {
					get [entryAB]() {
						// @ts-expect-error way too complicated to represent
						const familyAB = myJoin.states[entryAB as any]
						const state = findInStore(store, familyAB, key)
						return state
					},
					get [entriesBA]() {
						// @ts-expect-error way too complicated to represent
						const familyBA = myJoin.states[entriesBA as any]
						const state = findInStore(store, familyBA, key)
						return state
					},
				})
			}
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
			} as JoinStates<ASide, AType, BSide, BType, Cardinality, Content>
			const entriesAB = `${token.a}EntriesOf${capitalize(token.b)}`
			if (entriesAB in myJoin.states) {
				const entriesBA = `${token.b}EntriesOf${capitalize(token.a)}`
				Object.assign(relations, {
					get [entriesAB]() {
						// @ts-expect-error way too complicated to represent
						const familyAB = myJoin.states[entriesAB as any]
						const state = findInStore(store, familyAB, key)
						return state
					},
					get [entriesBA]() {
						// @ts-expect-error way too complicated to represent
						const familyBA = myJoin.states[entriesBA as any]
						const state = findInStore(store, familyBA, key)
						return state
					},
				})
			}
		}
	}
	return relations
}
