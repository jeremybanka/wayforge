import {
	type findState,
	type getState,
	type JoinOptions,
	type MutableAtomFamilyToken,
	type ReadonlyPureSelectorFamilyToken,
	type setState,
	simpleCompound,
	type Write,
	type WriterToolkit,
} from "atom.io"
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
	AName extends string,
	A extends string,
	BName extends string,
	B extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
> = Cardinality extends `1:1`
	? {
			readonly [N in AName as `${N}KeyOf${Capitalize<BName>}`]: ReadonlyPureSelectorFamilyToken<
				A | null,
				B
			>
		} & {
			readonly [N in BName as `${N}KeyOf${Capitalize<AName>}`]: ReadonlyPureSelectorFamilyToken<
				B | null,
				A
			>
		}
	: Cardinality extends `1:n`
		? {
				readonly [N in BName as `${N}KeysOf${Capitalize<AName>}`]: ReadonlyPureSelectorFamilyToken<
					B[],
					A
				>
			}
		: Cardinality extends `n:n`
			? {
					readonly [N in AName as `${N}KeysOf${Capitalize<BName>}`]: ReadonlyPureSelectorFamilyToken<
						A[],
						B
					>
				} & {
					readonly [N in BName as `${N}KeysOf${Capitalize<AName>}`]: ReadonlyPureSelectorFamilyToken<
						B[],
						A
					>
				}
			: never

export class Join<
	const AName extends string,
	const A extends string,
	const BName extends string,
	const B extends string,
	const Cardinality extends `1:1` | `1:n` | `n:n`,
> {
	private toolkit: WriterToolkit
	public options: JoinOptions<AName, A, BName, B, Cardinality>
	public relations: Junction<AName, A, BName, B>
	public states: JoinStateFamilies<AName, A, BName, B, Cardinality>
	public relatedKeysAtoms: MutableAtomFamilyToken<UList<A> | UList<B>, A | B>

	public transact(
		toolkit: WriterToolkit,
		run: (join: Join<AName, A, BName, B, Cardinality>) => void,
	): void {
		const originalToolkit = this.toolkit
		this.toolkit = toolkit
		run(this)
		this.toolkit = originalToolkit
	}

	public store: Store

	public [Symbol.dispose](): void {}

	public constructor(
		store: RootStore,
		options: JoinOptions<AName, A, BName, B, Cardinality>,
	) {
		type AB = A & B

		this.store = store
		this.options = options

		this.store.miscResources.set(`join:${options.key}`, this)

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

		const aSide: AName = options.between[0]
		const bSide: BName = options.between[1]
		const relatedKeysAtoms = createMutableAtomFamily<UList<string>, string>(
			store,
			{
				key: `${options.key}/relatedKeys`,
				class: UList,
			},
			[`join`, `relations`],
		)
		this.relatedKeysAtoms = relatedKeysAtoms as MutableAtomFamilyToken<
			UList<A> | UList<B>,
			A | B
		>

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
					const newRelationBIsAlreadyRelated = relationsOfB.has(a as AB)
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
									relations.delete(newRelationB as AB)
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
							store.keyRefsInJoins.delete(
								simpleCompound(newRelationB, previousOwner),
							)
						}
					}
					if (!newRelationBIsAlreadyRelated) {
						set(relationsOfBAtom, (relations) => {
							relations.add(a as AB)
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
				this.toolkit.get(relatedKeysAtoms, key) as UList<A> | UList<B>,
			addRelation: (a, b) => {
				this.store.keyRefsInJoins.set(`"${a}"`, options.key)
				this.store.keyRefsInJoins.set(`"${b}"`, options.key)
				this.store.keyRefsInJoins.set(simpleCompound(a, b), options.key)
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
				const compositeKey = simpleCompound(a, b)
				this.store.keyRefsInJoins.delete(compositeKey)
			},
			replaceRelationsSafely: (a, bs) => {
				replaceRelationsSafely(this.toolkit, a, bs)
			},
			replaceRelationsUnsafely: (a, bs) => {
				replaceRelationsUnsafely(this.toolkit, a, bs)
			},
			has: (a, b) => {
				const aKeys = this.toolkit.get(relatedKeysAtoms, a)
				return b ? aKeys.has(b as AB) : aKeys.size > 0
			},
		}
		const externalStore = baseExternalStoreConfiguration
		const relations = new Junction<AName, A, BName, B>(options as any, {
			externalStore,
			isAType: options.isAType,
			isBType: options.isBType,
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
				} as JoinStateFamilies<AName, A, BName, B, Cardinality>
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
				} as JoinStateFamilies<AName, A, BName, B, Cardinality>

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
				} as JoinStateFamilies<AName, A, BName, B, Cardinality>
			}
		}
	}
}
