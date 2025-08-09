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
import type { Json } from "atom.io/json"
import type { SetRTX } from "atom.io/transceivers/set-rtx"

// biome-ignore format: intersection
export type JoinOptions<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object | null,
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
	> & Partial<JunctionEntriesBase<AType, BType, Content>>

export type JoinToken<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object | null = null,
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
	/** Never present. This is a marker that preserves the type of the data present for each relation */
	__content?: Content
}

/**
 * Create a join, an interface for managing relations between two sets of keys.
 *
 * Use joins when it is important to view relationships from either side.
 *
 * Under the hood, joins coordinate changes of multiple atoms to support that the desired relationships stay consistent.
 *
 * @param options - {@link JoinOptions}
 * @param defaultContent - (undefined)
 * @returns
 * A reference to the join created: a {@link JoinToken}
 * @overload No Content
 */
export function join<
	const ASide extends string,
	const AType extends string,
	const BSide extends string,
	const BType extends string,
	const Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	options: JoinOptions<ASide, AType, BSide, BType, Cardinality, null>,
	defaultContent?: undefined,
): JoinToken<ASide, AType, BSide, BType, Cardinality, null>
/**
 * Create a join, an interface for managing relations between two sets of keys.
 *
 * Use joins when it is important to view relationships from either side.
 *
 * Under the hood, joins coordinate changes of multiple atoms to support that the desired relationships stay consistent.
 *
 * @param options - {@link JoinOptions}
 * @param defaultContent - The default value for the content of each relation
 * @returns
 * A reference to the join created: a {@link JoinToken}
 * @overload With Content
 */
export function join<
	const ASide extends string,
	const AType extends string,
	const BSide extends string,
	const BType extends string,
	const Cardinality extends `1:1` | `1:n` | `n:n`,
	const Content extends Json.Object,
>(
	options: JoinOptions<ASide, AType, BSide, BType, Cardinality, Content>,
	defaultContent: Content,
): JoinToken<ASide, AType, BSide, BType, Cardinality, Content>
export function join<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object,
>(
	options: JoinOptions<ASide, AType, BSide, BType, Cardinality, Content>,
	defaultContent: Content | undefined,
): JoinToken<ASide, AType, BSide, BType, Cardinality, Content> {
	return createJoin(IMPLICIT.STORE, options, defaultContent)
}

export type JoinStates<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object | null,
> = Cardinality extends `1:1`
	? (Content extends Json.Object
			? {
					readonly [A in ASide as `${A}EntryOf${Capitalize<BSide>}`]: ReadonlyPureSelectorToken<
						[AType, Content] | null,
						BType
					>
				} & {
					readonly [B in BSide as `${B}EntryOf${Capitalize<ASide>}`]: ReadonlyPureSelectorToken<
						[BType, Content] | null,
						AType
					>
				}
			: {}) & {
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
		? (Content extends Json.Object
				? {
						readonly [A in ASide as `${A}EntryOf${Capitalize<BSide>}`]: ReadonlyPureSelectorToken<
							[AType, Content] | null,
							BType
						>
					} & {
						readonly [B in BSide as `${B}EntriesOf${Capitalize<ASide>}`]: ReadonlyPureSelectorToken<
							[BType, Content][],
							AType
						>
					}
				: {}) & {
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
			? (Content extends Json.Object
					? {
							readonly [A in ASide as `${A}EntriesOf${Capitalize<BSide>}`]: ReadonlyPureSelectorToken<
								[AType, Content][],
								BType
							>
						} & {
							readonly [B in BSide as `${B}EntriesOf${Capitalize<ASide>}`]: ReadonlyPureSelectorToken<
								[BType, Content][],
								AType
							>
						}
					: {}) & {
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
	Content extends Json.Object | null,
>(
	token: JoinToken<ASide, AType, BSide, BType, Cardinality, Content>,
	key: AType | BType,
): JoinStates<ASide, AType, BSide, BType, Cardinality, Content> {
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
	Content extends Json.Object | null,
>(
	token: JoinToken<ASide, AType, BSide, BType, Cardinality, Content>,
	change: (relations: Junction<ASide, AType, BSide, BType, Content>) => void,
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
	Content extends Json.Object | null,
>(
	token: JoinToken<ASide, AType, BSide, BType, Cardinality, Content>,
): MutableAtomFamilyToken<SetRTX<string>, string> {
	return getInternalRelationsFromStore(token, IMPLICIT.STORE)
}
