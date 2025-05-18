import type {
	CompoundTypedKey,
	findState,
	getState,
	JoinOptions,
	MutableAtomFamilyToken,
	Read,
	ReadonlyPureSelectorFamilyToken,
	RegularAtomFamilyToken,
	setState,
	SetterToolkit,
	Write,
} from "atom.io"
import { Anarchy } from "atom.io"
import type { Canonical, Json, stringified } from "atom.io/json"
import { stringifyJson } from "atom.io/json"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import { capitalize } from "../capitalize"
import {
	createReadonlyPureSelectorFamily,
	createRegularAtomFamily,
	findInStore,
} from "../families"
import { getFromStore } from "../get-state"
import type {
	BaseExternalStoreConfiguration,
	ExternalStoreConfiguration,
} from "../junction"
import { Junction } from "../junction"
import type { Molecule } from "../molecule"
import { createMutableAtomFamily, getJsonFamily, getJsonToken } from "../mutable"
import { setIntoStore } from "../set-state"
import type { Store } from "../store"
import { IMPLICIT } from "../store"

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
					readonly [A in ASide as `${A}EntryOf${Capitalize<BSide>}`]: ReadonlyPureSelectorFamilyToken<
						[AType, Content] | null,
						BType
					>
				} & {
					readonly [B in BSide as `${B}EntryOf${Capitalize<ASide>}`]: ReadonlyPureSelectorFamilyToken<
						[BType, Content] | null,
						AType
					>
				}
			: {}) & {
			readonly [A in ASide as `${A}KeyOf${Capitalize<BSide>}`]: ReadonlyPureSelectorFamilyToken<
				AType | null,
				BType
			>
		} & {
			readonly [B in BSide as `${B}KeyOf${Capitalize<ASide>}`]: ReadonlyPureSelectorFamilyToken<
				BType | null,
				AType
			>
		}
	: Cardinality extends `1:n`
		? (Content extends Json.Object
				? {
						readonly [A in ASide as `${A}EntryOf${Capitalize<BSide>}`]: ReadonlyPureSelectorFamilyToken<
							[AType, Content] | null,
							BType
						>
					} & {
						readonly [B in BSide as `${B}EntriesOf${Capitalize<ASide>}`]: ReadonlyPureSelectorFamilyToken<
							[BType, Content][],
							AType
						>
					}
				: {}) & {
				readonly [A in ASide as `${A}KeyOf${Capitalize<BSide>}`]: ReadonlyPureSelectorFamilyToken<
					AType | null,
					BType
				>
			} & {
				readonly [B in BSide as `${B}KeysOf${Capitalize<ASide>}`]: ReadonlyPureSelectorFamilyToken<
					BType[],
					AType
				>
			}
		: Cardinality extends `n:n`
			? (Content extends Json.Object
					? {
							readonly [A in ASide as `${A}EntriesOf${Capitalize<BSide>}`]: ReadonlyPureSelectorFamilyToken<
								[AType, Content][],
								BType
							>
						} & {
							readonly [B in BSide as `${B}EntriesOf${Capitalize<ASide>}`]: ReadonlyPureSelectorFamilyToken<
								[BType, Content][],
								AType
							>
						}
					: {}) & {
					readonly [A in ASide as `${A}KeysOf${Capitalize<BSide>}`]: ReadonlyPureSelectorFamilyToken<
						AType[],
						BType
					>
				} & {
					readonly [B in BSide as `${B}KeysOf${Capitalize<ASide>}`]: ReadonlyPureSelectorFamilyToken<
						BType[],
						AType
					>
				}
			: never

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
			createReadonlyPureSelectorFamily<string | null, string>(
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
			return createReadonlyPureSelectorFamily<string[], string>(
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
			createReadonlyPureSelectorFamily<[string, Content] | null, string>(
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
			createReadonlyPureSelectorFamily<[string, Content][], string>(
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
			case `n:n`: {
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
