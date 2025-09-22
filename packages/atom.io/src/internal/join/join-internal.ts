import type {
	findState,
	getState,
	JoinOptions,
	MutableAtomFamilyToken,
	ReadonlyPureSelectorFamilyToken,
	setState,
	Write,
	WriterToolkit,
} from "atom.io"
import { Anarchy } from "atom.io"
import { stringifyJson } from "atom.io/json"
import { UList } from "atom.io/transceivers/u-list"

import { capitalize } from "../capitalize"
import { createReadonlyPureSelectorFamily, findInStore } from "../families"
import { getFromStore } from "../get-state"
import type { BaseExternalStoreConfiguration } from "../junction"
import { Junction } from "../junction"
import { createMutableAtomFamily, getJsonFamily, getJsonToken } from "../mutable"
import { JOIN_OP, operateOnStore, setIntoStore } from "../set-state"
import type { Store } from "../store"
import { IMPLICIT } from "../store"
import type { RootStore } from "../transaction"

export type JoinStateFamilies<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
> = Cardinality extends `1:1`
	? {
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
		? {
				readonly [B in BSide as `${B}KeysOf${Capitalize<ASide>}`]: ReadonlyPureSelectorFamilyToken<
					BType[],
					AType
				>
			}
		: Cardinality extends `n:n`
			? {
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
> {
	private toolkit: WriterToolkit
	public options: JoinOptions<ASide, AType, BSide, BType, Cardinality>
	public relations: Junction<ASide, AType, BSide, BType>
	public states: JoinStateFamilies<ASide, AType, BSide, BType, Cardinality>
	public core: {
		relatedKeysAtoms: MutableAtomFamilyToken<UList<string>, string>
	}
	public transact(
		toolkit: WriterToolkit,
		run: (join: Join<ASide, AType, BSide, BType, Cardinality>) => void,
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
		options: JoinOptions<ASide, AType, BSide, BType, Cardinality>,
		store: RootStore = IMPLICIT.STORE,
	) {
		type AnyKey = AType & BType

		this.store = store
		this.realm = new Anarchy(store)
		this.options = options

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
		const relatedKeysAtoms = createMutableAtomFamily<UList<string>, string>(
			store,
			{
				key: `${options.key}/relatedKeys`,
				class: UList,
			},
			[`join`, `relations`],
		)
		this.core = { relatedKeysAtoms }

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
				// relationsOfA.transaction((nextRelationsOfA) => {
				relationsOfA.clear()
				for (const newRelationB of newRelationsOfA) {
					const relationsOfBAtom = find(relatedKeysAtoms, newRelationB)
					const relationsOfB = get(relationsOfBAtom)
					const newRelationBIsAlreadyRelated = relationsOfB.has(a as AnyKey)
					if (this.relations.cardinality === `1:n`) {
						const previousOwnersToDispose: string[] = []
						for (const previousOwner of relationsOfB) {
							if (previousOwner === a) {
								continue
							}
							let previousOwnerSize: number | undefined
							operateOnStore(
								JOIN_OP,
								this.store,
								relatedKeysAtoms,
								previousOwner,
								(relations) => {
									relations.delete(newRelationB as AnyKey)
									previousOwnerSize = relations.size
									return relations
								},
							)
							if (previousOwnerSize === 0) {
								previousOwnersToDispose.push(previousOwner)
							}
						}
						if (!newRelationBIsAlreadyRelated && relationsOfB.size > 0) {
							set(relationsOfBAtom, (relations) => {
								relations.clear()
								return relations
							})
						}
						for (const previousOwner of previousOwnersToDispose) {
							const [x, y] = [newRelationB, previousOwner].sort()
							const compositeKey = `${x}:${y}`
							store.moleculeJoins.delete(compositeKey)
						}
					}
					if (!newRelationBIsAlreadyRelated) {
						set(relationsOfBAtom, (relations) => {
							relations.add(a as AnyKey)
							return relations
						})
					}
					relationsOfA.add(newRelationB)
				}
				// return true
				// })
				return relationsOfA
			})
		}
		const replaceRelationsUnsafely: Write<
			(a: string, newRelationsOfA: string[]) => void
		> = (toolkit, a, newRelationsOfA) => {
			const { set } = toolkit
			set(relatedKeysAtoms, a, (relationsOfA) => {
				// relationsOfA.transaction((nextRelationsOfA) => {
				for (const newRelationB of newRelationsOfA) {
					relationsOfA.add(newRelationB)
				}
				// return true
				// })
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
		const baseExternalStoreConfiguration: BaseExternalStoreConfiguration = {
			getRelatedKeys: (key) =>
				this.toolkit.get(relatedKeysAtoms, key) as UList<AType> | UList<BType>,
			addRelation: (a, b) => {
				this.store.moleculeJoins.set(`"${a}"`, options.key)
				this.store.moleculeJoins.set(`"${b}"`, options.key)
				if (!this.store.molecules.has(stringifyJson(a))) {
					this.realm.allocate(options.key, a)
				}
				if (!this.store.molecules.has(stringifyJson(b))) {
					this.realm.allocate(options.key, b)
				}
				this.toolkit.set(relatedKeysAtoms, a, (aKeys) => aKeys.add(b))
				this.toolkit.set(relatedKeysAtoms, b, (bKeys) => bKeys.add(a))
			},
			deleteRelation: (a, b) => {
				this.toolkit.set(relatedKeysAtoms, a, (aKeys) => {
					aKeys.delete(b)
					return aKeys
				})
				this.toolkit.set(relatedKeysAtoms, b, (bKeys) => {
					bKeys.delete(a)
					return bKeys
				})
				const [x, y] = [a, b].sort()
				const compositeKey = `${x}:${y}`
				this.store.moleculeJoins.delete(compositeKey)
			},
			replaceRelationsSafely: (a, bs) => {
				replaceRelationsSafely(this.toolkit, a, bs)
			},
			replaceRelationsUnsafely: (a, bs) => {
				replaceRelationsUnsafely(this.toolkit, a, bs)
			},
			has: (a, b) => {
				const aKeys = this.toolkit.get(relatedKeysAtoms, a)
				return b ? aKeys.has(b as AnyKey) : aKeys.size > 0
			},
		}
		const externalStore = baseExternalStoreConfiguration
		const relations = new Junction<ASide, AType, BSide, BType>(options as any, {
			externalStore,
			isAType: options.isAType,
			isBType: options.isBType,
			// makeContentKey: (...args) => {
			// 	const [a, b] = args
			// 	const [x, y] = args.sort()
			// 	const compositeKey = `${x}:${y}`
			// 	const aMolecule = store.molecules.get(stringifyJson(a))
			// 	const bMolecule = store.molecules.get(stringifyJson(b))
			// 	if (!aMolecule) {
			// 		this.realm.allocate(options.key, a)
			// 	}
			// 	if (!bMolecule) {
			// 		this.realm.allocate(options.key, b)
			// 	}

			// 	this.realm.allocate(a, compositeKey, `all`)
			// 	this.realm.claim(b, compositeKey)
			// 	this.store.moleculeJoins.set(compositeKey, options.key)
			// 	return compositeKey
			// },
		})

		const createSingleKeySelectorFamily = () =>
			createReadonlyPureSelectorFamily<string | null, string, never>(
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
			return createReadonlyPureSelectorFamily<readonly string[], string, never>(
				store,
				{
					key: `${options.key}/multipleRelatedKeys`,
					get:
						(key) =>
						({ get }) => {
							const jsonFamily = getJsonFamily(relatedKeysAtoms, store)
							const json = get(jsonFamily, key)
							return json
						},
				},
				[`join`, `keys`],
			)
		}

		switch (options.cardinality) {
			case `1:1`: {
				const singleRelatedKeySelectors = createSingleKeySelectorFamily()
				const stateKeyA = `${aSide}KeyOf${capitalize(bSide)}` as const
				const stateKeyB = `${bSide}KeyOf${capitalize(aSide)}` as const
				this.relations = relations
				this.states = {
					[stateKeyA]: singleRelatedKeySelectors,
					[stateKeyB]: singleRelatedKeySelectors,
				} as JoinStateFamilies<ASide, AType, BSide, BType, Cardinality>
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
				} as JoinStateFamilies<ASide, AType, BSide, BType, Cardinality>

				this.relations = relations
				this.states = baseStates
				break
			}
			case `n:n`: {
				const multipleRelatedKeysSelectors = getMultipleKeySelectorFamily()
				const stateKeyA = `${aSide}KeysOf${capitalize(bSide)}` as const
				const stateKeyB = `${bSide}KeysOf${capitalize(aSide)}` as const
				this.relations = relations
				this.states = {
					[stateKeyA]: multipleRelatedKeysSelectors,
					[stateKeyB]: multipleRelatedKeysSelectors,
				} as JoinStateFamilies<ASide, AType, BSide, BType, Cardinality>
			}
		}
	}
}
