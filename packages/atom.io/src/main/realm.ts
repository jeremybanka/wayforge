import type { Each, RootStore } from "atom.io/internal"
import {
	actUponStore,
	allocateIntoStore,
	arbitrary,
	claimWithinStore,
	createClaimTX,
	createDeallocateTX,
	fuseWithinStore,
	IMPLICIT,
	makeRootMoleculeInStore,
} from "atom.io/internal"
import type { Canonical } from "atom.io/json"

import type { TransactionToken } from "./tokens"

export const $claim: unique symbol = Symbol.for(`claim`)
export type Claim<K extends Canonical> = K & { [$claim]?: true }

export class Realm<H extends Hierarchy> {
	public store: RootStore
	public deallocateTX: TransactionToken<(claim: Claim<Vassal<H>>) => void>
	public claimTX: TransactionToken<
		<V extends Exclude<Vassal<H>, CompoundTypedKey>, A extends Above<V, H>>(
			newProvenance: A,
			claim: Claim<V>,
			exclusive?: `exclusive`,
		) => void
	>
	/**
	 * @param store - The store to which the realm will be attached
	 */
	public constructor(store: RootStore = IMPLICIT.STORE) {
		this.store = store
		this.deallocateTX = createDeallocateTX(store)
		this.claimTX = createClaimTX(store)
		makeRootMoleculeInStore(`root`, store)
	}
	/**
	 * Make space for a new subject of the realm
	 * @param provenance - A key for an owner {@link Above} the new subject in the realm's {@link Hierarchy}
	 * @param key - A unique identifier for the new subject
	 * @param attachmentStyle - The attachment style of new subject to its owner(s). `any` means that if any owners remain, the subject will be retained. `all` means that the subject be retained only if all owners remain .
	 * @returns
	 * The subject's key, given status as a true {@link Claim}
	 */
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
	/**
	 * Fuse two reagents into a compound
	 * @param type - the name of the compound that is being fused
	 * @param reagentA - the left reagent of the compound
	 * @param reagentB - the right reagent of the compound
	 * @returns
	 * The compound's key, given status as a true {@link Claim}
	 */
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
	/**
	 * Remove a subject from the realm
	 * @param claim - The subject to be deallocated
	 */
	public deallocate<V extends Vassal<H>>(claim: Claim<V>): void {
		actUponStore(this.store, this.deallocateTX, arbitrary())(claim)
	}
	/**
	 * Transfer a subject of the realm from one owner to another
	 * @param newProvenance - A key for an owner {@link Above} the new subject in the realm's {@link Hierarchy}
	 * @param claim - The subject to be claimed
	 * @param exclusive - Whether the subjects previous owners should be detached from it
	 * @returns
	 * The subject's key, given status as a true {@link Claim}
	 */
	public claim<
		V extends Exclude<Vassal<H>, CompoundTypedKey>,
		A extends Above<V, H>,
	>(newProvenance: A, claim: Claim<V>, exclusive?: `exclusive`): void {
		actUponStore(this.store, this.claimTX, arbitrary())(
			newProvenance,
			claim,
			exclusive,
		)
	}
}

export class Anarchy {
	public store: RootStore
	public deallocateTX: TransactionToken<(key: Canonical) => void>
	public claimTX: TransactionToken<
		(newProvenance: Canonical, key: Canonical, exclusive?: `exclusive`) => void
	>

	/**
	 * @param store - The store to which the anarchy-realm will be attached
	 */
	public constructor(store: RootStore = IMPLICIT.STORE) {
		this.store = store
		this.deallocateTX = createDeallocateTX(store)
		this.claimTX = createClaimTX(store)
		makeRootMoleculeInStore(`root`, store)
	}
	/**
	 * Declare a new entity
	 * @param provenance - A key for an owner of the entity
	 * @param key - A unique identifier for the new entity
	 * @param attachmentStyle - The attachment style of new entity to its owner(s). `any` means that if any owners remain, the subject will be retained. `all` means that the subject be retained only if all owners remain .
	 */
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
	/**
	 * Remove an entity
	 * @param key - The entity to be deallocated
	 */
	public deallocate(key: Canonical): void {
		actUponStore(this.store, this.deallocateTX, arbitrary())(key)
	}
	/**
	 * Transfer an entity from one owner to another
	 * @param newProvenance - A key for an owner of the entity
	 * @param key - The entity to be claimed
	 * @param exclusive - Whether the entity's previous owners should be detached from it
	 */
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
