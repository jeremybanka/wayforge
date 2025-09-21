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
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
> =
	Flat<
		& JunctionSchemaBase<ASide, BSide>
		& {
			/** Unique identifier of the join */
			readonly key: string
			/** How many relations are allowed in each direction? */
			readonly cardinality: Cardinality
			/** Type guard for the type of the left side */
			readonly isAType: Refinement<string, AType>
			/** Type guard for the type of the right side */
			readonly isBType: Refinement<string, BType>
		}
	> & Partial<JunctionEntriesBase<AType, BType, null>>

export type JoinToken<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
> = {
	/** Unique identifier of the join */
	key: string
	/** Discriminator */
	type: `join`
	/** How many relations are allowed in each direction? */
	cardinality: Cardinality
	/** Name of the join's left side */
	a: ASide
	/** Name of the join's right side */
	b: BSide
	/** Never present. This is a marker that preserves the type of the left side's keys */
	__aType?: AType
	/** Never present. This is a marker that preserves the type of the right side's keys */
	__bType?: BType
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
	const ASide extends string,
	const AType extends string,
	const BSide extends string,
	const BType extends string,
	const Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	options: JoinOptions<ASide, AType, BSide, BType, Cardinality>,
): JoinToken<ASide, AType, BSide, BType, Cardinality> {
	return createJoin(IMPLICIT.STORE, options)
}

export type JoinStates<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
> = Cardinality extends `1:1`
	? {
			readonly [A in ASide as `${A}KeyOf${Capitalize<BSide>}`]: ReadonlyPureSelectorToken<
				AType | null,
				BType
			>
		} & {
			readonly [B in BSide as `${B}KeyOf${Capitalize<ASide>}`]: ReadonlyPureSelectorToken<
				BType | null,
				AType
			>
		}
	: Cardinality extends `1:n`
		? {
				readonly [A in ASide as `${A}KeyOf${Capitalize<BSide>}`]: ReadonlyPureSelectorToken<
					AType | null,
					BType
				>
			} & {
				readonly [B in BSide as `${B}KeysOf${Capitalize<ASide>}`]: ReadonlyPureSelectorToken<
					BType[],
					AType
				>
			}
		: Cardinality extends `n:n`
			? {
					readonly [A in ASide as `${A}KeysOf${Capitalize<BSide>}`]: ReadonlyPureSelectorToken<
						AType[],
						BType
					>
				} & {
					readonly [B in BSide as `${B}KeysOf${Capitalize<ASide>}`]: ReadonlyPureSelectorToken<
						BType[],
						AType
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
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	token: JoinToken<ASide, AType, BSide, BType, Cardinality>,
	key: AType | BType,
): JoinStates<ASide, AType, BSide, BType, Cardinality> {
	return findRelationsInStore(token, key, IMPLICIT.STORE)
}

/**
 * Change one or multiple relations owned by a {@link join}
 * @param token - The token of the join
 * @param change - A function that takes a {@link Junction} interface to edit the relations
 */
export function editRelations<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	token: JoinToken<ASide, AType, BSide, BType, Cardinality>,
	change: (relations: Junction<ASide, AType, BSide, BType>) => void,
): void {
	editRelationsInStore(token, change, IMPLICIT.STORE)
}

/**
 * @param token - The token of the join
 * @returns
 * A {@link MutableAtomFamilyToken} to access the internal relations
 */
export function getInternalRelations<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	token: JoinToken<ASide, AType, BSide, BType, Cardinality>,
): MutableAtomFamilyToken<UList<AType> | UList<BType>, string> {
	return getInternalRelationsFromStore(token, IMPLICIT.STORE)
}
