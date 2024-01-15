import * as AtomIO from "atom.io"

export const updateQueueAtoms = AtomIO.atomFamily<
	AtomIO.TransactionUpdate<any>[],
	AtomIO.TransactionToken<any>
>({
	key: `updateQueue`,
	default: [],
})
