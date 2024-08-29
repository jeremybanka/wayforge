import type { Each, Store } from "atom.io/internal"
import { Molecule } from "atom.io/internal"
import { stringifyJson } from "atom.io/json"

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
>(store: Store, provenance: A, key: V): Claim<H, V, A> {
	const ctx =
		provenance === `root`
			? undefined
			: Array.isArray(provenance)
				? provenance
				: [provenance]

	const above = ctx
		? ctx.map<Molecule<any>>((claim) => {
				if (ctx instanceof Molecule) {
					return ctx
				}
				const ctxStringKey = stringifyJson(claim.key)
				const molecule = store.molecules.get(ctxStringKey)

				if (!molecule) {
					throw new Error(
						`Molecule ${ctxStringKey} not found in store "${store.config.name}"`,
					)
				}
				return molecule
			})
		: undefined
	const molecule = new Molecule(above, key)
	const stringKey = stringifyJson(key)
	store.molecules.set(stringKey, molecule)

	if (above) {
		for (const aboveMolecule of above) {
			aboveMolecule.below.set(molecule.stringKey, molecule)
		}
	}

	return key as Claim<H, V, A>
}

export function createAllocator<H extends Hierarchy>(store: Store) {
	return <V extends Vassal<H>, A extends Above<V, H>>(
		provenance: A,
		key: V,
	): Claim<H, V, A> => {
		return allocateIntoStore(store, provenance, key)
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
> = [TypeTag<A>, SingularTypedKey<B>, SingularTypedKey<C>]
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
