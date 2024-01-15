import * as AtomIO from "atom.io"

export const optimisticUpdateQueueState = AtomIO.atom<
	AtomIO.TransactionUpdate<any>[]
>({
	key: `updateQueue`,
	default: [],
})
