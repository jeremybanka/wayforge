import { editRelations } from "atom.io/data"
import { parseJson, stringifyJson } from "atom.io/json"

import type { TransactionRequestActual } from "~/packages/atom.io/realtime-server/src/realtime-server-stores/realtime-occlusion-store"
import {
	derefTransactionRequest,
	perspectiveAliases,
} from "~/packages/atom.io/realtime-server/src/realtime-server-stores/realtime-occlusion-store"

describe(`realtime occlusion`, () => {
	it(`dereferences transaction updates`, () => {
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
})
