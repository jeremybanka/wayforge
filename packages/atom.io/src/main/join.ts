import type { MutableAtomFamilyToken, ReadonlyPureSelectorToken } from "atom.io"
import type {
	Flat,
	Junction,
	JunctionEntriesBase,
	JunctionSchemaBase,
	Refinement,
} from "atom.io/internal"
import {
	createJoin,
	editRelationsInStore,
	findRelationsInStore,
	getInternalRelationsFromStore,
	IMPLICIT,
} from "atom.io/internal"
import type { UList } from "atom.io/transceivers/u-list"

// biome-ignore format: intersection
export type JoinOptions<
	AName extends string,
	A extends string,
	BName extends string,
	B extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
> =
	Flat<
		& JunctionSchemaBase<AName, BName>
		& {
			/** Unique identifier of the join */
			readonly key: string
			/** How many relations are allowed in each direction? */
			readonly cardinality: Cardinality
			/** Type guard for the type of the left side */
			readonly isAType: Refinement<string, A>
			/** Type guard for the type of the right side */
			readonly isBType: Refinement<string, B>
		}
	> & Partial<JunctionEntriesBase<A, B, null>>

export type JoinToken<
	AName extends string,
	A extends string,
	BName extends string,
	B extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
> = {
	/** Unique identifier of the join */
	key: string
	/** Discriminator */
	type: `join`
	/** How many relations are allowed in each direction? */
	cardinality: Cardinality
	/** Name of the join's left side */
	a: AName
	/** Name of the join's right side */
	b: BName
	/** Never present. This is a marker that preserves the type of the left side's keys */
	__aType?: A
	/** Never present. This is a marker that preserves the type of the right side's keys */
	__bType?: B
}

/**
 * Create a join, an interface for managing relations between two sets of keys.
 *
 * Use joins when it is important to view relationships from either side.
 *
 * Under the hood, joins coordinate changes of multiple atoms to support that the desired relationships stay consistent.
 *
 * @param options - {@link JoinOptions}
 * @returns
 * A reference to the join created: a {@link JoinToken}
 */
export function join<
	const AName extends string,
	const A extends string,
	const BName extends string,
	const B extends string,
	const Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	options: JoinOptions<AName, A, BName, B, Cardinality>,
): JoinToken<AName, A, BName, B, Cardinality> {
	return createJoin(IMPLICIT.STORE, options)
}

export type JoinStates<
	AName extends string,
	A extends string,
	BName extends string,
	B extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
> = Cardinality extends `1:1`
	? {
			readonly [N in AName as `${N}KeyOf${Capitalize<BName>}`]: ReadonlyPureSelectorToken<
				A | null,
				B
			>
		} & {
			readonly [N in BName as `${N}KeyOf${Capitalize<AName>}`]: ReadonlyPureSelectorToken<
				B | null,
				A
			>
		}
	: Cardinality extends `1:n`
		? {
				readonly [N in AName as `${N}KeyOf${Capitalize<BName>}`]: ReadonlyPureSelectorToken<
					A | null,
					B
				>
			} & {
				readonly [N in BName as `${N}KeysOf${Capitalize<AName>}`]: ReadonlyPureSelectorToken<
					B[],
					A
				>
			}
		: Cardinality extends `n:n`
			? {
					readonly [N in AName as `${N}KeysOf${Capitalize<BName>}`]: ReadonlyPureSelectorToken<
						A[],
						B
					>
				} & {
					readonly [N in BName as `${N}KeysOf${Capitalize<AName>}`]: ReadonlyPureSelectorToken<
						B[],
						A
					>
				}
			: never

/**
 * Find the current value of a relation owned by a {@link join}
 * @param token - The token of the join
 * @param key - The key of the relation to find
 * @returns
 * A {@link JoinStates} interface to access the relation
 * @overload Default
 */
export function findRelations<
	AName extends string,
	A extends string,
	BName extends string,
	B extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	token: JoinToken<AName, A, BName, B, Cardinality>,
	key: A | B,
): JoinStates<AName, A, BName, B, Cardinality> {
	return findRelationsInStore(IMPLICIT.STORE, token, key)
}

/**
 * Change one or multiple relations owned by a {@link join}
 * @param token - The token of the join
 * @param change - A function that takes a {@link Junction} interface to edit the relations
 */
export function editRelations<
	AName extends string,
	A extends string,
	BName extends string,
	B extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	token: JoinToken<AName, A, BName, B, Cardinality>,
	change: (relations: Junction<AName, A, BName, B>) => void,
): void {
	editRelationsInStore(IMPLICIT.STORE, token, change)
}

/**
 * @param token - The token of the join
 * @returns
 * A {@link MutableAtomFamilyToken} to access the internal relations
 */
export function getInternalRelations<
	AName extends string,
	A extends string,
	BName extends string,
	B extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	token: JoinToken<AName, A, BName, B, Cardinality>,
): [
	atob: MutableAtomFamilyToken<UList<B>, A>,
	btoa: MutableAtomFamilyToken<UList<A>, B>,
] {
	return getInternalRelationsFromStore(IMPLICIT.STORE, token)
}
