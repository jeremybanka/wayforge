import type { MutableAtomFamilyToken, ReadonlyPureSelectorToken } from "atom.io"
import type {
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
import type { SetRTX, SetRTXJson } from "atom.io/transceivers/set-rtx"

export interface JoinOptions<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object | null,
> extends JunctionSchemaBase<ASide, BSide>,
		Partial<JunctionEntriesBase<AType, BType, Content>> {
	readonly key: string
	readonly cardinality: Cardinality
	readonly isAType: Refinement<string, AType>
	readonly isBType: Refinement<string, BType>
}

export type JoinToken<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object | null = null,
> = {
	key: string
	type: `join`
	cardinality: Cardinality
	a: ASide
	b: BSide
	__aType?: AType
	__bType?: BType
	__content?: Content
}

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

export function getInternalRelations<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object | null,
>(
	token: JoinToken<ASide, AType, BSide, BType, Cardinality, Content>,
): MutableAtomFamilyToken<SetRTX<string>, SetRTXJson<string>, string> {
	return getInternalRelationsFromStore(token, IMPLICIT.STORE)
}
