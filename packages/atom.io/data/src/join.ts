/* eslint-disable @typescript-eslint/ban-types */
import type {
	MutableAtomFamily,
	Read,
	ReadonlySelectorFamily,
	RegularAtomFamily,
	Transactors,
	Write,
} from "atom.io"
import { dispose, findState, getState, setState } from "atom.io"
import type { Store } from "atom.io/internal"
import {
	IMPLICIT,
	createMutableAtomFamily,
	createRegularAtomFamily,
	createSelectorFamily,
	getJsonFamily,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import type {
	BaseExternalStoreConfiguration,
	ExternalStoreConfiguration,
	JunctionEntries,
	JunctionSchema,
} from "~/packages/rel8/junction/src"
import { Junction } from "~/packages/rel8/junction/src"
import type * as Rel8 from "~/packages/rel8/types/src"

const TRANSACTORS: Transactors = {
	get: getState,
	set: setState,
	find: findState,
}

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
						: `${AB}EntryOf${Capitalize<ASide>}`]: ReadonlySelectorFamily<
						[string, Content] | null,
						string
					>
			  }
			: {}) & {
			readonly [AB in ASide | BSide as AB extends ASide
				? `${AB}KeyOf${Capitalize<BSide>}`
				: `${AB}KeyOf${Capitalize<ASide>}`]: ReadonlySelectorFamily<
				string | null,
				string
			>
	  }
	: Cardinality extends `1:n`
	  ? (Content extends Json.Object
				? {
						readonly [A in ASide as `${A}EntryOf${Capitalize<BSide>}`]: ReadonlySelectorFamily<
							[string, Content] | null,
							string
						>
				  } & {
						readonly [B in BSide as `${B}EntriesOf${Capitalize<ASide>}`]: ReadonlySelectorFamily<
							[string, Content][],
							string
						>
				  }
				: {}) & {
				readonly [A in ASide as `${A}KeyOf${Capitalize<BSide>}`]: ReadonlySelectorFamily<
					string | null,
					string
				>
		  } & {
				readonly [B in BSide as `${B}KeysOf${Capitalize<ASide>}`]: ReadonlySelectorFamily<
					string[],
					string
				>
		  }
	  : Cardinality extends `n:n`
		  ? (Content extends Json.Object
					? {
							readonly [AB in ASide | BSide as AB extends ASide
								? `${AB}EntriesOf${Capitalize<BSide>}`
								: `${AB}EntriesOf${Capitalize<ASide>}`]: ReadonlySelectorFamily<
								[string, Content][],
								string
							>
					  }
					: {}) & {
					readonly [AB in ASide | BSide as AB extends ASide
						? `${AB}KeysOf${Capitalize<BSide>}`
						: `${AB}KeysOf${Capitalize<ASide>}`]: ReadonlySelectorFamily<
						string[],
						string
					>
			  }
		  : never

export class Join<
	const ASide extends string,
	const BSide extends string,
	const Cardinality extends `1:1` | `1:n` | `n:n`,
	const Content extends Json.Object | null = null,
> {
	private transactors: Transactors = TRANSACTORS
	public relations: Junction<ASide, BSide, Content>
	public states: JoinState<ASide, BSide, Cardinality, Content>
	public core: {
		findRelatedKeysState: MutableAtomFamily<
			SetRTX<string>,
			SetRTXJson<string>,
			string
		>
	}
	public transact(
		transactors: Transactors,
		run: (join: Join<ASide, BSide, Cardinality, Content>) => void,
	): void {
		this.transactors = transactors
		run(this)
		this.transactors = TRANSACTORS
	}
	public constructor(
		options: JoinOptions<ASide, BSide, Cardinality, Content>,
		defaultContent: Content | undefined,
		store: Store = IMPLICIT.STORE,
	) {
		const a: ASide = options.between[0]
		const b: BSide = options.between[1]
		const findRelatedKeysState = createMutableAtomFamily<
			SetRTX<string>,
			SetRTXJson<string>,
			string
		>(
			{
				key: `${options.key}/relatedKeys`,
				default: () => new SetRTX(),
				mutable: true,
				fromJson: (json) => SetRTX.fromJSON(json),
				toJson: (set) => set.toJSON(),
			},
			store,
		)
		this.core = { findRelatedKeysState }
		const getRelatedKeys: Read<(key: string) => SetRTX<string>> = (
			{ get },
			key,
		) => get(findRelatedKeysState(key))
		const addRelation: Write<(a: string, b: string) => void> = (
			transactors,
			a,
			b,
		) => {
			const aKeysState = findRelatedKeysState(a)
			const bKeysState = findRelatedKeysState(b)
			transactors.set(aKeysState, (aKeys) => aKeys.add(b))
			transactors.set(bKeysState, (bKeys) => bKeys.add(a))
		}
		const deleteRelation: Write<(a: string, b: string) => void> = (
			transactors,
			a,
			b,
		) => {
			const aKeys = getRelatedKeys(transactors, a)
			aKeys.delete(b)
			const bKeys = getRelatedKeys(transactors, b)
			bKeys.delete(a)
		}
		const replaceRelationsSafely: Write<
			(a: string, newRelationsOfA: string[]) => void
		> = (transactors, a, newRelationsOfA) => {
			const { find, get, set } = transactors
			const relationsOfAState = find(findRelatedKeysState, a)
			const currentRelationsOfA = get(relationsOfAState)
			for (const currentRelationB of currentRelationsOfA) {
				const remainsRelated = newRelationsOfA.includes(currentRelationB)
				if (remainsRelated) {
					continue
				}
				const relationsOfB = getRelatedKeys(transactors, currentRelationB)
				relationsOfB.delete(a)
			}
			set(relationsOfAState, (relationsOfA) => {
				relationsOfA.transaction((nextRelationsOfA) => {
					nextRelationsOfA.clear()
					for (const newRelationB of newRelationsOfA) {
						const relationsOfB = getRelatedKeys(transactors, newRelationB)
						const newRelationBIsAlreadyRelated = relationsOfB.has(a)
						if (this.relations.cardinality === `1:n`) {
							for (const previousOwner of relationsOfB) {
								if (previousOwner === a) {
									continue
								}
								const previousOwnerRelations = getRelatedKeys(
									transactors,
									previousOwner,
								)
								previousOwnerRelations.delete(newRelationB)
							}
							if (!newRelationBIsAlreadyRelated && relationsOfB.size > 0) {
								relationsOfB.clear()
							}
						}
						if (!newRelationBIsAlreadyRelated) {
							relationsOfB.add(a)
						}
						nextRelationsOfA.add(newRelationB)
					}
					return true
				})
				return relationsOfA
			})
		}
		const replaceRelationsUnsafely: Write<
			(a: string, newRelationsOfA: string[]) => void
		> = (transactors, a, newRelationsOfA) => {
			const relationsOfA = getRelatedKeys(transactors, a)
			for (const newRelationB of newRelationsOfA) {
				const relationsOfB = getRelatedKeys(transactors, newRelationB)
				relationsOfA.add(newRelationB)
				relationsOfB.add(a)
			}
			return true
		}
		const has: Read<(a: string, b?: string) => boolean> = (
			transactors,
			a,
			b,
		) => {
			const aKeys = getRelatedKeys(transactors, a)
			return b ? aKeys.has(b) : aKeys.size > 0
		}
		const baseExternalStoreConfiguration: BaseExternalStoreConfiguration = {
			getRelatedKeys: (key) => getRelatedKeys(this.transactors, key),
			addRelation: (a, b) => addRelation(this.transactors, a, b),
			deleteRelation: (a, b) => deleteRelation(this.transactors, a, b),
			replaceRelationsSafely: (a, bs) =>
				replaceRelationsSafely(this.transactors, a, bs),
			replaceRelationsUnsafely: (a, bs) =>
				replaceRelationsUnsafely(this.transactors, a, bs),
			has: (a, b) => has(this.transactors, a, b),
		}
		let externalStore: ExternalStoreConfiguration<Content>
		let findContentState: RegularAtomFamily<Content, string>
		if (defaultContent) {
			findContentState = createRegularAtomFamily<Content, string>(
				{
					key: `${options.key}/content`,
					default: defaultContent,
				},
				store,
			)
			const getContent: Read<(key: string) => Content | null> = ({ get }, key) =>
				get(findContentState(key))
			const setContent: Write<(key: string, content: Content) => void> = (
				transactors,
				key,
				content,
			) => transactors.set(findContentState(key), content)
			const deleteContent: Write<(key: string) => void> = (_, key) =>
				dispose(findContentState(key))
			const externalStoreWithContentConfiguration = {
				getContent: (contentKey: string) => {
					const content = getContent(this.transactors, contentKey)
					return content
				},
				setContent: (contentKey: string, content: Content) => {
					setContent(this.transactors, contentKey, content)
				},
				deleteContent: (contentKey: string) => {
					deleteContent(this.transactors, contentKey)
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
			createSelectorFamily<string | null, string>(
				{
					key: `${options.key}/singleRelatedKey`,
					get:
						(key) =>
						({ get }) => {
							const relatedKeys = get(findRelatedKeysState(key))
							for (const relatedKey of relatedKeys) {
								return relatedKey
							}
							return null
						},
				},
				store,
			)
		const getMultipleKeyStateFamily = () => {
			return createSelectorFamily<string[], string>(
				{
					key: `${options.key}/multipleRelatedKeys`,
					get:
						(key) =>
						({ get }) => {
							const jsonFamily = getJsonFamily(findRelatedKeysState, store)
							const json = get(jsonFamily(key))
							return json.members
						},
				},
				store,
			)
		}
		const createSingleEntryStateFamily = () =>
			createSelectorFamily<[string, Content] | null, string>(
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
							return null
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
							const jsonFamily = getJsonFamily(findRelatedKeysState, store)
							const json = get(jsonFamily(key))
							return json.members.map((relatedKey) => {
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
				const baseStates = {
					[stateKeyA]: findSingleRelatedKeyState,
					[stateKeyB]: findSingleRelatedKeyState,
				} as JoinState<ASide, BSide, Cardinality, Content>
				let states: JoinState<ASide, BSide, Cardinality, Content>
				if (defaultContent) {
					const findSingleRelatedEntryState = createSingleEntryStateFamily()
					const entriesStateKeyA = `${a}EntryOf${capitalize(b)}` as const
					const entriesStateKeyB = `${b}EntryOf${capitalize(a)}` as const
					const contentStates = {
						[entriesStateKeyA]: findSingleRelatedEntryState,
						[entriesStateKeyB]: findSingleRelatedEntryState,
					}
					states = Object.assign(baseStates, contentStates)
				} else {
					states = baseStates
				}
				this.relations = relations
				this.states = states
				break
			}
			case `1:n`: {
				const findSingleRelatedKeyState = createSingleKeyStateFamily()
				const findMultipleRelatedKeysState = getMultipleKeyStateFamily()
				const stateKeyA = `${a}KeyOf${capitalize(b)}` as const
				const stateKeyB = `${b}KeysOf${capitalize(a)}` as const
				const baseStates = {
					[stateKeyA]: findSingleRelatedKeyState,
					[stateKeyB]: findMultipleRelatedKeysState,
				} as JoinState<ASide, BSide, Cardinality, Content>
				let states: JoinState<ASide, BSide, Cardinality, Content>
				if (defaultContent) {
					const findSingleRelatedEntryState = createSingleEntryStateFamily()
					const findMultipleRelatedEntriesState = getMultipleEntryStateFamily()
					const entriesStateKeyA = `${a}EntryOf${capitalize(b)}` as const
					const entriesStateKeyB = `${b}EntriesOf${capitalize(a)}` as const
					const contentStates = {
						[entriesStateKeyA]: findSingleRelatedEntryState,
						[entriesStateKeyB]: findMultipleRelatedEntriesState,
					}
					states = Object.assign(baseStates, contentStates)
				} else {
					states = baseStates
				}
				this.relations = relations
				this.states = states
				break
			}
			default: {
				const findMultipleRelatedKeysState = getMultipleKeyStateFamily()
				const stateKeyA = `${a}KeysOf${capitalize(b)}` as const
				const stateKeyB = `${b}KeysOf${capitalize(a)}` as const
				const baseStates = {
					[stateKeyA]: findMultipleRelatedKeysState,
					[stateKeyB]: findMultipleRelatedKeysState,
				} as JoinState<ASide, BSide, Cardinality, Content>
				let states: JoinState<ASide, BSide, Cardinality, Content>
				if (defaultContent) {
					const findMultipleRelatedEntriesState = getMultipleEntryStateFamily()
					const entriesStateKeyA = `${a}EntriesOf${capitalize(b)}` as const
					const entriesStateKeyB = `${b}EntriesOf${capitalize(a)}` as const
					const contentStates = {
						[entriesStateKeyA]: findMultipleRelatedEntriesState,
						[entriesStateKeyB]: findMultipleRelatedEntriesState,
					}
					states = Object.assign(baseStates, contentStates)
				} else {
					states = baseStates
				}
				this.relations = relations
				this.states = states
			}
		}
	}
}
export function join<
	const ASide extends string,
	const BSide extends string,
	const Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	options: JoinOptions<ASide, BSide, Cardinality, null>,
	defaultContent?: undefined,
	store?: Store,
): {
	readonly relations: Junction<ASide, BSide, null>
	readonly states: JoinState<ASide, BSide, Cardinality, null>
	readonly transact: (
		transactors: Transactors,
		run: (join: Join<ASide, BSide, Cardinality, null>) => void,
	) => void
	readonly core: {
		readonly findRelatedKeysState: MutableAtomFamily<
			SetRTX<string>,
			SetRTXJson<string>,
			string
		>
	}
}
export function join<
	const ASide extends string,
	const BSide extends string,
	const Cardinality extends `1:1` | `1:n` | `n:n`,
	const Content extends Json.Object,
>(
	options: JoinOptions<ASide, BSide, Cardinality, Content>,
	defaultContent: Content,
	store?: Store,
): {
	readonly relations: Junction<ASide, BSide, Content>
	readonly states: JoinState<ASide, BSide, Cardinality, Content>
	readonly transact: (
		transactors: Transactors,
		run: (join: Join<ASide, BSide, Cardinality, Content>) => void,
	) => void
	readonly core: {
		readonly findRelatedKeysState: MutableAtomFamily<
			SetRTX<string>,
			SetRTXJson<string>,
			string
		>
	}
}
export function join<
	ASide extends string,
	BSide extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object,
>(
	options: JoinOptions<ASide, BSide, Cardinality, Content>,
	defaultContent: Content | undefined,
	store: Store = IMPLICIT.STORE,
): Join<ASide, BSide, Cardinality, Content> {
	return new Join(options, defaultContent, store)
}
