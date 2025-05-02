import type { Each, Store } from "atom.io/internal"
import {
	allocateIntoStore,
	claimWithinStore,
	deallocateFromStore,
	fuseWithinStore,
	IMPLICIT,
	makeRootMoleculeInStore,
} from "atom.io/internal"
import type { Canonical } from "atom.io/json"

export const $claim: unique symbol = Symbol.for(`claim`)
export type Claim<K extends Canonical> = K & { [$claim]?: true }

export class Realm<H extends Hierarchy> {
	public store: Store
	public constructor(store: Store = IMPLICIT.STORE) {
		this.store = store
		makeRootMoleculeInStore(`root`, store)
	}
	public allocate<V extends Vassal<H>, A extends Above<V, H>>(
		provenance: A,
		key: V,
		attachmentStyle?: `all` | `any`,
	): Claim<V> {
		return allocateIntoStore<H, V, A>(
			this.store,
			provenance,
			key,
			attachmentStyle,
		)
	}
	public fuse<
		C extends CompoundFrom<H>,
		T extends C extends CompoundTypedKey<infer t, any, any> ? t : never,
		A extends C extends CompoundTypedKey<any, infer v, any> ? v : never,
		B extends C extends CompoundTypedKey<any, any, infer m> ? m : never,
	>(
		type: T,
		reagentA: SingularTypedKey<A>,
		reagentB: SingularTypedKey<B>,
	): Claim<CompoundTypedKey<T, A, B>> {
		return fuseWithinStore<H, C, T, A, B>(this.store, type, reagentA, reagentB)
	}

	public deallocate<V extends Vassal<H>>(claim: Claim<V>): void {
		deallocateFromStore<H, V>(this.store, claim)
	}
	public claim<
		V extends Exclude<Vassal<H>, CompoundTypedKey>,
		A extends Above<V, H>,
	>(newProvenance: A, claim: Claim<V>, exclusive?: `exclusive`): Claim<V> {
		return claimWithinStore<H, V, A>(this.store, newProvenance, claim, exclusive)
	}
}

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
		deallocateFromStore<any, any>(this.store, key)
	}

	public claim(
		newProvenance: Canonical,
		key: Canonical,
		exclusive?: `exclusive`,
	): void {
		claimWithinStore<any, any, any>(this.store, newProvenance, key, exclusive)
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

export type CompoundFrom<H extends Hierarchy> = {
	[K in keyof H]: H[K] extends MutualFealty ? H[K][`below`] : never
}[keyof H]
