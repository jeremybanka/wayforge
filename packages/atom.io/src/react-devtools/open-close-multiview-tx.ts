import type { TransactionToken } from "atom.io"
import { transaction } from "atom.io"

export const openCloseAllTX: TransactionToken<(node: string) => void> =
	transaction<(node: string) => void>({
		key: `openCloseMultiview`,
		do: ({ env }, param) => {
			console.log(param)
			console.log(env().store.valueMap)
		},
	})
