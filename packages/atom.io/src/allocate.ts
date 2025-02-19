import type { Each, Store } from "atom.io/internal"
import {
	disposeFromStore,
	findInStore,
	IMPLICIT,
	isChildStore,
	Molecule,
	newest,
} from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { parseJson, stringifyJson } from "atom.io/json"

import type { MoleculeToken } from "./molecule"
import { makeRootMoleculeInStore } from "./molecule"
import type { MoleculeCreation, MoleculeDisposal } from "./transaction"

export const $provenance = Symbol(`provenance`)
export type Claim<
	H extends Hierarchy,
	V extends Vassal<H>,
	A extends Above<V, H>,
> = V & {
	[$provenance]?: A
}

export function allocateIntoStore<
	H extends Hierarchy,
	V extends Vassal<H>,
	A extends Above<V, H>,
>(store: Store, provenance: A, key: V, attachmentStyle?: `all` | `any`): V {
	const stringKey = stringifyJson(key)
	try {
		const above: Molecule<any>[] = []

		let allocationAttachmentStyle: `all` | `any`
		if (provenance === `root`) {
			// biome-ignore lint/style/noNonNullAssertion: let's assume we made the root molecule to get here
			above.push(store.molecules.get(`"root"`)!)
			allocationAttachmentStyle = `all`
		} else if (typeof provenance === `string` && provenance.startsWith(T$)) {
			allocationAttachmentStyle = `any`
			const provenanceKey = stringifyJson(provenance as Canonical)
			const provenanceMolecule = store.molecules.get(provenanceKey)
			if (!provenanceMolecule) {
				throw new Error(
					`Molecule ${provenanceKey} not found in store "${store.config.name}"`,
				)
			}
			above.push(provenanceMolecule)
		} else {
			const allocationIsCompound = key.startsWith(`T$--`)
			if (allocationIsCompound) {
				allocationAttachmentStyle = `all`
				for (const claim of provenance as SingularTypedKey[]) {
					const provenanceKey = stringifyJson(claim)
					const provenanceMolecule = store.molecules.get(provenanceKey)
					if (!provenanceMolecule) {
						throw new Error(
							`Molecule ${provenanceKey} not found in store "${store.config.name}"`,
						)
					}
					above.push(provenanceMolecule)
				}
			} else {
				allocationAttachmentStyle = attachmentStyle ?? `any`
				const provenanceKey = stringifyJson(provenance as Canonical)
				const provenanceMolecule = store.molecules.get(provenanceKey)
				if (!provenanceMolecule) {
					throw new Error(
						`Molecule ${provenanceKey} not found in store "${store.config.name}"`,
					)
				}
				above.push(provenanceMolecule)
			}
		}
		const target = newest(store)
		const molecule = new Molecule(target, above, key, allocationAttachmentStyle)
		store.molecules.set(stringKey, molecule)

		// for (const aboveMolecule of above) {
		// 	aboveMolecule.below.set(molecule.stringKey, molecule)
		// }
		const creationEvent: MoleculeCreation = {
			type: `molecule_creation`,
			subType: `modern`,
			key: molecule.key,
			provenance: provenance as Canonical,
		}
		const isTransaction =
			isChildStore(target) && target.transactionMeta.phase === `building`
		if (isTransaction) {
			target.transactionMeta.update.updates.push(creationEvent)
		} else {
			target.on.moleculeCreation.next(creationEvent)
		}
	} catch (thrown) {
		if (thrown instanceof Error) {
			store.logger.error(
				`❌`,
				`molecule`,
				stringKey,
				`allocation failed:`,
				thrown.message,
			)
		}
	}

	return key as Claim<H, V, A>
}

export function deallocateFromStore<
	H extends Hierarchy,
	V extends Vassal<H>,
	A extends Above<V, H>,
>(store: Store, claim: Claim<H, V, A>): void {
	const stringKey = stringifyJson(claim)
	const molecule = store.molecules.get(stringKey)
	if (!molecule) {
		throw new Error(
			`Molecule ${stringKey} not found in store "${store.config.name}"`,
		)
	}

	const joinKeys = store.moleculeJoins.getRelatedKeys(
		molecule.key as string /* 💥 RECONCILE */,
	)
	if (joinKeys) {
		for (const joinKey of joinKeys) {
			const join = store.joins.get(joinKey)
			if (join) {
				join.relations.delete(molecule.key)
				join.molecules.delete(molecule.stringKey) // get rid of
			}
		}
	}
	store.moleculeJoins.delete(molecule.stringKey)

	const provenance: Canonical[] = []

	const values: [string, any][] = []
	const disposalEvent: MoleculeDisposal = {
		type: `molecule_disposal`,
		subType: `modern`,
		key: molecule.key,
		values,
		provenance,
	}
	const target = newest(store)
	const isTransaction =
		isChildStore(target) && target.transactionMeta.phase === `building`
	if (isTransaction) {
		target.transactionMeta.update.updates.push(disposalEvent)
	}
	const relatedMolecules = store.moleculeGraph.getRelationEntries({
		downstreamMoleculeKey: molecule.stringKey,
	})
	if (relatedMolecules) {
		for (const [relatedStringKey, { source }] of relatedMolecules) {
			if (source === `root`) {
				provenance.push(relatedStringKey)
				continue
			}
			if (source === molecule.stringKey) {
				const relatedKey = parseJson(relatedStringKey)
				deallocateFromStore<any, any, any>(store, relatedKey)
			} else {
				provenance.push(source)
			}
		}
	}
	const familyKeys = target.moleculeData.getRelatedKeys(molecule.stringKey)
	if (familyKeys) {
		for (const familyKey of familyKeys) {
			// biome-ignore lint/style/noNonNullAssertion: tokens of molecules must have a family
			const family = target.families.get(familyKey)!
			const token = findInStore(store, family, molecule.key)
			values.push([family.key, token])
			disposeFromStore(store, token)
		}
	}

	target.moleculeGraph.delete(molecule.stringKey)
	target.moleculeJoins.delete(molecule.stringKey)
	target.moleculeData.delete(molecule.stringKey)

	if (!isTransaction) {
		target.on.moleculeDisposal.next(disposalEvent)
	}
	target.molecules.delete(molecule.stringKey)
}
export function claimWithinStore<
	H extends Hierarchy,
	V extends Exclude<Vassal<H>, CompoundTypedKey>,
	A extends Above<V, H>,
>(
	store: Store,
	newProvenance: A,
	claim: Claim<H, V, any>,
	exclusive?: `exclusive`,
): Claim<H, V, A> {
	const stringKey = stringifyJson(claim)
	const target = newest(store)
	const molecule = target.molecules.get(stringKey)
	if (!molecule) {
		throw new Error(
			`Molecule ${stringKey} not found in store "${store.config.name}"`,
		)
	}

	const newProvenanceKey = stringifyJson(newProvenance as Canonical)
	const newProvenanceMolecule = target.molecules.get(newProvenanceKey)
	if (!newProvenanceMolecule) {
		throw new Error(
			`Molecule ${newProvenanceKey} not found in store "${store.config.name}"`,
		)
	}

	if (exclusive) {
		target.moleculeJoins.delete(stringKey)
	}
	target.moleculeGraph.set(
		{
			upstreamMoleculeKey: newProvenanceMolecule.stringKey,
			downstreamMoleculeKey: molecule.stringKey,
		},
		{
			source: newProvenanceMolecule.stringKey,
		},
	)
	return claim as Claim<H, V, A>
}

export class Realm<H extends Hierarchy> {
	public store: Store
	public root: MoleculeToken<`root`>
	public constructor(store: Store = IMPLICIT.STORE) {
		this.store = store
		this.root = makeRootMoleculeInStore(`root`, store)
	}
	public allocate<V extends Vassal<H>, A extends Above<V, H>>(
		provenance: A,
		key: V,
		attachmentStyle?: `all` | `any`,
	): V {
		return allocateIntoStore<H, V, A>(
			this.store,
			provenance,
			key,
			attachmentStyle,
		)
	}
	public deallocate<V extends Vassal<H>, A extends Above<V, H>>(
		claim: Claim<H, V, A>,
	): void {
		deallocateFromStore(this.store, claim)
	}
	public claim<
		V extends Exclude<Vassal<H>, CompoundTypedKey>,
		A extends Above<V, H>,
	>(
		newProvenance: A,
		claim: Claim<H, V, any>,
		exclusive?: `exclusive`,
	): Claim<H, V, A> {
		return claimWithinStore(this.store, newProvenance, claim, exclusive)
	}
}

export const T$ = `T$`
export type T$ = typeof T$
export type TypeTag<T extends string> = `${T$}--${T}`
export type SingularTypedKey<T extends string = string> = `${T}::${string}`
export type CompoundTypedKey<
	A extends string = string,
	B extends string = string,
	C extends string = string,
> = `${TypeTag<A>}==${SingularTypedKey<B>}++${SingularTypedKey<C>}`
export type TypedKey<
	A extends string = string,
	B extends string = string,
	C extends string = string,
> = CompoundTypedKey<A, B, C> | SingularTypedKey<A>
type Scope = SingularTypedKey[]
type MutualFealty = {
	above: Scope
	below: CompoundTypedKey
	style: `all` | `any`
}
type ExclusiveFealty = {
	above: TypedKey | `root`
	below: Scope
}
type Fealty = ExclusiveFealty | MutualFealty

export type Hierarchy<F extends Fealty[] = Fealty[]> = Each<F>

export type Vassal<H extends Hierarchy> = {
	[K in keyof H]: H[K] extends MutualFealty
		? H[K][`below`]
		: H[K] extends { below: Array<infer V> }
			? V extends TypedKey
				? V
				: never
			: never
}[keyof H]

export type Above<TK extends TypedKey, H extends Hierarchy> = {
	[K in keyof H]: H[K] extends MutualFealty
		? TK extends H[K][`below`]
			? H[K][`above`]
			: never
		: H[K] extends { below: Array<infer V> }
			? TK extends V
				? H[K] extends ExclusiveFealty
					? H[K][`above`]
					: never
				: never
			: never
}[keyof H]

export type Below<TK extends TypedKey | TypedKey[], H extends Hierarchy> = {
	[K in keyof H]: H[K] extends MutualFealty
		? TK extends H[K][`above`]
			? H[K][`below`]
			: TK extends H[K][`above`][number]
				? H[K][`below`]
				: never
		: H[K] extends { above: infer V }
			? TK extends V
				? H[K] extends ExclusiveFealty
					? H[K][`below`][number]
					: never
				: never
			: never
}[keyof H]

export type Mutuals<TK extends TypedKey | TypedKey[], H extends Hierarchy> = {
	[K in keyof H]: H[K] extends MutualFealty
		? TK extends H[K][`above`][number]
			? [mutual: Exclude<H[K][`above`][number], TK>, below: H[K][`below`]]
			: never
		: never
}[keyof H]

export class Anarchy {
	public store: Store
	public realm: Realm<any>

	public constructor(store: Store = IMPLICIT.STORE) {
		this.store = store
		this.realm = new Realm(store)
	}

	public allocate(
		provenance: Canonical,
		key: Canonical,
		attachmentStyle?: `all` | `any`,
	): void {
		allocateIntoStore<any, any, any>(
			this.store,
			provenance,
			key,
			attachmentStyle,
		)
	}

	public deallocate(key: Canonical): void {
		deallocateFromStore<any, any, any>(this.store, key)
	}

	public claim(
		newProvenance: Canonical,
		key: Canonical,
		exclusive?: `exclusive`,
	): void {
		claimWithinStore<any, any, any>(this.store, newProvenance, key, exclusive)
	}
}
