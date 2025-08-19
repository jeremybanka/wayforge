import * as V from "../src/venerate.ts"

// Helper: turn any iterable into an array (consumes it)
const arr = <T>(iterable: Iterable<T>) => Array.from(iterable)

// Helper: generator from array to verify functions accept generic iterables
function* gen<T>(xs: T[]) {
	for (const x of xs) yield x
}

describe(`isSet`, () => {
	it(`returns true for Set instances`, () => {
		expect(V.isSet(new Set())).toBe(true)
	})

	it(`returns true for Set extensions`, () => {
		class MySpecialSet extends Set {}
		expect(V.isSet(new MySpecialSet())).toBe(true)
	})

	it(`returns false for non-Set values`, () => {
		expect(V.isSet(null)).toBe(false)
		expect(V.isSet(undefined)).toBe(false)
		expect(V.isSet(123)).toBe(false)
		expect(V.isSet(`hello`)).toBe(false)
		expect(V.isSet([])).toBe(false)
		expect(V.isSet({})).toBe(false)
	})
})

describe(`toSet`, () => {
	it(`wraps non-Set iterables`, () => {
		const s = V.toSet([1, 2, 2, 3])
		expect(s).instanceOf(Set)
		expect([...s]).toEqual([1, 2, 3])
	})

	it(`returns the same instance when given a Set`, () => {
		const original = new Set([1, 2, 3])
		const result = V.toSet(original)
		expect(result).toBe(original)
	})

	it(`works with generic iterables (generators)`, () => {
		const s = V.toSet(gen([`a`, `b`, `a`]))
		expect([...s]).toEqual([`a`, `b`])
	})
})

describe(`unionIter`, () => {
	it(`unions across multiple iterables preserving first-seen order`, () => {
		const u = V.union([1, 2, 2, 3], [3, 4], gen([4, 5, 1]))
		expect(arr(u)).toEqual([1, 2, 3, 4, 5])
	})

	it(`handles empty inputs`, () => {
		expect(arr(V.union([]))).toEqual([])
		expect(arr(V.union([], [], []))).toEqual([])
	})
})

describe(`differenceIter`, () => {
	it(`A \\ (B ∪ C ...) removes all items present in others, preserves A order/dupes`, () => {
		const out = V.difference([1, 2, 2, 3, 4], [2, 3], gen([5, 6]))
		expect(arr(out)).toEqual([1, 4])
	})

	it(`with no rest, yields A as-is (including duplicates)`, () => {
		const out = V.difference([1, 1, 2])
		expect(arr(out)).toEqual([1, 1, 2])
	})

	it(`handles empty A`, () => {
		const out = V.difference([], [1, 2, 3])
		expect(arr(out)).toEqual([])
	})
})

describe(`intersectionIter`, () => {
	it(`intersects with multiple sets, streaming only the first iterable`, () => {
		const out = V.intersection(
			[1, 2, 2, 3, 4],
			new Set([2, 3, 5]),
			gen([0, 2, 3, 7]),
		)
		// duplicates in A that are present in all others are preserved
		expect(arr(out)).toEqual([2, 2, 3])
	})

	it(`with no rest, yields a shallow copy of A (including duplicates)`, () => {
		const a = gen([`x`, `y`, `y`])
		expect(arr(V.intersection(a))).toEqual([`x`, `y`, `y`])
	})

	it(`empty intersection when nothing in common`, () => {
		const out = V.intersection([1, 2], [3, 4])
		expect(arr(out)).toEqual([])
	})
})

describe(`symmetricDifferenceIter (pairwise)`, () => {
	it(`yields items unique to A then unique to B; duplicates are collapsed (set semantics)`, () => {
		const out = V.symmetricDifference([1, 1, 2, 3], [3, 4, 4, 5])
		// Unique to A: 1,2 (in A’s insertion order for uniques)
		// Unique to B: 4,5 (in B’s insertion order for uniques)
		expect(arr(out)).toEqual([1, 2, 4, 5])
	})

	it(`empty when equal sets (ignores order and duplicates)`, () => {
		const out = V.symmetricDifference([1, 2, 2], [2, 1])
		expect(arr(out)).toEqual([])
	})

	it(`works with generic iterables`, () => {
		const out = V.symmetricDifference(gen([`a`, `b`, `c`]), gen([`b`, `d`]))
		expect(arr(out)).toEqual([`a`, `c`, `d`])
	})
})

describe(`symmetricDifferenceVariadicIter`, () => {
	it(`folds pairwise symmetric difference across many iterables`, () => {
		// Elements appearing an odd number of times should remain.
		// A: 1,2,3
		// B: 2,3,4
		// C: 3,4,5
		// Counts: 1(1),2(2),3(3),4(2),5(1) -> keep 1,3,5
		const out = V.symmetricDifferenceVariadic(
			[1, 2, 3],
			[2, 3, 4],
			gen([3, 4, 5]),
		)
		expect(arr(out)).toEqual([1, 3, 5])
	})

	it(`handles single iterable (passes through, but with set semantics due to pairwise fold identity)`, () => {
		// Implementation reduces starting from 'first' without changing it if rest is empty.
		const out = V.symmetricDifferenceVariadic([1, 1, 2])
		// returns the original iterable as-is (no fold performed)
		expect(arr(out)).toEqual([1, 1, 2])
	})

	it(`handles many with duplicates and order expectations`, () => {
		const out = V.symmetricDifferenceVariadic(
			[1, 1, 2, 3],
			[2, 4],
			[3, 4, 5],
			gen([5, 6, 1]),
		)
		// Step1: SD([1,1,2,3],[2,4]) -> [1,3,4] (set semantics inside SD)
		// Step2: SD([1,3,4],[3,4,5]) -> [1,5]
		// Step3: SD([1,5],[5,6,1]) -> [6]
		expect(arr(out)).toEqual([6])
	})
})

describe(`isSubset / isSuperset`, () => {
	it(`isSubset true/false with duplicates ignored`, () => {
		expect(V.isSubset([1, 1, 2], [2, 1, 3])).toBe(true)
		expect(V.isSubset([1, 4], [1, 2, 3])).toBe(false)
	})

	it(`isSuperset mirrors isSubset`, () => {
		expect(V.isSuperset([1, 2, 3], [2, 1])).toBe(true)
		expect(V.isSuperset([1, 2], [1, 2, 3])).toBe(false)
	})
})

describe(`isDisjoint`, () => {
	it(`true when no common elements`, () => {
		expect(V.isDisjoint([1, 2, 3], [4])).toBe(true)
		expect(V.isDisjoint([1], [2, 3, 4])).toBe(true)
	})

	it(`false when there is at least one common element`, () => {
		expect(V.isDisjoint(gen([`a`, `b`]), new Set([`c`, `b`]))).toBe(false)
	})

	it(`handles empty sets`, () => {
		expect(V.isDisjoint([], [])).toBe(true)
		expect(V.isDisjoint([], [1])).toBe(true)
	})
})

describe(`equals`, () => {
	it(`true when same elements regardless of order and duplicates`, () => {
		expect(V.equals([1, 2, 2, 3], [3, 2, 1])).toBe(true)
	})

	it(`false when sizes differ after deduplication`, () => {
		expect(V.equals([1, 2], [1, 2, 3])).toBe(false)
	})

	it(`false when an element differs`, () => {
		expect(V.equals([`x`, `y`], [`x`, `z`])).toBe(false)
	})
})
