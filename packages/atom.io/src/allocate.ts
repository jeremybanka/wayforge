import type { Each, Store } from "atom.io/internal"
import { Molecule } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { makeRootMoleculeInStore } from "./molecule"

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
>(store: Store, rootKey: string, provenance: A, key: V): Claim<H, V, A> {
	const above: Molecule<any>[] = []

	if (provenance === `root`) {
		// biome-ignore lint/style/noNonNullAssertion: let's assume we made the root molecule to get here
		above.push(store.molecules.get(rootKey)!)
	} else if (provenance[0][0] === T$) {
		const provenanceKey = stringifyJson(provenance as Canonical)
		const provenanceMolecule = store.molecules.get(provenanceKey)
		if (!provenanceMolecule) {
			throw new Error(
				`Molecule ${provenanceKey} not found in store "${store.config.name}"`,
			)
		}
		above.push(provenanceMolecule)
	} else {
		if (key[0][0] === T$) {
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

	const molecule = new Molecule(above, key)

	const stringKey = stringifyJson(key)
	store.molecules.set(stringKey, molecule)

	for (const aboveMolecule of above) {
		aboveMolecule.below.set(molecule.stringKey, molecule)
	}

	return key as Claim<H, V, A>
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function createWorld<H extends Hierarchy>(
	store: Store,
	worldKey: string,
) {
	const root = makeRootMoleculeInStore(worldKey, store)
	return {
		allocate: <V extends Vassal<H>, A extends Above<V, H>>(
			provenance: A,
			key: V,
		): Claim<H, V, A> => {
			return allocateIntoStore(store, worldKey, provenance, key)
		},
	}
}

export const T$ = `T$`
export type T$ = typeof T$
export type TypeTag<T extends string> = [T$, T]
export type SingularTypedKey<T extends string = string> = [T, string]
export type CompoundTypedKey<
	A extends string = string,
	B extends string = string,
	C extends string = string,
> = [TypeTag<A>, TypedKey<B>, TypedKey<C>]
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
