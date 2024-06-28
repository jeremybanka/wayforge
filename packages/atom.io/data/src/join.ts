/* eslint-disable @typescript-eslint/ban-types */
import type {
	CtorToolkit,
	disposeState,
	getState,
	MoleculeFamilyToken,
	MutableAtomFamily,
	MutableAtomFamilyToken,
	Read,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlySelectorFamily,
	ReadonlySelectorToken,
	RegularAtomFamily,
	setState,
	SetterToolkit,
	Write,
} from "atom.io"
import type { findState } from "atom.io/ephemeral"
import type { seekState } from "atom.io/immortal"
import type { Molecule, Store } from "atom.io/internal"
import {
	createMoleculeFamily,
	createMutableAtomFamily,
	createRegularAtomFamily,
	createSelectorFamily,
	disposeFromStore,
	findInStore,
	getFromStore,
	getJsonFamily,
	getJsonToken,
	growMoleculeInStore,
	IMPLICIT,
	initFamilyMemberInStore,
	isChildStore,
	makeMoleculeInStore,
	newest,
	seekInStore,
	setIntoStore,
	withdraw,
} from "atom.io/internal"
import { type Json, stringifyJson } from "atom.io/json"
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
	private toolkit: SetterToolkit & { dispose: typeof disposeState }
	public retrieve: typeof findState
	public molecules: Map<string, Molecule<any>> = new Map()
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
		toolkit: SetterToolkit & { dispose: typeof disposeState },
		run: (join: Join<ASide, BSide, Cardinality, Content>) => void,
	): void {
		const originalToolkit = this.toolkit
		this.toolkit = toolkit
		run(this)
		this.toolkit = originalToolkit
	}

	public store: Store
	public alternates: Map<string, Join<ASide, BSide, Cardinality, Content>>
	public [Symbol.dispose](): void {
		this.alternates.delete(this.store.config.name)
	}

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
		this.store = store
		this.options = options
		this.defaultContent = defaultContent
		this.alternates = new Map()
		this.alternates.set(store.config.name, this)

		this.store.miscResources.set(`join:${options.key}`, this)

		this.toolkit = {
			get: ((...ps: Parameters<typeof getState>) =>
				getFromStore(...ps, store)) as typeof getState,
			set: ((...ps: Parameters<typeof setState>) => {
				setIntoStore(...ps, store)
			}) as typeof setState,
			find: ((token, key) => findInStore(token, key, store)) as typeof findState,
			seek: ((token, key) => seekInStore(token, key, store)) as typeof seekState,
			json: (token) => getJsonToken(token, store),
			dispose: ((...ps: Parameters<typeof disposeState>) => {
				disposeFromStore(...ps, store)
			}) as typeof disposeState,
		}
		this.retrieve = ((
			token: ReadableFamilyToken<any, any>,
			key: Json.Serializable,
		): ReadableToken<any> => {
			const maybeToken = this.toolkit.seek(token, key)
			if (maybeToken) {
				return maybeToken
			}
			const molecule = this.molecules.get(stringifyJson(key))
			if (molecule) {
				const family = withdraw(token, store)
				return growMoleculeInStore(molecule, family, store)
			}
			if (store.config.lifespan === `immortal`) {
				throw new Error(`No molecule found for key "${stringifyJson(key)}"`)
			}
			return initFamilyMemberInStore(token, key, store)
		}) as typeof findState
		const aSide: ASide = options.between[0]
		const bSide: BSide = options.between[1]
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
			{ get },
			key,
		) => get(this.retrieve(relatedKeysAtoms, key))
		const addRelation: Write<(a: string, b: string) => void> = (
			toolkit,
			a,
			b,
		) => {
			const { set } = toolkit
			const aKeysState = this.retrieve(relatedKeysAtoms, a)
			const bKeysState = this.retrieve(relatedKeysAtoms, b)
			set(aKeysState, (aKeys) => aKeys.add(b))
			set(bKeysState, (bKeys) => bKeys.add(a))
		}
		const deleteRelation: Write<(a: string, b: string) => void> = (
			toolkit,
			a,
			b,
		) => {
			const { set } = toolkit
			const aKeysState = this.retrieve(relatedKeysAtoms, a)
			const bKeysState = this.retrieve(relatedKeysAtoms, b)
			let stringA: string | undefined
			let stringB: string | undefined
			set(aKeysState, (aKeys) => {
				aKeys.delete(b)
				if (aKeys.size === 0) {
					stringA = `"${a}"`
				}
				return aKeys
			})
			set(bKeysState, (bKeys) => {
				bKeys.delete(a)
				if (bKeys.size === 0) {
					stringB = `"${b}"`
				}
				return bKeys
			})

			if (stringA) {
				const molecule = this.molecules.get(stringA)
				if (molecule) {
					this.toolkit.dispose(molecule)
				}
			}
			if (stringB) {
				const molecule = this.molecules.get(stringB)
				if (molecule) {
					this.toolkit.dispose(molecule)
				}
			}
		}
		const replaceRelationsSafely: Write<
			(a: string, newRelationsOfA: string[]) => void
		> = (toolkit, a, newRelationsOfA) => {
			const { get, set } = toolkit
			const relationsOfAState = this.retrieve(relatedKeysAtoms, a)
			const currentRelationsOfA = get(relationsOfAState)
			for (const currentRelationB of currentRelationsOfA) {
				const remainsRelated = newRelationsOfA.includes(currentRelationB)
				if (remainsRelated) {
					continue
				}
				const relationsOfBState = this.retrieve(
					relatedKeysAtoms,
					currentRelationB,
				)
				set(relationsOfBState, (relationsOfB) => {
					relationsOfB.delete(a)
					return relationsOfB
				})
			}
			set(relationsOfAState, (relationsOfA) => {
				relationsOfA.transaction((nextRelationsOfA) => {
					nextRelationsOfA.clear()
					for (const newRelationB of newRelationsOfA) {
						const relationsOfB = getRelatedKeys(toolkit, newRelationB)
						const newRelationBIsAlreadyRelated = relationsOfB.has(a)
						if (this.relations.cardinality === `1:n`) {
							const previousOwnersToDispose: string[] = []
							for (const previousOwner of relationsOfB) {
								if (previousOwner === a) {
									continue
								}
								const previousOwnerRelations = getRelatedKeys(
									toolkit,
									previousOwner,
								)
								previousOwnerRelations.delete(newRelationB)
								if (previousOwnerRelations.size === 0) {
									previousOwnersToDispose.push(previousOwner)
								}
							}
							if (!newRelationBIsAlreadyRelated && relationsOfB.size > 0) {
								relationsOfB.clear()
							}
							for (const previousOwner of previousOwnersToDispose) {
								const molecule = this.molecules.get(previousOwner)
								if (molecule) {
									this.toolkit.dispose(molecule)
								}
								const sorted = [newRelationB, previousOwner].sort()
								const compositeKey = `"${sorted[0]}:${sorted[1]}"`
								this.molecules.delete(compositeKey)
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
		> = (toolkit, a, newRelationsOfA) => {
			const { set } = toolkit
			const relationsOfAState = this.retrieve(relatedKeysAtoms, a)
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
				const newRelationsBState = this.retrieve(relatedKeysAtoms, newRelationB)
				set(newRelationsBState, (newRelationsB) => {
					newRelationsB.add(a)
					return newRelationsB
				})
			}
			return true
		}
		const has: Read<(a: string, b?: string) => boolean> = (toolkit, a, b) => {
			const aKeys = getRelatedKeys(toolkit, a)
			return b ? aKeys.has(b) : aKeys.size > 0
		}
		const baseExternalStoreConfiguration: BaseExternalStoreConfiguration = {
			getRelatedKeys: (key) => getRelatedKeys(this.toolkit, key),
			addRelation: (a, b) => {
				addRelation(this.toolkit, a, b)
			},
			deleteRelation: (a, b) => {
				deleteRelation(this.toolkit, a, b)
			},
			replaceRelationsSafely: (a, bs) => {
				replaceRelationsSafely(this.toolkit, a, bs)
			},
			replaceRelationsUnsafely: (a, bs) => {
				replaceRelationsUnsafely(this.toolkit, a, bs)
			},
			has: (a, b) => has(this.toolkit, a, b),
		}
		let externalStore: ExternalStoreConfiguration<Content>
		let contentAtoms: RegularAtomFamily<Content, string>
		let contentMolecules: MoleculeFamilyToken<
			new (
				..._: any[]
			) => { key: string }
		>
		if (defaultContent) {
			contentAtoms = createRegularAtomFamily<Content, string>(
				{
					key: `${options.key}/content`,
					default: defaultContent,
				},
				store,
			)
			const joinToken = {
				key: options.key,
				type: `join`,
				a: options.between[0],
				b: options.between[1],
				cardinality: options.cardinality,
			} as const satisfies JoinToken<ASide, BSide, Cardinality, Content>
			contentMolecules = createMoleculeFamily(
				{
					key: `${options.key}/content-molecules`,
					new: class ContentMolecule {
						public constructor(
							toolkit: CtorToolkit<string>,
							public key: string,
						) {
							toolkit.bond(joinToken, { as: null } as any)
						}
					},
				},
				store,
			)
			const getContent: Read<(key: string) => Content | null> = ({ get }, key) =>
				get(this.retrieve(contentAtoms, key))
			const setContent: Write<(key: string, content: Content) => void> = (
				{ set },
				key,
				content,
			) => {
				set(this.retrieve(contentAtoms, key), content)
			}
			const deleteContent: Write<(compositeKey: string) => void> = (
				_,
				compositeKey,
			) => {
				const contentMolecule = store.molecules.get(`"${compositeKey}"`)
				if (contentMolecule) {
					this.toolkit.dispose(contentMolecule)
					this.molecules.delete(`"${compositeKey}"`)
				}
			}
			const externalStoreWithContentConfiguration = {
				getContent: (contentKey: string) => {
					const content = getContent(this.toolkit, contentKey)
					return content
				},
				setContent: (contentKey: string, content: Content) => {
					setContent(this.toolkit, contentKey, content)
				},
				deleteContent: (contentKey: string) => {
					deleteContent(this.toolkit, contentKey)
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
			makeContentKey: (...args) => {
				const sorted = args.sort()
				const compositeKey = `${sorted[0]}:${sorted[1]}`
				const [m0, m1] = sorted.map((key) =>
					this.molecules.get(stringifyJson(key)),
				)
				if (store.config.lifespan === `immortal` && m0 && m1) {
					const target = newest(store)
					const moleculeToken = makeMoleculeInStore(
						target,
						[m0, m1],
						contentMolecules,
						compositeKey,
					)
					this.molecules.set(
						`"${compositeKey}"`,
						withdraw(moleculeToken, target),
					)
				}
				return compositeKey
			},
		})

		const createSingleKeyStateFamily = () =>
			createSelectorFamily<string | null, string>(
				{
					key: `${options.key}/singleRelatedKey`,
					get:
						(key) =>
						({ get }) => {
							const relatedKeysState = this.retrieve(relatedKeysAtoms, key)
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
						({ get }) => {
							const jsonFamily = getJsonFamily(relatedKeysAtoms, store)
							const jsonState = this.retrieve(jsonFamily, key)
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
						({ get }) => {
							const relatedKeysState = this.retrieve(relatedKeysAtoms, key)
							const relatedKeys = get(relatedKeysState)
							for (const relatedKey of relatedKeys) {
								const contentKey = relations.makeContentKey(key, relatedKey)
								const contentState = this.retrieve(contentAtoms, contentKey)
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
						({ get }) => {
							const jsonFamily = getJsonFamily(relatedKeysAtoms, store)
							const jsonState = this.retrieve(jsonFamily, key)
							const json = get(jsonState)
							return json.members.map((relatedKey) => {
								const contentKey = relations.makeContentKey(key, relatedKey)
								const contentState = this.retrieve(contentAtoms, contentKey)
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
				const stateKeyA = `${aSide}KeyOf${capitalize(bSide)}` as const
				const stateKeyB = `${bSide}KeyOf${capitalize(aSide)}` as const
				const baseStates = {
					[stateKeyA]: findSingleRelatedKeyState,
					[stateKeyB]: findSingleRelatedKeyState,
				} as JoinStateFamilies<ASide, BSide, Cardinality, Content>
				let states: JoinStateFamilies<ASide, BSide, Cardinality, Content>
				if (defaultContent) {
					const findSingleRelatedEntryState = createSingleEntryStateFamily()
					const entriesStateKeyA = `${aSide}EntryOf${capitalize(bSide)}` as const
					const entriesStateKeyB = `${bSide}EntryOf${capitalize(aSide)}` as const
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
				const stateKeyA = `${aSide}KeyOf${capitalize(bSide)}` as const
				const stateKeyB = `${bSide}KeysOf${capitalize(aSide)}` as const
				const baseStates = {
					[stateKeyA]: findSingleRelatedKeyState,
					[stateKeyB]: findMultipleRelatedKeysState,
				} as JoinStateFamilies<ASide, BSide, Cardinality, Content>
				let states: JoinStateFamilies<ASide, BSide, Cardinality, Content>
				if (defaultContent) {
					const findSingleRelatedEntryState = createSingleEntryStateFamily()
					const findMultipleRelatedEntriesState = getMultipleEntryStateFamily()
					const entriesStateKeyA = `${aSide}EntryOf${capitalize(bSide)}` as const
					const entriesStateKeyB = `${bSide}EntriesOf${capitalize(
						aSide,
					)}` as const
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
				const stateKeyA = `${aSide}KeysOf${capitalize(bSide)}` as const
				const stateKeyB = `${bSide}KeysOf${capitalize(aSide)}` as const
				const baseStates = {
					[stateKeyA]: findMultipleRelatedKeysState,
					[stateKeyB]: findMultipleRelatedKeysState,
				} as JoinStateFamilies<ASide, BSide, Cardinality, Content>
				let states: JoinStateFamilies<ASide, BSide, Cardinality, Content>
				if (defaultContent) {
					const findMultipleRelatedEntriesState = getMultipleEntryStateFamily()
					const entriesStateKeyA = `${aSide}EntriesOf${capitalize(
						bSide,
					)}` as const
					const entriesStateKeyB = `${bSide}EntriesOf${capitalize(
						aSide,
					)}` as const
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
	let myJoin = joinMap.get(token.key)
	if (myJoin === undefined) {
		const rootJoinMap = getJoinMap(IMPLICIT.STORE)
		myJoin = rootJoinMap.get(token.key)?.in(store)
		if (myJoin === undefined) {
			throw new Error(
				`Join "${token.key}" not found in store "${store.config.name}"`,
			)
		}
		joinMap.set(token.key, myJoin)
	}
	return myJoin
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
	const myJoin = getJoin(token, store)
	let relations: JoinStates<ASide, BSide, Cardinality, Content>
	switch (token.cardinality satisfies `1:1` | `1:n` | `n:n`) {
		case `1:1`: {
			const keyAB = `${token.a}KeyOf${capitalize(token.b)}`
			const keyBA = `${token.b}KeyOf${capitalize(token.a)}`
			relations = {
				get [keyAB]() {
					const familyAB = myJoin.states[keyAB as any]
					const state = myJoin.retrieve(familyAB, key)
					return state
				},
				get [keyBA]() {
					const familyBA = myJoin.states[keyBA as any]
					const state = myJoin.retrieve(familyBA, key)
					return state
				},
			} as JoinStates<ASide, BSide, Cardinality, Content>
			const entryAB = `${token.a}EntryOf${capitalize(token.b)}`
			if (entryAB in myJoin.states) {
				const entryBA = `${token.b}EntryOf${capitalize(token.a)}`
				Object.assign(relations, {
					get [entryAB]() {
						const familyAB = myJoin.states[entryAB as any]
						const state = myJoin.retrieve(familyAB, key)
						return state
					},
					get [entryBA]() {
						const familyBA = myJoin.states[entryBA as any]
						const state = myJoin.retrieve(familyBA, key)
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
					const familyAB = myJoin.states[keyAB as any]
					const state = myJoin.retrieve(familyAB, key)
					return state
				},
				get [keysBA]() {
					const familyBA = myJoin.states[keysBA as any]
					const state = myJoin.retrieve(familyBA, key)
					return state
				},
			} as JoinStates<ASide, BSide, Cardinality, Content>
			const entryAB = `${token.a}EntryOf${capitalize(token.b)}`
			if (entryAB in myJoin.states) {
				const entriesBA = `${token.b}EntriesOf${capitalize(token.a)}`
				Object.assign(relations, {
					get [entryAB]() {
						const familyAB = myJoin.states[entryAB as any]
						const state = myJoin.retrieve(familyAB, key)
						return state
					},
					get [entriesBA]() {
						const familyBA = myJoin.states[entriesBA as any]
						const state = myJoin.retrieve(familyBA, key)
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
					const familyAB = myJoin.states[keysAB as any]
					const state = myJoin.retrieve(familyAB, key)
					return state
				},
				get [keysBA]() {
					const familyBA = myJoin.states[keysBA as any]
					const state = myJoin.retrieve(familyBA, key)
					return state
				},
			} as JoinStates<ASide, BSide, Cardinality, Content>
			const entriesAB = `${token.a}EntriesOf${capitalize(token.b)}`
			if (entriesAB in myJoin.states) {
				const entriesBA = `${token.b}EntriesOf${capitalize(token.a)}`
				Object.assign(relations, {
					get [entriesAB]() {
						const familyAB = myJoin.states[entriesAB as any]
						const state = myJoin.retrieve(familyAB, key)
						return state
					},
					get [entriesBA]() {
						const familyBA = myJoin.states[entriesBA as any]
						const state = myJoin.retrieve(familyBA, key)
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
	const myJoin = getJoin(token, store)
	const target = newest(store)
	if (isChildStore(target)) {
		const { toolkit } = target.transactionMeta
		myJoin.transact(toolkit, ({ relations }) => {
			change(relations)
		})
	} else {
		change(myJoin.relations)
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
	const myJoin = getJoin(token, store)
	const family = myJoin.core.findRelatedKeysState
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
