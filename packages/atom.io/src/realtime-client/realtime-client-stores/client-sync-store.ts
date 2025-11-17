import * as AtomIO from "atom.io"

export const optimisticUpdateQueueAtom: AtomIO.RegularAtomToken<
	AtomIO.TransactionOutcomeEvent<any>[]
> = AtomIO.atom<AtomIO.TransactionOutcomeEvent<any>[]>({
	key: `optimisticUpdateQueue`,
	default: () => [],
})

export const confirmedUpdateQueueAtom: AtomIO.RegularAtomToken<
	AtomIO.TransactionOutcomeEvent<any>[]
> = AtomIO.atom<AtomIO.TransactionOutcomeEvent<any>[]>({
	key: `confirmedUpdateQueue`,
	default: () => [],
})
