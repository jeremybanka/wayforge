import type { Read, SelectorFamily, Transactors, Write } from "atom.io"
import { getState, setState } from "atom.io"
import type { Store } from "atom.io/internal"
import {
	createAtomFamily,
	createMutableAtomFamily,
	createSelectorFamily,
	getJsonFamily,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import type {
	BaseExternalStoreConfiguration,
	ExternalStoreConfiguration,
	ExternalStoreWithContentConfiguration,
	JunctionEntries,
	JunctionSchema,
} from "~/packages/rel8/junction/src"
import { Junction } from "~/packages/rel8/junction/src"
import type * as Rel8 from "~/packages/rel8/types/src"

function capitalize<S extends string>(string: S): Capitalize<S> {
	return (string[0].toUpperCase() + string.slice(1)) as Capitalize<S>
}

export type JoinOptions<
	ASide extends string,
	BSide extends string,
	Cardinality extends Rel8.Cardinality,
> = {
	key: string
	between: [a: ASide, b: BSide]
	cardinality: Cardinality
}

const TRANSACTORS: Transactors = { get: getState, set: setState }

export type JoinProperties<
	ASide extends string,
	BSide extends string,
	Cardinality extends Rel8.Cardinality,
> = Cardinality extends `1:1`
	? {
			readonly [AB in ASide | BSide as AB extends ASide
				? `${AB}Of${Capitalize<BSide>}`
				: `${AB}Of${Capitalize<ASide>}`]: SelectorFamily<string, string>
	  }
	: Cardinality extends `1:n`
	  ? {
				readonly [A in ASide as `${A}Of${Capitalize<BSide>}`]: SelectorFamily<
					string,
					string
				>
		  } & {
				readonly [B in BSide as `${B}sOf${Capitalize<ASide>}`]: SelectorFamily<
					string[],
					string
				>
		  }
	  : Cardinality extends `n:n`
		  ? {
					readonly [AB in ASide | BSide as AB extends ASide
						? `${AB}sOf${Capitalize<BSide>}`
						: `${AB}sOf${Capitalize<ASide>}`]: SelectorFamily<string[], string>
			  }
		  : never

export function createJoin<
	const ASide extends string,
	const BSide extends string,
	const Cardinality extends Rel8.Cardinality,
>(
	options: JoinOptions<ASide, BSide, Cardinality>,
	defaultContent: undefined,
	store: Store,
): {
	relations: Junction<ASide, BSide>
	findState: JoinProperties<ASide, BSide, Cardinality>
}
export function createJoin<
	const ASide extends string,
	const Cardinality extends `1:1` | `1:n` | `n:n`,
	const BSide extends string,
	const Content extends Json.Object,
>(
	options: JoinOptions<ASide, BSide, Cardinality>,
	defaultContent: Content,
	store: Store,
): {
	relations: Junction<ASide, BSide, Content>
	findState: JoinProperties<ASide, BSide, Cardinality>
}
export function createJoin<
	ASide extends string,
	BSide extends string,
	Cardinality extends Rel8.Cardinality,
	Content extends Json.Object,
>(
	options: JoinOptions<ASide, BSide, Cardinality>,
	defaultContent: Content | undefined,
	store: Store,
): {
	relations: Junction<ASide, BSide, Content>
	findState: JoinProperties<ASide, BSide, Cardinality>
} {
	const a: ASide = options.between[0]
	const b: BSide = options.between[1]
	const findRelatedKeysState = createMutableAtomFamily<
		SetRTX<string>,
		string[],
		string
	>(
		{
			key: `${options.key}/relatedKeys`,
			default: () => new SetRTX(),
			mutable: true,
			fromJson: (json) => new SetRTX(json),
			toJson: (set) => [...set],
		},
		store,
	)
	const getRelatedKeys: Read<(key: string) => Set<string> | undefined> = (
		{ get },
		key,
	) => get(findRelatedKeysState(key))
	const addRelation: Write<(a: string, b: string) => void> = (
		transactors,
		a,
		b,
	) => {
		const aKeys = getRelatedKeys(transactors, a)
		const bKeys = getRelatedKeys(transactors, b)
		if (aKeys) {
			transactors.set(findRelatedKeysState(a), aKeys.add(b))
		} else {
			transactors.set(findRelatedKeysState(a), new SetRTX([b]))
		}
		if (bKeys) {
			transactors.set(findRelatedKeysState(b), bKeys.add(a))
		} else {
			transactors.set(findRelatedKeysState(b), new SetRTX([a]))
		}
	}
	const deleteRelation: Write<(a: string, b: string) => void> = (
		transactors,
		a,
		b,
	) => {
		const aKeys = getRelatedKeys(transactors, a)
		if (aKeys) {
			aKeys.delete(b)
			if (aKeys.size === 0) {
				transactors.set(findRelatedKeysState(a), undefined)
			}
			const bKeys = getRelatedKeys(transactors, b)
			if (bKeys) {
				bKeys.delete(a)
				if (bKeys.size === 0) {
					transactors.set(findRelatedKeysState(b), undefined)
				}
			}
		}
	}
	const has: Read<(a: string, b?: string) => boolean> = (transactors, a, b) => {
		const aKeys = getRelatedKeys(transactors, a)
		return b ? aKeys?.has(b) ?? false : (aKeys?.size ?? 0) > 0 ?? false
	}
	const baseExternalStoreConfiguration: BaseExternalStoreConfiguration = {
		getRelatedKeys: (key) => getRelatedKeys(TRANSACTORS, key),
		addRelation: (a, b) => {
			addRelation(TRANSACTORS, a, b)
		},
		deleteRelation: (a, b) => deleteRelation(TRANSACTORS, a, b),
		has: (a, b) => has(TRANSACTORS, a, b),
	}
	let externalStore: ExternalStoreConfiguration<Content>
	if (defaultContent) {
		const findContentState = createAtomFamily<Content, string>(
			{
				key: `${options.key}/content`,
				default: defaultContent,
			},
			store,
		)
		const getContent: Read<(key: string) => Content | undefined> = (
			{ get },
			key,
		) => get(findContentState(key))
		const setContent: Write<(key: string, content: Content) => void> = (
			transactors,
			key,
			content,
		) => transactors.set(findContentState(key), content)
		const deleteContent: Write<(key: string) => void> = (transactors, key) =>
			transactors.set(findContentState(key), undefined)
		const externalStoreWithContentConfiguration: ExternalStoreWithContentConfiguration<Content> =
			{
				getContent: (contentKey: string) => {
					const content = getContent(TRANSACTORS, contentKey)
					return content
				},
				setContent: (contentKey: string, content: Content) => {
					setContent(TRANSACTORS, contentKey, content)
				},
				deleteContent: (contentKey: string) => {
					deleteContent(TRANSACTORS, contentKey)
				},
			}
		externalStore = Object.assign(
			baseExternalStoreConfiguration,
			externalStoreWithContentConfiguration,
		) as ExternalStoreConfiguration<Content>
	} else {
		externalStore =
			baseExternalStoreConfiguration as ExternalStoreConfiguration<Content>
	}
	const relations = new Junction<ASide, BSide, Content>(
		options as JunctionSchema<ASide, BSide> & Partial<JunctionEntries<Content>>,
		{ externalStore },
	)

	const createSingleKeyStateFamily = () =>
		createSelectorFamily<string | undefined, string>(
			{
				key: `${options.key}/singleRelatedKey`,
				get:
					(key) =>
					({ get }) => {
						const relatedKeys = get(findRelatedKeysState(key))
						for (const relatedKey of relatedKeys) {
							return relatedKey
						}
					},
			},
			store,
		)
	const getMultipleKeyStateFamily = () =>
		getJsonFamily(findRelatedKeysState, store)

	switch (options.cardinality) {
		case `1:1`: {
			const findSingleRelatedKeyState = createSingleKeyStateFamily()
			const stateKeyA = `${a}Of${capitalize(b)}` as const
			const stateKeyB = `${b}Of${capitalize(a)}` as const
			const findState = {
				[stateKeyA]: findSingleRelatedKeyState,
				[stateKeyB]: findSingleRelatedKeyState,
			} as JoinProperties<ASide, BSide, Cardinality>

			return {
				relations,
				findState,
			}
		}
		case `1:n`: {
			const findSingleRelatedKeyState = createSingleKeyStateFamily()
			const findMultipleRelatedKeysState = getMultipleKeyStateFamily()
			const stateKeyA = `${a}Of${capitalize(b)}` as const
			const stateKeyB = `${b}sOf${capitalize(a)}` as const
			const findState = {
				[stateKeyA]: findSingleRelatedKeyState,
				[stateKeyB]: findMultipleRelatedKeysState,
			} as JoinProperties<ASide, BSide, Cardinality>

			return {
				relations,
				findState,
			}
		}
		case `n:n`: {
			const findMultipleRelatedKeysState = getMultipleKeyStateFamily()
			const stateKeyA = `${a}sOf${capitalize(b)}` as const
			const stateKeyB = `${b}sOf${capitalize(a)}` as const
			const findState = {
				[stateKeyA]: findMultipleRelatedKeysState,
				[stateKeyB]: findMultipleRelatedKeysState,
			} as JoinProperties<ASide, BSide, Cardinality>

			return {
				relations,
				findState,
			}
		}
		default:
			throw new Error(`Invalid cardinality: ${options.cardinality}`)
	}
}
