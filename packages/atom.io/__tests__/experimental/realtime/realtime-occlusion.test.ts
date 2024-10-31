import type { Compound, TransactionUpdate } from "atom.io"
import { atomFamily, selectorFamily } from "atom.io"
import { editRelations } from "atom.io/data"
import { IMPLICIT } from "atom.io/internal"
import { parseJson, stringifyJson } from "atom.io/json"
import { continuity } from "atom.io/realtime"
import type {
	Actual,
	TransactionRequestActual,
	UserKey,
	VisibilityCondition,
} from "atom.io/realtime-server"
import {
	derefTransactionRequest,
	perspectiveAliases,
	view,
} from "atom.io/realtime-server"

import { aliasTransactionUpdate } from "~/packages/atom.io/realtime-server/src/continuity/subscribe-to-continuity-actions"

describe(`realtime occlusion`, () => {
	it(`dereferences transaction requests with aliases`, () => {
		const update = {
			id: `123`,
			key: `myTransaction`,
			params: [`item::$$yo$$`],
		} satisfies TransactionRequestActual

		editRelations(perspectiveAliases, (relations) => {
			relations.set({
				perspective: `T$--perspective==__hi__++user::bob`,
				alias: `$$yo$$`,
			})
		})

		const actualUpdate = derefTransactionRequest(
			`user::bob`,
			stringifyJson(update),
		)
		if (actualUpdate instanceof Error) {
			console.log(actualUpdate)
		} else {
			console.log(parseJson(actualUpdate))
		}
	})
	it(`encodes aliases into completed transaction updates`, () => {
		type ItemKey = `item::${string}`
		type ItemVisibilityKey = Compound<`view`, `${ItemKey}::${Actual}`, UserKey>
		const itemWeightAtoms = atomFamily<number, ItemKey>({
			key: `weight`,
			default: 0,
		})
		const itemWeightMasks = selectorFamily<number | `???`, ItemKey>({
			key: `weightMask`,
			get: (_) => (__) => {
				return `???`
			},
			set: (_) => (__) => {},
		})

		const itemVisibilitySelectors = selectorFamily<
			VisibilityCondition,
			ItemVisibilityKey
		>({
			key: `itemVisibility`,
			get: (_) => (__) => {
				return `masked`
			},
		})

		const {
			globalIndex: itemGlobalIndex,
			perspectiveIndices: itemPerspectiveIndices,
		} = view({
			key: `item`,
			selectors: itemVisibilitySelectors,
		})

		const itemContinuity = continuity({
			key: `item`,
			config: (group) =>
				group.add(itemPerspectiveIndices, [itemWeightAtoms, itemWeightMasks]),
		})

		const update = {
			id: `123`,
			key: `myTransaction`,
			params: [`item::__hi__`],
			updates: [
				{
					type: `atom_update`,
					key: `weight("item::__hi__)"`,
					newValue: 10,
					oldValue: 0,
					family: {
						key: `item`,
						subKey: `__hi__`,
					},
				},
			],
			type: `transaction_update`,
			epoch: 0,
			output: {},
		} satisfies TransactionUpdate<any>

		editRelations(perspectiveAliases, (relations) => {
			relations.set({
				perspective: `T$--perspective==__hi__++user::bob`,
				alias: `$$yo$$`,
			})
		})

		const actualUpdate = aliasTransactionUpdate(
			IMPLICIT.STORE,
			itemContinuity,
			`user::bob`,
			update,
		)
		if (actualUpdate instanceof Error) {
			console.log(actualUpdate)
		} else {
			console.log(actualUpdate)
		}
	})
})
