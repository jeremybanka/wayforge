import * as AtomIO from "atom.io"

export const optimisticUpdateQueueState = AtomIO.atom<
	AtomIO.TransactionUpdate<any>[]
>({
	key: `updateQueue`,
	default: [],
})

export const serverConfirmedUpdateQueueState = AtomIO.atom<
	AtomIO.TransactionUpdate<any>[]
>({
	key: `serverConfirmedUpdateQueue`,
	default: [],
})
