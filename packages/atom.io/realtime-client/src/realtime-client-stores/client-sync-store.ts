import * as AtomIO from "atom.io"

export const optimisticUpdateQueue = AtomIO.atom<
	AtomIO.TransactionUpdate<any>[]
>({
	key: `updateQueue`,
	default: [],
})

export const confirmedUpdateQueue = AtomIO.atom<AtomIO.TransactionUpdate<any>[]>(
	{
		key: `serverConfirmedUpdateQueue`,
		default: [],
	},
)
