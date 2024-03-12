/* eslint-disable @typescript-eslint/ban-types */
import type {
	MutableAtomFamily,
	MutableAtomFamilyToken,
	Read,
	ReadonlySelectorFamily,
	ReadonlySelectorToken,
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
	findInStore,
	getFromStore,
	getJsonFamily,
	isChildStore,
	newest,
	setIntoStore,
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

export type JoinStateFamilies<
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
	private options: JoinOptions<ASide, BSide, Cardinality, Content>
	private defaultContent: Content | undefined
	private transactors: Transactors
	public relations: Junction<ASide, BSide, Content>
	public states: JoinStateFamilies<ASide, BSide, Cardinality, Content>
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
		const originalTransactors = this.transactors
		this.transactors = transactors
		run(this)
		this.transactors = originalTransactors
	}

	public alternates: Map<string, Join<ASide, BSide, Cardinality, Content>>
	public in(store: Store): Join<ASide, BSide, Cardinality, Content> {
		const key = store.config.name
		const alternate = this.alternates.get(key)
		if (alternate) {
			return alternate
		}
		const join = new Join(this.options, this.defaultContent, store)
		this.alternates.set(key, join)
		join.alternates = this.alternates
		return join
	}

	public constructor(
		options: JoinOptions<ASide, BSide, Cardinality, Content>,
		defaultContent: Content | undefined,
		store: Store = IMPLICIT.STORE,
	) {
		this.options = options
		this.defaultContent = defaultContent
		this.alternates = new Map()
		this.alternates.set(store.config.name, this)
		this.transactors = {
			get: (token) => getFromStore(token, store),
			set: (token, value) => {
				setIntoStore(token, value, store)
			},
			find: ((token, key) => findInStore(token, key, store)) as typeof findState,
		}
		const aa: ASide = options.between[0]
		const bb: BSide = options.between[1]
		const relatedKeysAtoms = createMutableAtomFamily<
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
		this.core = { findRelatedKeysState: relatedKeysAtoms }
		const getRelatedKeys: Read<(key: string) => SetRTX<string>> = (
			{ find, get },
			key,
		) => get(find(relatedKeysAtoms, key))
		const addRelation: Write<(a: string, b: string) => void> = (
			transactors,
			a,
			b,
		) => {
			const { set, find } = transactors
			const aKeysState = find(relatedKeysAtoms, a)
			const bKeysState = find(relatedKeysAtoms, b)
			set(aKeysState, (aKeys) => aKeys.add(b))
			set(bKeysState, (bKeys) => bKeys.add(a))
		}
		const deleteRelation: Write<(a: string, b: string) => void> = (
			transactors,
			a,
			b,
		) => {
			const { find, set } = transactors
			const aKeysState = find(relatedKeysAtoms, a)
			const bKeysState = find(relatedKeysAtoms, b)
			set(aKeysState, (aKeys) => (aKeys.delete(b), aKeys))
			set(bKeysState, (bKeys) => (bKeys.delete(a), bKeys))
		}
		const replaceRelationsSafely: Write<
			(a: string, newRelationsOfA: string[]) => void
		> = (transactors, a, newRelationsOfA) => {
			const { find, get, set } = transactors
			const relationsOfAState = find(relatedKeysAtoms, a)
			const currentRelationsOfA = get(relationsOfAState)
			for (const currentRelationB of currentRelationsOfA) {
				const remainsRelated = newRelationsOfA.includes(currentRelationB)
				if (remainsRelated) {
					continue
				}
				const relationsOfBState = find(relatedKeysAtoms, currentRelationB)
				set(relationsOfBState, (relationsOfB) => {
					relationsOfB.delete(a)
					return relationsOfB
				})
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
			const { find, set } = transactors
			const relationsOfAState = find(relatedKeysAtoms, a)
			set(relationsOfAState, (relationsOfA) => {
				relationsOfA.transaction((nextRelationsOfA) => {
					for (const newRelationB of newRelationsOfA) {
						nextRelationsOfA.add(newRelationB)
					}
					return true
				})
				return relationsOfA
			})
			for (const newRelationB of newRelationsOfA) {
				const newRelationsBState = find(relatedKeysAtoms, newRelationB)
				set(newRelationsBState, (newRelationsB) => {
					newRelationsB.add(a)
					return newRelationsB
				})
			}
			return true
		}
		const has: Read<(a: string, b?: string) => boolean> = (
			transactors,
			a,
			b,
		) => {
			const aKeys = getRelatedKeys(transactors, a)
			return b === undefined ? aKeys.size > 0 : aKeys.has(b)
		}
		const baseExternalStoreConfiguration: BaseExternalStoreConfiguration = {
			getRelatedKeys: (key) => getRelatedKeys(this.transactors, key),
			addRelation: (a, b) => {
				addRelation(this.transactors, a, b)
			},
			deleteRelation: (a, b) => {
				deleteRelation(this.transactors, a, b)
			},
			replaceRelationsSafely: (a, bs) => {
				replaceRelationsSafely(this.transactors, a, bs)
			},
			replaceRelationsUnsafely: (a, bs) => {
				replaceRelationsUnsafely(this.transactors, a, bs)
			},
			has: (a, b) => has(this.transactors, a, b),
		}
		let externalStore: ExternalStoreConfiguration<Content>
		let contentAtoms: RegularAtomFamily<Content, string>
		if (defaultContent) {
			contentAtoms = createRegularAtomFamily<Content, string>(
				{
					key: `${options.key}/content`,
					default: defaultContent,
				},
				store,
			)
			const getContent: Read<(key: string) => Content | null> = (
				{ find, get },
				key,
			) => get(find(contentAtoms, key))
			const setContent: Write<(key: string, content: Content) => void> = (
				{ find, set },
				key,
				content,
			) => {
				set(find(contentAtoms, key), content)
			}
			const deleteContent: Write<(key: string) => void> = ({ find }, key) => {
				dispose(find(contentAtoms, key))
			}
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
						({ find, get }) => {
							const relatedKeysState = find(relatedKeysAtoms, key)
							const relatedKeys = get(relatedKeysState)
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
						({ find, get }) => {
							const jsonFamily = getJsonFamily(relatedKeysAtoms, store)
							const jsonState = find(jsonFamily, key)
							const json = get(jsonState)
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
						({ find, get }) => {
							const relatedKeysState = find(relatedKeysAtoms, key)
							const relatedKeys = get(relatedKeysState)
							for (const relatedKey of relatedKeys) {
								const contentKey = relations.makeContentKey(key, relatedKey)
								const contentState = find(contentAtoms, contentKey)
								const content = get(contentState)
								return [relatedKey, content]
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
						({ find, get }) => {
							const jsonFamily = getJsonFamily(relatedKeysAtoms, store)
							const json = get(jsonFamily(key))
							return json.members.map((relatedKey) => {
								const contentKey = relations.makeContentKey(key, relatedKey)
								const contentState = find(contentAtoms, contentKey)
								const content = get(contentState)
								return [relatedKey, content]
							})
						},
				},
				store,
			)

		switch (options.cardinality) {
			case `1:1`: {
				const findSingleRelatedKeyState = createSingleKeyStateFamily()
				const stateKeyA = `${aa}KeyOf${capitalize(bb)}` as const
				const stateKeyB = `${bb}KeyOf${capitalize(aa)}` as const
				const baseStates = {
					[stateKeyA]: findSingleRelatedKeyState,
					[stateKeyB]: findSingleRelatedKeyState,
				} as JoinStateFamilies<ASide, BSide, Cardinality, Content>
				let states: JoinStateFamilies<ASide, BSide, Cardinality, Content>
				if (defaultContent) {
					const findSingleRelatedEntryState = createSingleEntryStateFamily()
					const entriesStateKeyA = `${aa}EntryOf${capitalize(bb)}` as const
					const entriesStateKeyB = `${bb}EntryOf${capitalize(aa)}` as const
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
				const stateKeyA = `${aa}KeyOf${capitalize(bb)}` as const
				const stateKeyB = `${bb}KeysOf${capitalize(aa)}` as const
				const baseStates = {
					[stateKeyA]: findSingleRelatedKeyState,
					[stateKeyB]: findMultipleRelatedKeysState,
				} as JoinStateFamilies<ASide, BSide, Cardinality, Content>
				let states: JoinStateFamilies<ASide, BSide, Cardinality, Content>
				if (defaultContent) {
					const findSingleRelatedEntryState = createSingleEntryStateFamily()
					const findMultipleRelatedEntriesState = getMultipleEntryStateFamily()
					const entriesStateKeyA = `${aa}EntryOf${capitalize(bb)}` as const
					const entriesStateKeyB = `${bb}EntriesOf${capitalize(aa)}` as const
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
				const stateKeyA = `${aa}KeysOf${capitalize(bb)}` as const
				const stateKeyB = `${bb}KeysOf${capitalize(aa)}` as const
				const baseStates = {
					[stateKeyA]: findMultipleRelatedKeysState,
					[stateKeyB]: findMultipleRelatedKeysState,
				} as JoinStateFamilies<ASide, BSide, Cardinality, Content>
				let states: JoinStateFamilies<ASide, BSide, Cardinality, Content>
				if (defaultContent) {
					const findMultipleRelatedEntriesState = getMultipleEntryStateFamily()
					const entriesStateKeyA = `${aa}EntriesOf${capitalize(bb)}` as const
					const entriesStateKeyB = `${bb}EntriesOf${capitalize(aa)}` as const
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

export type JoinToken<
	ASide extends string,
	BSide extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object | null = null,
> = {
	key: string
	type: `join`
	cardinality: Cardinality
	a: ASide
	b: BSide
	__content?: Content
}

export function join<
	const ASide extends string,
	const BSide extends string,
	const Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	options: JoinOptions<ASide, BSide, Cardinality, null>,
	defaultContent?: undefined,
	store?: Store,
): JoinToken<ASide, BSide, Cardinality, null>
export function join<
	const ASide extends string,
	const BSide extends string,
	const Cardinality extends `1:1` | `1:n` | `n:n`,
	const Content extends Json.Object,
>(
	options: JoinOptions<ASide, BSide, Cardinality, Content>,
	defaultContent: Content,
	store?: Store,
): JoinToken<ASide, BSide, Cardinality, Content>
export function join<
	ASide extends string,
	BSide extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object,
>(
	options: JoinOptions<ASide, BSide, Cardinality, Content>,
	defaultContent: Content | undefined,
	store: Store = IMPLICIT.STORE,
): JoinToken<ASide, BSide, Cardinality, Content> {
	const joins = getJoinMap(store)
	joins.set(options.key, new Join(options, defaultContent, store))
	const token: JoinToken<ASide, BSide, Cardinality, Content> = {
		key: options.key,
		type: `join`,
		a: options.between[0],
		b: options.between[1],
		cardinality: options.cardinality,
	}
	return token
}

export function getJoinMap(
	store: Store & { joins?: Map<string, Join<any, any, any, any>> },
): Map<string, Join<any, any, any, any>> {
	if (`joins` in store && store.joins instanceof Map) {
		return store.joins
	}
	const joins = new Map<string, Join<any, any, any, any>>()
	store.joins = joins
	return joins
}
export function getJoin<
	ASide extends string,
	BSide extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object | null,
>(
	token: JoinToken<ASide, BSide, Cardinality, Content>,
	store: Store,
): Join<ASide, BSide, Cardinality, Content> {
	const joinMap = getJoinMap(store)
	let j = joinMap.get(token.key)
	if (j === undefined) {
		const rootJoinMap = getJoinMap(IMPLICIT.STORE)
		j = rootJoinMap.get(token.key)?.in(store)
		if (j === undefined) {
			throw new Error(
				`Join "${token.key}" not found in store "${store.config.name}"`,
			)
		}
		joinMap.set(token.key, j)
	}
	return j
}

export type JoinStates<
	ASide extends string,
	BSide extends string,
	Cardinality extends Rel8.Cardinality,
	Content extends Json.Object | null,
> = Cardinality extends `1:1`
	? (Content extends Json.Object
			? {
					readonly [AB in ASide | BSide as AB extends ASide
						? `${AB}EntryOf${Capitalize<BSide>}`
						: `${AB}EntryOf${Capitalize<ASide>}`]: ReadonlySelectorToken<
						[string, Content] | null
					>
			  }
			: {}) & {
			readonly [AB in ASide | BSide as AB extends ASide
				? `${AB}KeyOf${Capitalize<BSide>}`
				: `${AB}KeyOf${Capitalize<ASide>}`]: ReadonlySelectorToken<string | null>
	  }
	: Cardinality extends `1:n`
	  ? (Content extends Json.Object
				? {
						readonly [A in ASide as `${A}EntryOf${Capitalize<BSide>}`]: ReadonlySelectorToken<
							[string, Content] | null
						>
				  } & {
						readonly [B in BSide as `${B}EntriesOf${Capitalize<ASide>}`]: ReadonlySelectorToken<
							[string, Content][]
						>
				  }
				: {}) & {
				readonly [A in ASide as `${A}KeyOf${Capitalize<BSide>}`]: ReadonlySelectorToken<
					string | null
				>
		  } & {
				readonly [B in BSide as `${B}KeysOf${Capitalize<ASide>}`]: ReadonlySelectorToken<
					string[]
				>
		  }
	  : Cardinality extends `n:n`
		  ? (Content extends Json.Object
					? {
							readonly [AB in ASide | BSide as AB extends ASide
								? `${AB}EntriesOf${Capitalize<BSide>}`
								: `${AB}EntriesOf${Capitalize<ASide>}`]: ReadonlySelectorToken<
								[string, Content][]
							>
					  }
					: {}) & {
					readonly [AB in ASide | BSide as AB extends ASide
						? `${AB}KeysOf${Capitalize<BSide>}`
						: `${AB}KeysOf${Capitalize<ASide>}`]: ReadonlySelectorToken<string[]>
			  }
		  : never

export function findRelationsInStore<
	ASide extends string,
	BSide extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object | null,
>(
	token: JoinToken<ASide, BSide, Cardinality, Content>,
	key: string,
	store: Store,
): JoinStates<ASide, BSide, Cardinality, Content> {
	const j = getJoin(token, store)
	let relations: JoinStates<ASide, BSide, Cardinality, Content>
	switch (token.cardinality satisfies `1:1` | `1:n` | `n:n`) {
		case `1:1`: {
			const keyAB = `${token.a}KeyOf${capitalize(token.b)}`
			const keyBA = `${token.b}KeyOf${capitalize(token.a)}`
			relations = {
				get [keyAB]() {
					const familyAB = j.states[keyAB as any]
					const state = findInStore(familyAB, key, store)
					return state
				},
				get [keyBA]() {
					const familyBA = j.states[keyBA as any]
					const state = findInStore(familyBA, key, store)
					return state
				},
			} as JoinStates<ASide, BSide, Cardinality, Content>
			const entryAB = `${token.a}EntryOf${capitalize(token.b)}`
			if (entryAB in j.states) {
				const entryBA = `${token.b}EntryOf${capitalize(token.a)}`
				Object.assign(relations, {
					get [entryAB]() {
						const familyAB = j.states[entryAB as any]
						const state = findInStore(familyAB, key, store)
						return state
					},
					get [entryBA]() {
						const familyBA = j.states[entryBA as any]
						const state = findInStore(familyBA, key, store)
						return state
					},
				})
			}
			break
		}
		case `1:n`: {
			const keyAB = `${token.a}KeyOf${capitalize(token.b)}`
			const keysBA = `${token.b}KeysOf${capitalize(token.a)}`
			relations = {
				get [keyAB]() {
					const familyAB = j.states[keyAB as any]
					const state = findInStore(familyAB, key, store)
					return state
				},
				get [keysBA]() {
					const familyBA = j.states[keysBA as any]
					const state = findInStore(familyBA, key, store)
					return state
				},
			} as JoinStates<ASide, BSide, Cardinality, Content>
			const entryAB = `${token.a}EntryOf${capitalize(token.b)}`
			if (entryAB in j.states) {
				const entriesBA = `${token.b}EntriesOf${capitalize(token.a)}`
				Object.assign(relations, {
					get [entryAB]() {
						const familyAB = j.states[entryAB as any]
						const state = findInStore(familyAB, key, store)
						return state
					},
					get [entriesBA]() {
						const familyBA = j.states[entriesBA as any]
						const state = findInStore(familyBA, key, store)
						return state
					},
				})
			}
			break
		}
		case `n:n`: {
			const keysAB = `${token.a}KeysOf${capitalize(token.b)}`
			const keysBA = `${token.b}KeysOf${capitalize(token.a)}`
			relations = {
				get [keysAB]() {
					const familyAB = j.states[keysAB as any]
					const state = findInStore(familyAB, key, store)
					return state
				},
				get [keysBA]() {
					const familyBA = j.states[keysBA as any]
					const state = findInStore(familyBA, key, store)
					return state
				},
			} as JoinStates<ASide, BSide, Cardinality, Content>
			const entriesAB = `${token.a}EntriesOf${capitalize(token.b)}`
			if (entriesAB in j.states) {
				const entriesBA = `${token.b}EntriesOf${capitalize(token.a)}`
				Object.assign(relations, {
					get [entriesAB]() {
						const familyAB = j.states[entriesAB as any]
						const state = findInStore(familyAB, key, store)
						return state
					},
					get [entriesBA]() {
						const familyBA = j.states[entriesBA as any]
						const state = findInStore(familyBA, key, store)
						return state
					},
				})
			}
		}
	}
	return relations
}

export function findRelations<
	ASide extends string,
	BSide extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object | null,
>(
	token: JoinToken<ASide, BSide, Cardinality, Content>,
	key: string,
): JoinStates<ASide, BSide, Cardinality, Content> {
	return findRelationsInStore(token, key, IMPLICIT.STORE)
}

export function editRelationsInStore<
	ASide extends string,
	BSide extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object | null,
>(
	token: JoinToken<ASide, BSide, Cardinality, Content>,
	change: (relations: Junction<ASide, BSide, Content>) => void,
	store: Store,
): void {
	const j = getJoin(token, store)
	const target = newest(store)
	if (isChildStore(target)) {
		const { transactors } = target.transactionMeta
		j.transact(transactors, ({ relations }) => {
			change(relations)
		})
	} else {
		change(j.relations)
	}
}

export function editRelations<
	ASide extends string,
	BSide extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object | null,
>(
	token: JoinToken<ASide, BSide, Cardinality, Content>,
	change: (relations: Junction<ASide, BSide, Content>) => void,
): void {
	editRelationsInStore(token, change, IMPLICIT.STORE)
}

export function getInternalRelationsFromStore(
	token: JoinToken<any, any, any, any>,
	store: Store,
): MutableAtomFamilyToken<SetRTX<string>, SetRTXJson<string>, string> {
	const j = getJoin(token, store)
	const family = j.core.findRelatedKeysState
	return family
}

export function getInternalRelations<
	ASide extends string,
	BSide extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object | null,
>(
	token: JoinToken<ASide, BSide, Cardinality, Content>,
): MutableAtomFamilyToken<SetRTX<string>, SetRTXJson<string>, string> {
	return getInternalRelationsFromStore(token, IMPLICIT.STORE)
}
