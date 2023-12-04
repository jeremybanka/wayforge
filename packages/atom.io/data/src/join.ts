/* eslint-disable @typescript-eslint/ban-types */
import type {
	AtomFamily,
	Read,
	SelectorFamily,
	Transactors,
	Write,
} from "atom.io"
import { getState, setState } from "atom.io"
import type { Store } from "atom.io/internal"
import {
	IMPLICIT,
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

const TRANSACTORS: Transactors = { get: getState, set: setState }

function capitalize<S extends string>(string: S): Capitalize<S> {
	return (string[0].toUpperCase() + string.slice(1)) as Capitalize<S>
}

export interface JoinOptions<
	ASide extends string,
	BSide extends string,
	Cardinality extends Rel8.Cardinality,
	Content extends Json.Object | null,
> extends Json.Object,
		JunctionSchema<ASide, BSide>,
		Partial<JunctionEntries<Content>> {
	readonly key: string
	readonly cardinality: Cardinality
}

export type JoinState<
	ASide extends string,
	BSide extends string,
	Cardinality extends Rel8.Cardinality,
	Content extends Json.Object | null,
> = Cardinality extends `1:1`
	? (Content extends Json.Object
			? {
					readonly [AB in ASide | BSide as AB extends ASide
						? `${AB}EntryOf${Capitalize<BSide>}`
						: `${AB}EntryOf${Capitalize<ASide>}`]: SelectorFamily<
						[string, Content] | undefined,
						string
					>
			  }
			: {}) & {
			readonly [AB in ASide | BSide as AB extends ASide
				? `${AB}KeyOf${Capitalize<BSide>}`
				: `${AB}KeyOf${Capitalize<ASide>}`]: SelectorFamily<
				string | undefined,
				string
			>
	  }
	: Cardinality extends `1:n`
	  ? (Content extends Json.Object
				? {
						readonly [A in ASide as `${A}EntryOf${Capitalize<BSide>}`]: SelectorFamily<
							[string, Content] | undefined,
							string
						>
				  } & {
						readonly [B in BSide as `${B}EntriesOf${Capitalize<ASide>}`]: SelectorFamily<
							[string, Content][],
							string
						>
				  }
				: {}) & {
				readonly [A in ASide as `${A}KeyOf${Capitalize<BSide>}`]: SelectorFamily<
					string | undefined,
					string
				>
		  } & {
				readonly [B in BSide as `${B}KeysOf${Capitalize<ASide>}`]: SelectorFamily<
					string[],
					string
				>
		  }
	  : Cardinality extends `n:n`
		  ? (Content extends Json.Object
					? {
							readonly [AB in ASide | BSide as AB extends ASide
								? `${AB}EntriesOf${Capitalize<BSide>}`
								: `${AB}EntriesOf${Capitalize<ASide>}`]: SelectorFamily<
								[string, Content][],
								string
							>
					  }
					: {}) & {
					readonly [AB in ASide | BSide as AB extends ASide
						? `${AB}KeysOf${Capitalize<BSide>}`
						: `${AB}KeysOf${Capitalize<ASide>}`]: SelectorFamily<
						string[],
						string
					>
			  }
		  : never

export function join<
	const ASide extends string,
	const BSide extends string,
	const Cardinality extends Rel8.Cardinality,
>(
	options: JoinOptions<ASide, BSide, Cardinality, null>,
	defaultContent?: undefined,
	store?: Store,
): {
	relations: Junction<ASide, BSide>
	findState: JoinState<ASide, BSide, Cardinality, null>
}
export function join<
	const ASide extends string,
	const Cardinality extends `1:1` | `1:n` | `n:n`,
	const BSide extends string,
	const Content extends Json.Object,
>(
	options: JoinOptions<ASide, BSide, Cardinality, Content>,
	defaultContent: Content,
	store?: Store,
): {
	relations: Junction<ASide, BSide, Content>
	findState: JoinState<ASide, BSide, Cardinality, Content>
}
export function join<
	ASide extends string,
	BSide extends string,
	Cardinality extends Rel8.Cardinality,
	Content extends Json.Object,
>(
	options: JoinOptions<ASide, BSide, Cardinality, Content>,
	defaultContent: Content | undefined,
	store: Store = IMPLICIT.STORE,
): {
	relations: Junction<ASide, BSide, Content>
	findState: JoinState<ASide, BSide, Cardinality, Content>
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
	const replaceRelationsSafely: Write<(a: string, bs: string[]) => void> = (
		transactors,
		a,
		bs,
	) => {
		const aKeys = getRelatedKeys(transactors, a)
		if (aKeys) {
			for (const b of aKeys) {
				const bKeys = getRelatedKeys(transactors, b)
				if (bKeys) {
					bKeys.delete(a)
					if (bKeys.size === 0) {
						transactors.set(findRelatedKeysState(b), undefined)
					}
				}
			}
		}
		transactors.set(findRelatedKeysState(a), new SetRTX(bs))
		for (const b of bs) {
			const bKeys = getRelatedKeys(transactors, b)
			if (bKeys) {
				bKeys.add(a)
			} else {
				transactors.set(findRelatedKeysState(b), new SetRTX([a]))
			}
		}
	}
	const replaceRelationsUnsafely: Write<(a: string, bs: string[]) => void> = (
		transactors,
		a,
		bs,
	) => {
		transactors.set(findRelatedKeysState(a), new SetRTX(bs))
		for (const b of bs) {
			let bKeys = getRelatedKeys(transactors, b)
			if (bKeys) {
				bKeys.add(a)
			} else {
				bKeys = new SetRTX([a])
				transactors.set(findRelatedKeysState(b), bKeys)
			}
		}
	}
	const has: Read<(a: string, b?: string) => boolean> = (transactors, a, b) => {
		const aKeys = getRelatedKeys(transactors, a)
		return b ? aKeys?.has(b) ?? false : (aKeys?.size ?? 0) > 0 ?? false
	}
	const baseExternalStoreConfiguration: BaseExternalStoreConfiguration = {
		getRelatedKeys: (key) => getRelatedKeys(TRANSACTORS, key),
		addRelation: (a, b) => addRelation(TRANSACTORS, a, b),
		deleteRelation: (a, b) => deleteRelation(TRANSACTORS, a, b),
		replaceRelationsSafely: (a, bs) =>
			replaceRelationsSafely(TRANSACTORS, a, bs),
		replaceRelationsUnsafely: (a, bs) =>
			replaceRelationsUnsafely(TRANSACTORS, a, bs),
		has: (a, b) => has(TRANSACTORS, a, b),
	}
	let externalStore: ExternalStoreConfiguration<Content>
	let findContentState: AtomFamily<Content, string>
	if (defaultContent) {
		findContentState = createAtomFamily<Content, string>(
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
	const relations = new Junction<ASide, BSide, Content>(options, {
		externalStore,
		makeContentKey: (...args) => args.sort().join(`:`),
	})

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
	const createSingleEntryStateFamily = () =>
		createSelectorFamily<[string, Content] | undefined, string>(
			{
				key: `${options.key}/singleRelatedEntry`,
				get:
					(key) =>
					({ get }) => {
						const relatedKeys = get(findRelatedKeysState(key))
						for (const relatedKey of relatedKeys) {
							const contentKey = relations.makeContentKey(key, relatedKey)
							return [relatedKey, get(findContentState(contentKey))]
						}
					},
			},
			store,
		)
	const getMultipleEntryStateFamily = () =>
		createSelectorFamily<[string, Content][], string>(
			{
				key: `${options.key}/multipleRelatedEntries`,
				get:
					(key) =>
					({ get }) => {
						const relatedKeys = get(findRelatedKeysState(key))
						return [...relatedKeys].map((relatedKey) => {
							const contentKey = relations.makeContentKey(key, relatedKey)
							return [relatedKey, get(findContentState(contentKey))]
						})
					},
			},
			store,
		)

	switch (options.cardinality) {
		case `1:1`: {
			const findSingleRelatedKeyState = createSingleKeyStateFamily()
			const stateKeyA = `${a}KeyOf${capitalize(b)}` as const
			const stateKeyB = `${b}KeyOf${capitalize(a)}` as const
			const findStateBase = {
				[stateKeyA]: findSingleRelatedKeyState,
				[stateKeyB]: findSingleRelatedKeyState,
			} as JoinState<ASide, BSide, Cardinality, Content>
			let findState: JoinState<ASide, BSide, Cardinality, Content>
			if (defaultContent) {
				const findSingleRelatedEntryState = createSingleEntryStateFamily()
				const entriesStateKeyA = `${a}EntryOf${capitalize(b)}` as const
				const entriesStateKeyB = `${b}EntryOf${capitalize(a)}` as const
				const findStateWithContent = {
					[entriesStateKeyA]: findSingleRelatedEntryState,
					[entriesStateKeyB]: findSingleRelatedEntryState,
				}
				findState = Object.assign(findStateBase, findStateWithContent)
			} else {
				findState = findStateBase
			}
			return {
				relations,
				findState,
			}
		}
		case `1:n`: {
			const findSingleRelatedKeyState = createSingleKeyStateFamily()
			const findMultipleRelatedKeysState = getMultipleKeyStateFamily()
			const stateKeyA = `${a}KeyOf${capitalize(b)}` as const
			const stateKeyB = `${b}KeysOf${capitalize(a)}` as const
			const findStateBase = {
				[stateKeyA]: findSingleRelatedKeyState,
				[stateKeyB]: findMultipleRelatedKeysState,
			} as JoinState<ASide, BSide, Cardinality, Content>
			let findState: JoinState<ASide, BSide, Cardinality, Content>
			if (defaultContent) {
				const findSingleRelatedEntryState = createSingleEntryStateFamily()
				const findMultipleRelatedEntriesState = getMultipleEntryStateFamily()
				const entriesStateKeyA = `${a}EntryOf${capitalize(b)}` as const
				const entriesStateKeyB = `${b}EntriesOf${capitalize(a)}` as const
				const findStateWithContent = {
					[entriesStateKeyA]: findSingleRelatedEntryState,
					[entriesStateKeyB]: findMultipleRelatedEntriesState,
				}
				findState = Object.assign(findStateBase, findStateWithContent)
			} else {
				findState = findStateBase
			}
			return {
				relations,
				findState,
			}
		}
		case `n:n`: {
			const findMultipleRelatedKeysState = getMultipleKeyStateFamily()
			const stateKeyA = `${a}KeysOf${capitalize(b)}` as const
			const stateKeyB = `${b}KeysOf${capitalize(a)}` as const
			const findStateBase = {
				[stateKeyA]: findMultipleRelatedKeysState,
				[stateKeyB]: findMultipleRelatedKeysState,
			} as JoinState<ASide, BSide, Cardinality, Content>
			let findState: JoinState<ASide, BSide, Cardinality, Content>
			if (defaultContent) {
				const findMultipleRelatedEntriesState = getMultipleEntryStateFamily()
				const entriesStateKeyA = `${a}EntriesOf${capitalize(b)}` as const
				const entriesStateKeyB = `${b}EntriesOf${capitalize(a)}` as const
				const findStateWithContent = {
					[entriesStateKeyA]: findMultipleRelatedEntriesState,
					[entriesStateKeyB]: findMultipleRelatedEntriesState,
				}
				findState = Object.assign(findStateBase, findStateWithContent)
			} else {
				findState = findStateBase
			}
			return {
				relations,
				findState,
			}
		}
		default:
			throw new Error(`Invalid cardinality: ${options.cardinality}`)
	}
}
