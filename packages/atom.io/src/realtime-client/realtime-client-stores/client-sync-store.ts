import * as AtomIO from "atom.io"

export const optimisticUpdateQueue: AtomIO.RegularAtomToken<
	AtomIO.TransactionUpdate<any>[]
> = AtomIO.atom<AtomIO.TransactionUpdate<any>[]>({
	key: `updateQueue`,
	default: [],
})

export const confirmedUpdateQueue: AtomIO.RegularAtomToken<
	AtomIO.TransactionUpdate<any>[]
> = AtomIO.atom<AtomIO.TransactionUpdate<any>[]>({
	key: `serverConfirmedUpdateQueue`,
	default: [],
})
