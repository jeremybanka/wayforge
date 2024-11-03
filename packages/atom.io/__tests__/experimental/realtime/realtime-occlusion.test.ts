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
	aliasTransactionUpdate,
	derefTransactionRequest,
	perspectiveAliases,
	view,
} from "atom.io/realtime-server"

import { mark } from "../../__util__"

describe(`realtime occlusion`, () => {
	editRelations(perspectiveAliases, (relations) => {
		relations.set({
			perspective: `T$--perspective==__hi__++user::bob`,
			alias: `$$yo$$`,
		})
	})

	it(`dereferences transaction requests with aliases`, () => {
		mark(`start`)
		const update = {
			id: `123`,
			key: `myTransaction`,
			params: [`item::$$yo$$`],
		} satisfies TransactionRequestActual

		console.log(`aliased update`, update)

		const updateStringified = stringifyJson(update)

		mark(`update stringified`)

		const actualUpdate = derefTransactionRequest(`user::bob`, updateStringified)
		mark(`update dereferenced`)
		if (actualUpdate instanceof Error) {
			console.log(actualUpdate)
		} else {
			console.log(`actual update`, parseJson(actualUpdate))
		}
		mark(`update parsed`)
	})
	it(`encodes aliases into completed transaction updates`, () => {
		mark(`start encoding`)
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

		mark(`states created`)

		const itemContinuity = continuity({
			key: `item`,
			config: (group) =>
				group.add(itemPerspectiveIndices, [itemWeightAtoms, itemWeightMasks]),
		})

		mark(`continuity created`)

		const actualUpdate = {
			id: `123`,
			key: `myTransaction`,
			params: [`item::__hi__`],
			updates: [
				{
					type: `atom_update`,
					key: `weight("item::__hi__")`,
					newValue: 10,
					oldValue: 0,
					family: {
						key: `item`,
						subKey: `__hi__`,
					},
				},
				{
					type: `atom_update`,
					key: `*relatedKeys/characterItems("character:)`,
					newValue: `add:"__item::__"`,
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

		console.log(`actual update`, actualUpdate)

		mark(`update created`)

		const aliasedUpdate = aliasTransactionUpdate(
			IMPLICIT.STORE,
			itemContinuity,
			`user::bob`,
			actualUpdate,
		)

		mark(`update encoded`)

		console.log(`aliased update`, aliasedUpdate)
	})
})
