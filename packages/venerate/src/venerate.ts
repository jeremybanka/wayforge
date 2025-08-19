/**
 * Cross-realm-safe check for anything that extends Set.
 */
export function isSet(value: unknown): value is Set<any> {
	if (value == null) return false
	try {
		// brand check: throws TypeError unless `value` has [[SetData]]
		Set.prototype.has.call(value, Symbol.for(`@@brandCheck`))
		return true
	} catch {
		return false
	}
}

/**
 * Materializes an unknown iterable as a Set, without providing for mutation.
 * Does not copy the input if it is already a Set.
 */
export const toSet = <T>(it: Iterable<T>): ReadonlySet<T> =>
	isSet(it) ? it : new Set(it)

/**
 * Lazily yield the union of A, B, C, ... preserving first-seen order.
 * Only a small "seen" Set is maintained; inputs are streamed.
 */
export function* union<T>(...iterables: Iterable<T>[]): Iterable<T> {
	const seen = new Set<T>()
	for (const it of iterables) {
		for (const v of it) {
			if (!seen.has(v)) {
				seen.add(v)
				yield v
			}
		}
	}
}

/**
 * Lazily yield A \ (B ∪ C ∪ ...), streaming A and pre-materializing removals.
 */
export function* difference<T>(
	a: Iterable<T>,
	...rest: Iterable<T>[]
): Iterable<T> {
	if (rest.length === 0) {
		yield* a
		return
	}
	const remove = new Set<T>()
	for (const it of rest) for (const v of it) remove.add(v)
	for (const v of a) if (!remove.has(v)) yield v
}

/**
 * Lazily yield A ∩ B ∩ C ∩ ...
 * Streams only the FIRST iterable; others are materialized as Sets for O(1) lookups.
 * If no others are provided, yields a shallow copy of A.
 */
export function* intersection<T>(
	a: Iterable<T>,
	...rest: Iterable<T>[]
): Iterable<T> {
	if (rest.length === 0) {
		yield* a
		return
	}
	const sets = rest.map(toSet)
	for (const v of a) {
		if (sets.every((s) => s.has(v))) yield v
	}
}

/**
 * Lazily yield A △ B (pairwise symmetric difference).
 * Streams A and B once; materializes the opposite side for membership checks.
 * - First yields items unique to A (preserving A's order)
 * - Then yields items unique to B (preserving B's order)
 */
export function* symmetricDifference<T>(
	a: Iterable<T>,
	b: Iterable<T>,
): Iterable<T> {
	const A = toSet(a)
	const B = toSet(b)

	// Items unique to A
	for (const v of A) if (!B.has(v)) yield v
	// Items unique to B
	for (const v of B) if (!A.has(v)) yield v
}

/**
 * Variadic symmetric difference via left fold of the pairwise version.
 * Still lazy in the sense that we only materialize small per-step Sets;
 * each fold pass consumes its input generator.
 */
export function* symmetricDifferenceVariadic<T>(
	...its: Iterable<T>[]
): Iterable<T> {
	const sets = its.map(toSet)
	const done = new Set<T>()
	for (let i = 0; i < sets.length; i++) {
		const set = sets[i]
		for (const v of set) {
			if (!done.has(v)) {
				let count = 1
				for (let j = i + 1; j < sets.length; j++) {
					const other = sets[j]
					if (other.has(v)) {
						count++
					}
				}
				if (count % 2 === 1) yield v
				done.add(v)
			}
		}
	}
}

/**
 * Predicates (not lazy outputs, but efficient w/ early exits)
 */
export function isSubset<T>(a: Iterable<T>, b: Iterable<T>): boolean {
	const A = toSet(a)
	const B = toSet(b)
	if (A.size > B.size) return false
	for (const v of A) if (!B.has(v)) return false
	return true
}

export function isSuperset<T>(a: Iterable<T>, b: Iterable<T>): boolean {
	return isSubset(b, a)
}

export function isDisjoint<T>(a: Iterable<T>, b: Iterable<T>): boolean {
	const A = toSet(a)
	const B = toSet(b)
	const aIsSmall = A.size <= B.size
	const small = aIsSmall ? A : B
	const big = aIsSmall ? B : A
	for (const v of small) if (big.has(v)) return false
	return true
}

export function equals<T>(a: Iterable<T>, b: Iterable<T>): boolean {
	const A = toSet(a)
	const B = toSet(b)
	if (A.size !== B.size) return false
	for (const v of A) if (!B.has(v)) return false
	return true
}
