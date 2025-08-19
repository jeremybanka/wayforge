import * as AtomIO from "atom.io"

export const optimisticUpdateQueue: AtomIO.RegularAtomToken<
	AtomIO.TransactionOutcomeEvent<any>[]
> = AtomIO.atom<AtomIO.TransactionOutcomeEvent<any>[]>({
	key: `updateQueue`,
	default: () => [],
})

export const confirmedUpdateQueue: AtomIO.RegularAtomToken<
	AtomIO.TransactionOutcomeEvent<any>[]
> = AtomIO.atom<AtomIO.TransactionOutcomeEvent<any>[]>({
	key: `serverConfirmedUpdateQueue`,
	default: () => [],
})
