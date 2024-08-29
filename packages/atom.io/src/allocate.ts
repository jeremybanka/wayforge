import type { Count, Store } from "atom.io/internal"
import { IMPLICIT, Molecule } from "atom.io/internal"
import { stringifyJson } from "atom.io/json"

export const $provenance = Symbol(`provenance`)
export type Claim<
	H extends Hierarchy,
	V extends Vassal<H>,
	A extends Above<V, H>,
> = V & {
	[$provenance]?: A
}

type myClaim = Claim<Hierarchy, TypedKey, []>

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

	return key
}

export function createAllocator<H extends Hierarchy>(store: Store) {
	return <V extends Vassal<H>, A extends Above<V, H>>(
		provenance: A,
		key: V,
	): Claim<H, V, A> => {
		return allocateIntoStore(store, provenance, key)
	}
}

type GameKey = [`game`, string]
type UserKey = [`user`, string]
type PlayerKey = [[`type`, `player`], GameKey, UserKey]
type ItemKey = [`item`, string]

type TypeTag<T extends string> = [`type`, T]
type SingularTypedKey<T extends string> = [T, string]
type CompoundTypedKey<A extends string, B extends string, C extends string> = [
	TypeTag<A>,
	SingularTypedKey<B>,
	SingularTypedKey<C>,
]
type TypedKey<
	A extends string = string,
	B extends string = string,
	C extends string = string,
> = CompoundTypedKey<A, B, C> | SingularTypedKey<A>
type Scope = TypedKey[]
type Purview = { above: Scope | `root`; below: Scope }
type Each<E extends any[]> = {
	[P in Count<E[`length`]>]: E[P]
}
type Hierarchy<P extends Purview[] = Purview[]> = Each<P>

type GameHierarchy = Hierarchy<
	[
		{
			above: `root`
			below: [GameKey, UserKey]
		},
		{
			above: [GameKey, UserKey]
			below: [PlayerKey]
		},
		{
			above: [GameKey]
			below: [ItemKey]
		},
		{
			above: [PlayerKey]
			below: [ItemKey]
		},
	]
>

type Vassal<H extends Hierarchy> = {
	[K in keyof H]: H[K] extends { below: Array<infer V> }
		? V extends TypedKey
			? V
			: never
		: never
}[keyof H]

type GameVassal = Vassal<GameHierarchy>

type Above<TK extends TypedKey, H extends Hierarchy> = {
	[K in keyof H]: H[K] extends Purview
		? TK extends H[K][`below`][number]
			? H[K][`above`]
			: never
		: never
}[keyof H]

type AboveGame = Above<GameKey, GameHierarchy>
type AboveUser = Above<UserKey, GameHierarchy>
type AbovePlayer = Above<PlayerKey, GameHierarchy>
type AboveItem = Above<ItemKey, GameHierarchy>

type Below<TK extends TypedKey[], H> = {
	[K in keyof H]: H[K] extends {
		above: TK
		below: infer B
	}
		? B
		: never
}[keyof H]

type BelowGame = Below<[GameKey], GameHierarchy>
type BelowUser = Below<[UserKey], GameHierarchy>
type BelowGameUser = Below<[GameKey, UserKey], GameHierarchy>
type BelowPlayer = Below<[PlayerKey], GameHierarchy>
type BelowItem = Below<[ItemKey], GameHierarchy>

const gameKey = [`game`, `xxx`] satisfies GameKey
const userKey = [`user`, `yyy`] satisfies UserKey
const playerKey = [[`type`, `player`], gameKey, userKey] satisfies PlayerKey
const gameClaim0 = allocateIntoStore(IMPLICIT.STORE, `root`, gameKey)
const userClaim0 = allocateIntoStore(IMPLICIT.STORE, `root`, userKey)
const playerClaim0 = allocateIntoStore(
	IMPLICIT.STORE,
	[gameClaim0, userClaim0],
	playerKey,
)

const gameAllocator = createAllocator<GameHierarchy>(IMPLICIT.STORE)

const gameClaim = gameAllocator(`root`, gameKey)
const userClaim = gameAllocator(`root`, userKey)
const playerClaim = gameAllocator([gameClaim, userClaim], playerKey)

const itemKey = [`item`, `xxx`] as [`item`, string]
const itemClaim = allocateIntoStore(IMPLICIT.STORE, [playerClaim], itemKey)
