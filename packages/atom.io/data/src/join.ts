import type {
	CompoundTypedKey,
	getState,
	Hierarchy,
	MutableAtomFamilyToken,
	Read,
	ReadonlySelectorFamilyToken,
	ReadonlySelectorToken,
	RegularAtomFamilyToken,
	setState,
	SetterToolkit,
	SingularTypedKey,
	Write,
} from "atom.io"
import { Anarchy, Realm } from "atom.io"
import type { findState } from "atom.io/ephemeral"
import type { seekState } from "atom.io/immortal"
import type {
	BaseExternalStoreConfiguration,
	ExternalStoreConfiguration,
	JunctionEntriesBase,
	JunctionSchemaBase,
	Molecule,
	Refinement,
	Store,
} from "atom.io/internal"
import {
	createMutableAtomFamily,
	createReadonlySelectorFamily,
	createRegularAtomFamily,
	findInStore,
	getFromStore,
	getJsonFamily,
	getJsonToken,
	IMPLICIT,
	isChildStore,
	Junction,
	newest,
	seekInStore,
	setIntoStore,
} from "atom.io/internal"
import type { Canonical, Json, stringified } from "atom.io/json"
import { stringifyJson } from "atom.io/json"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

function capitalize<S extends string>(string: S): Capitalize<S> {
	return (string[0].toUpperCase() + string.slice(1)) as Capitalize<S>
}

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

export type JoinStateFamilies<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object | null,
> = Cardinality extends `1:1`
	? (Content extends Json.Object
			? {
					readonly [A in ASide as `${A}EntryOf${Capitalize<BSide>}`]: ReadonlySelectorFamilyToken<
						[AType, Content] | null,
						BType
					>
				} & {
					readonly [B in BSide as `${B}EntryOf${Capitalize<ASide>}`]: ReadonlySelectorFamilyToken<
						[BType, Content] | null,
						AType
					>
				}
			: {}) & {
			readonly [A in ASide as `${A}KeyOf${Capitalize<BSide>}`]: ReadonlySelectorFamilyToken<
				AType | null,
				BType
			>
		} & {
			readonly [B in BSide as `${B}KeyOf${Capitalize<ASide>}`]: ReadonlySelectorFamilyToken<
				BType | null,
				AType
			>
		}
	: Cardinality extends `1:n`
		? (Content extends Json.Object
				? {
						readonly [A in ASide as `${A}EntryOf${Capitalize<BSide>}`]: ReadonlySelectorFamilyToken<
							[AType, Content] | null,
							BType
						>
					} & {
						readonly [B in BSide as `${B}EntriesOf${Capitalize<ASide>}`]: ReadonlySelectorFamilyToken<
							[BType, Content][],
							AType
						>
					}
				: {}) & {
				readonly [A in ASide as `${A}KeyOf${Capitalize<BSide>}`]: ReadonlySelectorFamilyToken<
					AType | null,
					BType
				>
			} & {
				readonly [B in BSide as `${B}KeysOf${Capitalize<ASide>}`]: ReadonlySelectorFamilyToken<
					BType[],
					AType
				>
			}
		: Cardinality extends `n:n`
			? (Content extends Json.Object
					? {
							readonly [A in ASide as `${A}EntriesOf${Capitalize<BSide>}`]: ReadonlySelectorFamilyToken<
								[AType, Content][],
								BType
							>
						} & {
							readonly [B in BSide as `${B}EntriesOf${Capitalize<ASide>}`]: ReadonlySelectorFamilyToken<
								[BType, Content][],
								AType
							>
						}
					: {}) & {
					readonly [A in ASide as `${A}KeysOf${Capitalize<BSide>}`]: ReadonlySelectorFamilyToken<
						AType[],
						BType
					>
				} & {
					readonly [B in BSide as `${B}KeysOf${Capitalize<ASide>}`]: ReadonlySelectorFamilyToken<
						BType[],
						AType
					>
				}
			: never

export type JoinHierarchy<
	AType extends SingularTypedKey,
	BType extends SingularTypedKey,
> = Hierarchy<
	[
		{
			above: `root`
			below: [AType, BType]
		},
		{
			above: [AType, BType]
			style: `all`
			below: CompoundTypedKey<`content`, AType, BType>
		},
	]
>

export class Join<
	const ASide extends string,
	const AType extends string,
	const BSide extends string,
	const BType extends string,
	const Cardinality extends `1:1` | `1:n` | `n:n`,
	const Content extends Json.Object | null = null,
	const ContentKey extends CompoundTypedKey<
		`content`,
		ASide,
		BSide
	> = CompoundTypedKey<`content`, ASide, BSide>,
> {
	private toolkit: SetterToolkit
	public options: JoinOptions<ASide, AType, BSide, BType, Cardinality, Content>
	public defaultContent: Content | undefined
	public molecules: Map<string, Molecule<any>> = new Map()
	public relations: Junction<ASide, AType, BSide, BType, Content>
	public states: JoinStateFamilies<
		ASide,
		AType,
		BSide,
		BType,
		Cardinality,
		Content
	>
	public core: {
		relatedKeysAtoms: MutableAtomFamilyToken<
			SetRTX<string>,
			SetRTXJson<string>,
			string
		>
	}
	public transact(
		toolkit: SetterToolkit,
		run: (join: Join<ASide, AType, BSide, BType, Cardinality, Content>) => void,
	): void {
		const originalToolkit = this.toolkit
		this.toolkit = toolkit
		run(this)
		this.toolkit = originalToolkit
	}

	public store: Store
	public realm: Anarchy

	public [Symbol.dispose](): void {}

	public constructor(
		options: JoinOptions<ASide, AType, BSide, BType, Cardinality, Content>,
		defaultContent: Content | undefined,
		store: Store = IMPLICIT.STORE,
	) {
		type AnyKey = AType & BType

		this.store = store
		this.realm = new Anarchy(store)
		this.options = options
		this.defaultContent = defaultContent

		this.store.miscResources.set(`join:${options.key}`, this)

		this.realm.allocate(`root`, options.key)

		this.toolkit = {
			get: ((...ps: Parameters<typeof getState>) =>
				getFromStore(store, ...ps)) as typeof getState,
			set: ((...ps: Parameters<typeof setState>) => {
				setIntoStore(store, ...ps)
			}) as typeof setState,
			find: ((...ps: Parameters<typeof findState>) =>
				findInStore(store, ...ps)) as typeof findState,
			seek: ((...ps: Parameters<typeof seekState>) =>
				seekInStore(store, ...ps)) as typeof seekState,
			json: (token) => getJsonToken(store, token),
		}

		const aSide: ASide = options.between[0]
		const bSide: BSide = options.between[1]
		const relatedKeysAtoms = createMutableAtomFamily<
			SetRTX<string>,
			SetRTXJson<string>,
			string
		>(
			store,
			{
				key: `${options.key}/relatedKeys`,
				default: () => new SetRTX(),
				mutable: true,
				fromJson: (json) => SetRTX.fromJSON(json),
				toJson: (set) => set.toJSON(),
			},
			[`join`, `relations`],
		)
		this.core = { relatedKeysAtoms }
		const getRelatedKeys: Read<
			(key: string) => SetRTX<AType> | SetRTX<BType>
		> = ({ get }, key) => get(relatedKeysAtoms, key) as any
		const addRelation: Write<(a: string, b: string) => void> = (
			{ set },
			a,
			b,
		) => {
			if (!this.store.molecules.has(stringifyJson(a))) {
				this.realm.allocate(options.key, a)
			}
			set(relatedKeysAtoms, a, (aKeys) => aKeys.add(b))
			set(relatedKeysAtoms, b, (bKeys) => bKeys.add(a))
		}
		const deleteRelation: Write<(a: string, b: string) => void> = (
			{ set },
			a,
			b,
		) => {
			set(relatedKeysAtoms, a, (aKeys) => {
				aKeys.delete(b)
				return aKeys
			})
			set(relatedKeysAtoms, b, (bKeys) => {
				bKeys.delete(a)
				return bKeys
			})
		}
		const replaceRelationsSafely: Write<
			(a: string, newRelationsOfA: string[]) => void
		> = (toolkit, a, newRelationsOfA) => {
			const { find, get, set } = toolkit
			const relationsOfAState = find(relatedKeysAtoms, a)
			const currentRelationsOfA = get(relationsOfAState)
			for (const currentRelationB of currentRelationsOfA) {
				const remainsRelated = newRelationsOfA.includes(currentRelationB)
				if (remainsRelated) {
					continue
				}
				set(relatedKeysAtoms, currentRelationB, (relationsOfB) => {
					relationsOfB.delete(a)
					return relationsOfB
				})
			}
			set(relationsOfAState, (relationsOfA) => {
				relationsOfA.transaction((nextRelationsOfA) => {
					nextRelationsOfA.clear()
					for (const newRelationB of newRelationsOfA) {
						const relationsOfB = getRelatedKeys(toolkit, newRelationB)
						const newRelationBIsAlreadyRelated = relationsOfB.has(a as AnyKey)
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
								previousOwnerRelations.delete(newRelationB as AnyKey)
								if (previousOwnerRelations.size === 0) {
									previousOwnersToDispose.push(previousOwner)
								}
							}
							if (!newRelationBIsAlreadyRelated && relationsOfB.size > 0) {
								relationsOfB.clear()
							}
							for (const previousOwner of previousOwnersToDispose) {
								const sorted = [newRelationB, previousOwner].sort()
								const compositeKey = `"${sorted[0]}:${sorted[1]}"`
								this.molecules.delete(compositeKey)
							}
						}
						if (!newRelationBIsAlreadyRelated) {
							relationsOfB.add(a as AnyKey)
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
			set(relatedKeysAtoms, a, (relationsOfA) => {
				relationsOfA.transaction((nextRelationsOfA) => {
					for (const newRelationB of newRelationsOfA) {
						nextRelationsOfA.add(newRelationB)
					}
					return true
				})
				return relationsOfA
			})
			for (const newRelationB of newRelationsOfA) {
				set(relatedKeysAtoms, newRelationB, (newRelationsB) => {
					newRelationsB.add(a)
					return newRelationsB
				})
			}
			return true
		}
		const has: Read<(a: string, b?: string) => boolean> = (toolkit, a, b) => {
			const aKeys = getRelatedKeys(toolkit, a)
			return b ? aKeys.has(b as AnyKey) : aKeys.size > 0
		}
		const baseExternalStoreConfiguration: BaseExternalStoreConfiguration = {
			getRelatedKeys: (key) => getRelatedKeys(this.toolkit, key),
			addRelation: (a, b) => {
				this.store.moleculeJoins.set(
					a as stringified<Canonical> /* 💥 RECONCILE */,
					options.key,
				)
				this.store.moleculeJoins.set(
					b as stringified<Canonical> /* 💥 RECONCILE */,
					options.key,
				)
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
		let contentAtoms: RegularAtomFamilyToken<Content, string>

		if (defaultContent) {
			contentAtoms = createRegularAtomFamily<Content, ContentKey>(
				store,
				{
					key: `${options.key}/content`,
					default: defaultContent,
				},
				[`join`, `content`],
			)

			const getContent: Read<(key: string) => Content | null> = ({ get }, key) =>
				get(contentAtoms, key)
			const setContent: Write<(key: string, content: Content) => void> = (
				{ set },
				key,
				content,
			) => {
				set(contentAtoms, key, content)
			}

			const externalStoreWithContentConfiguration = {
				getContent: (contentKey: ContentKey) => {
					const content = getContent(this.toolkit, contentKey)
					return content
				},
				setContent: (contentKey: ContentKey, content: Content) => {
					setContent(this.toolkit, contentKey, content)
				},
				deleteContent: (contentKey: ContentKey) => {
					this.realm.deallocate(contentKey)
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
		const relations = new Junction<ASide, AType, BSide, BType, Content>(
			options as any,
			{
				externalStore,
				isAType: options.isAType,
				isBType: options.isBType,
				makeContentKey: (...args) => {
					const [a, b] = args
					const sorted = args.sort()
					const compositeKey = `${sorted[0]}:${sorted[1]}`
					const aMolecule = store.molecules.get(stringifyJson(a))
					const bMolecule = store.molecules.get(stringifyJson(b))
					if (!aMolecule) {
						this.realm.allocate(options.key, a)
					}
					if (!bMolecule) {
						this.realm.allocate(options.key, b)
					}
					this.realm.allocate(a, compositeKey, `all`)
					this.realm.claim(b, compositeKey)
					this.store.moleculeJoins.set(compositeKey, options.key)
					return compositeKey
				},
			},
		)

		const createSingleKeySelectorFamily = () =>
			createReadonlySelectorFamily<string | null, string>(
				store,
				{
					key: `${options.key}/singleRelatedKey`,
					get:
						(key) =>
						({ get }) => {
							const relatedKeys = get(relatedKeysAtoms, key)
							for (const relatedKey of relatedKeys) {
								return relatedKey
							}
							return null
						},
				},
				[`join`, `keys`],
			)
		const getMultipleKeySelectorFamily = () => {
			return createReadonlySelectorFamily<string[], string>(
				store,
				{
					key: `${options.key}/multipleRelatedKeys`,
					get:
						(key) =>
						({ get }) => {
							const jsonFamily = getJsonFamily(relatedKeysAtoms, store)
							const json = get(jsonFamily, key)
							return json.members
						},
				},
				[`join`, `keys`],
			)
		}
		const createSingleEntrySelectorFamily = () =>
			createReadonlySelectorFamily<[string, Content] | null, string>(
				store,
				{
					key: `${options.key}/singleRelatedEntry`,
					get:
						(x) =>
						({ get }) => {
							const relatedKeys = get(relatedKeysAtoms, x)
							for (const y of relatedKeys) {
								let a = relations.isAType?.(x) ? x : undefined
								let b = a === undefined ? (x as BType) : undefined
								a ??= y as AType
								b ??= y as BType
								const contentKey = relations.makeContentKey(a, b)
								const content = get(contentAtoms, contentKey)
								return [y, content]
							}
							return null
						},
				},
				[`join`, `entries`],
			)
		const getMultipleEntrySelectorFamily = () =>
			createReadonlySelectorFamily<[string, Content][], string>(
				store,
				{
					key: `${options.key}/multipleRelatedEntries`,
					get:
						(x) =>
						({ get }) => {
							const jsonFamily = getJsonFamily(relatedKeysAtoms, store)
							const json = get(jsonFamily, x)
							return json.members.map((y) => {
								let a = relations.isAType?.(x) ? x : undefined
								let b = a === undefined ? (x as BType) : undefined
								a ??= y as AType
								b ??= y as BType
								const contentKey = relations.makeContentKey(a, b)
								const content = get(contentAtoms, contentKey)
								return [y, content]
							})
						},
				},
				[`join`, `entries`],
			)

		switch (options.cardinality) {
			case `1:1`: {
				const singleRelatedKeySelectors = createSingleKeySelectorFamily()
				const stateKeyA = `${aSide}KeyOf${capitalize(bSide)}` as const
				const stateKeyB = `${bSide}KeyOf${capitalize(aSide)}` as const
				const baseStates = {
					[stateKeyA]: singleRelatedKeySelectors,
					[stateKeyB]: singleRelatedKeySelectors,
				} as JoinStateFamilies<ASide, AType, BSide, BType, Cardinality, Content>
				let states: JoinStateFamilies<
					ASide,
					AType,
					BSide,
					BType,
					Cardinality,
					Content
				>
				if (defaultContent) {
					const singleEntrySelectors = createSingleEntrySelectorFamily()
					const entriesStateKeyA = `${aSide}EntryOf${capitalize(bSide)}` as const
					const entriesStateKeyB = `${bSide}EntryOf${capitalize(aSide)}` as const
					const contentStates = {
						[entriesStateKeyA]: singleEntrySelectors,
						[entriesStateKeyB]: singleEntrySelectors,
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
				const singleRelatedKeySelectors = createSingleKeySelectorFamily()
				const multipleRelatedKeysSelectors = getMultipleKeySelectorFamily()
				const stateKeyA = `${aSide}KeyOf${capitalize(bSide)}` as const
				const stateKeyB = `${bSide}KeysOf${capitalize(aSide)}` as const
				const baseStates = {
					[stateKeyA]: singleRelatedKeySelectors,
					[stateKeyB]: multipleRelatedKeysSelectors,
				} as JoinStateFamilies<ASide, AType, BSide, BType, Cardinality, Content>
				let states: JoinStateFamilies<
					ASide,
					AType,
					BSide,
					BType,
					Cardinality,
					Content
				>
				if (defaultContent) {
					const singleRelatedEntrySelectors = createSingleEntrySelectorFamily()
					const multipleRelatedEntriesSelectors =
						getMultipleEntrySelectorFamily()
					const entriesStateKeyA = `${aSide}EntryOf${capitalize(bSide)}` as const
					const entriesStateKeyB = `${bSide}EntriesOf${capitalize(
						aSide,
					)}` as const
					const contentStates = {
						[entriesStateKeyA]: singleRelatedEntrySelectors,
						[entriesStateKeyB]: multipleRelatedEntriesSelectors,
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
				const multipleRelatedKeysSelectors = getMultipleKeySelectorFamily()
				const stateKeyA = `${aSide}KeysOf${capitalize(bSide)}` as const
				const stateKeyB = `${bSide}KeysOf${capitalize(aSide)}` as const
				const baseStates = {
					[stateKeyA]: multipleRelatedKeysSelectors,
					[stateKeyB]: multipleRelatedKeysSelectors,
				} as JoinStateFamilies<ASide, AType, BSide, BType, Cardinality, Content>
				let states: JoinStateFamilies<
					ASide,
					AType,
					BSide,
					BType,
					Cardinality,
					Content
				>
				if (defaultContent) {
					const multipleRelatedEntriesSelectors =
						getMultipleEntrySelectorFamily()
					const entriesStateKeyA = `${aSide}EntriesOf${capitalize(
						bSide,
					)}` as const
					const entriesStateKeyB = `${bSide}EntriesOf${capitalize(
						aSide,
					)}` as const
					const contentStates = {
						[entriesStateKeyA]: multipleRelatedEntriesSelectors,
						[entriesStateKeyB]: multipleRelatedEntriesSelectors,
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
	store?: Store,
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
	store?: Store,
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
	store: Store = IMPLICIT.STORE,
): JoinToken<ASide, AType, BSide, BType, Cardinality, Content> {
	store.joins.set(options.key, new Join(options, defaultContent, store))
	const token: JoinToken<ASide, AType, BSide, BType, Cardinality, Content> = {
		key: options.key,
		type: `join`,
		a: options.between[0],
		b: options.between[1],
		cardinality: options.cardinality,
	}
	return token
}

export function getJoin<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object | null,
>(
	token: JoinToken<ASide, AType, BSide, BType, Cardinality, Content>,
	store: Store,
): Join<ASide, AType, BSide, BType, Cardinality, Content> {
	let myJoin = store.joins.get(token.key)
	if (myJoin === undefined) {
		const rootJoinMap = IMPLICIT.STORE.joins
		const rootJoin = rootJoinMap.get(token.key)
		if (rootJoin === undefined) {
			throw new Error(
				`Join "${token.key}" not found in store "${store.config.name}"`,
			)
		}
		myJoin = new Join(rootJoin.options, rootJoin.defaultContent, store)
		store.joins.set(token.key, myJoin)
	}
	return myJoin
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
					readonly [A in ASide as `${A}EntryOf${Capitalize<BSide>}`]: ReadonlySelectorToken<
						[AType, Content] | null,
						BType
					>
				} & {
					readonly [B in BSide as `${B}EntryOf${Capitalize<ASide>}`]: ReadonlySelectorToken<
						[BType, Content] | null,
						AType
					>
				}
			: {}) & {
			readonly [A in ASide as `${A}KeyOf${Capitalize<BSide>}`]: ReadonlySelectorToken<
				AType | null,
				BType
			>
		} & {
			readonly [B in BSide as `${B}KeyOf${Capitalize<ASide>}`]: ReadonlySelectorToken<
				BType | null,
				AType
			>
		}
	: Cardinality extends `1:n`
		? (Content extends Json.Object
				? {
						readonly [A in ASide as `${A}EntryOf${Capitalize<BSide>}`]: ReadonlySelectorToken<
							[AType, Content] | null,
							BType
						>
					} & {
						readonly [B in BSide as `${B}EntriesOf${Capitalize<ASide>}`]: ReadonlySelectorToken<
							[BType, Content][],
							AType
						>
					}
				: {}) & {
				readonly [A in ASide as `${A}KeyOf${Capitalize<BSide>}`]: ReadonlySelectorToken<
					AType | null,
					BType
				>
			} & {
				readonly [B in BSide as `${B}KeysOf${Capitalize<ASide>}`]: ReadonlySelectorToken<
					BType[],
					AType
				>
			}
		: Cardinality extends `n:n`
			? (Content extends Json.Object
					? {
							readonly [A in ASide as `${A}EntriesOf${Capitalize<BSide>}`]: ReadonlySelectorToken<
								[AType, Content][],
								BType
							>
						} & {
							readonly [B in BSide as `${B}EntriesOf${Capitalize<ASide>}`]: ReadonlySelectorToken<
								[BType, Content][],
								AType
							>
						}
					: {}) & {
					readonly [A in ASide as `${A}KeysOf${Capitalize<BSide>}`]: ReadonlySelectorToken<
						AType[],
						BType
					>
				} & {
					readonly [B in BSide as `${B}KeysOf${Capitalize<ASide>}`]: ReadonlySelectorToken<
						BType[],
						AType
					>
				}
			: never

export function findRelationsInStore<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object | null,
>(
	token: JoinToken<ASide, AType, BSide, BType, Cardinality, Content>,
	key: AType | BType,
	store: Store,
): JoinStates<ASide, AType, BSide, BType, Cardinality, Content> {
	const myJoin = getJoin(token, store)
	let relations: JoinStates<ASide, AType, BSide, BType, Cardinality, Content>
	switch (token.cardinality satisfies `1:1` | `1:n` | `n:n`) {
		case `1:1`: {
			const keyAB = `${token.a}KeyOf${capitalize(token.b)}`
			const keyBA = `${token.b}KeyOf${capitalize(token.a)}`
			relations = {
				get [keyAB]() {
					const familyAB = myJoin.states[keyAB as any]
					const state = findInStore(store, familyAB, key)
					return state
				},
				get [keyBA]() {
					const familyBA = myJoin.states[keyBA as any]
					const state = findInStore(store, familyBA, key)
					return state
				},
			} as JoinStates<ASide, AType, BSide, BType, Cardinality, Content>
			const entryAB = `${token.a}EntryOf${capitalize(token.b)}`
			if (entryAB in myJoin.states) {
				const entryBA = `${token.b}EntryOf${capitalize(token.a)}`
				Object.assign(relations, {
					get [entryAB]() {
						const familyAB = myJoin.states[entryAB as any]
						const state = findInStore(store, familyAB, key)
						return state
					},
					get [entryBA]() {
						const familyBA = myJoin.states[entryBA as any]
						const state = findInStore(store, familyBA, key)
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
					const state = findInStore(store, familyAB, key)
					return state
				},
				get [keysBA]() {
					const familyBA = myJoin.states[keysBA as any]
					const state = findInStore(store, familyBA, key)
					return state
				},
			} as JoinStates<ASide, AType, BSide, BType, Cardinality, Content>
			const entryAB = `${token.a}EntryOf${capitalize(token.b)}`
			if (entryAB in myJoin.states) {
				const entriesBA = `${token.b}EntriesOf${capitalize(token.a)}`
				Object.assign(relations, {
					get [entryAB]() {
						const familyAB = myJoin.states[entryAB as any]
						const state = findInStore(store, familyAB, key)
						return state
					},
					get [entriesBA]() {
						const familyBA = myJoin.states[entriesBA as any]
						const state = findInStore(store, familyBA, key)
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
					const state = findInStore(store, familyAB, key)
					return state
				},
				get [keysBA]() {
					const familyBA = myJoin.states[keysBA as any]
					const state = findInStore(store, familyBA, key)
					return state
				},
			} as JoinStates<ASide, AType, BSide, BType, Cardinality, Content>
			const entriesAB = `${token.a}EntriesOf${capitalize(token.b)}`
			if (entriesAB in myJoin.states) {
				const entriesBA = `${token.b}EntriesOf${capitalize(token.a)}`
				Object.assign(relations, {
					get [entriesAB]() {
						const familyAB = myJoin.states[entriesAB as any]
						const state = findInStore(store, familyAB, key)
						return state
					},
					get [entriesBA]() {
						const familyBA = myJoin.states[entriesBA as any]
						const state = findInStore(store, familyBA, key)
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

export function editRelationsInStore<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object | null,
>(
	token: JoinToken<ASide, AType, BSide, BType, Cardinality, Content>,
	change: (relations: Junction<ASide, AType, BSide, BType, Content>) => void,
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

export function getInternalRelationsFromStore(
	token: JoinToken<any, any, any, any, any, any>,
	store: Store,
): MutableAtomFamilyToken<SetRTX<string>, SetRTXJson<string>, string> {
	const myJoin = getJoin(token, store)
	const family = myJoin.core.relatedKeysAtoms
	return family
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
