import type { AtomToken, Write } from "atom.io"

export * from "./AtomIOExplorer"

export type AtomicIndexOptions = {
	indexAtom: AtomToken<Set<string>>
	id: string
}

export const addToIndex: Write<(options: AtomicIndexOptions) => void> = (
	{ set },
	{ indexAtom, id },
): void => set(indexAtom, (currentSet) => new Set(currentSet).add(id))

export const removeFromIndex: Write<(options: AtomicIndexOptions) => void> = (
	{ set },
	{ indexAtom, id },
): void =>
	set(indexAtom, (currentSet) => {
		const newSet = new Set(currentSet)
		newSet.delete(id)
		return newSet
	})
