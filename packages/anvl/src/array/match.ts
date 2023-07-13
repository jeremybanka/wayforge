export const matchAdjacentPairs = <T, RETURN>(
	items: T[],
	processor: (a: T, b: T, aIdx: number, bIdx: number, items: T[]) => RETURN,
): RETURN[] => {
	const result: RETURN[] = []
	for (let i = 0; i < items.length; i++) {
		const itemB = items[i + 1] ?? items[0]
		const itemA = items[i]
		result.push(processor(itemA, itemB, i, i + 1, items))
	}
	return result
}

export const matchAllPairs = <ARG, RETURN = ARG>(
	callback: (el1: ARG, el2: ARG) => RETURN,
	elements1: ARG[],
	elements2: ARG[],
): RETURN[] =>
	elements1.reduce<RETURN[]>(
		(acc, element1) => [
			...acc,
			...elements2.map((element2) => callback(element1, element2)),
		],
		[],
	)
