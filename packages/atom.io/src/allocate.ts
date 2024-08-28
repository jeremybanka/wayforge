import type { Store } from "atom.io/internal"
import { IMPLICIT, Molecule } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

// export type CtorToolkit<K extends Canonical> = Flat<
// 	Omit<ActorToolkit, `find`> & {
// 		claim(below: MoleculeToken<any>, options: { exclusive: boolean }): void

// 		spawn<Key extends Canonical, Ctor extends MoleculeConstructor>(
// 			family: MoleculeFamilyToken<Ctor>,
// 			key: Key,
// 			...params: MoleculeParams<Ctor>
// 		): MoleculeToken<Ctor>
// 	}
// >

export type Claim<K extends Canonical> = {
	key: K
	type: `molecule`
}

export function allocateIntoStore<H extends Hierarchy, TK extends TypedKey>(
	store: Store,
	provenance: Above<TK, H>,
	key: TK,
): Claim<TK> {
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

	return {
		key,
		type: `molecule`,
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
type Hierarchy<K extends keyof any> = { [key in K]: Purview }

interface GameHierarchy extends Hierarchy<0 | 1 | 2 | 3> {
	0: { above: `root`; below: [GameKey, UserKey] }
	1: { above: [GameKey, UserKey]; below: [PlayerKey] }
	2: { above: [GameKey]; below: [ItemKey] }
	3: { above: [PlayerKey]; below: [ItemKey] }
}

type Above<TK extends TypedKey, H extends Hierarchy<keyof any>> = {
	[K in keyof H]: TK extends H[K][`below`][number] ? H[K][`above`] : never
}[]

type AboveGame = Above<GameKey, GameHierarchy>

type Below<TK extends TypedKey[], H extends Hierarchy<any>> = {
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
const gameClaim = allocateIntoStore(IMPLICIT.STORE, `root`, gameKey)
const userClaim = allocateIntoStore(IMPLICIT.STORE, `root`, userKey)
const playerClaim = allocateIntoStore(
	IMPLICIT.STORE,
	[gameClaim, userClaim],
	playerKey,
)

const itemKey = [`item`, `xxx`] as [`item`, string]
const itemClaim = allocateIntoStore(IMPLICIT.STORE, [playerClaim], itemKey)

export function bondWithinStore<K extends Canonical>(
	store: Store,
	provenance: Claim<Canonical> | Claim<Canonical>[] | `root`,
	key: K,
) {}

export function deallocateFromStore<K extends Canonical>() {}

type MergeArrays<A, B> = A extends Array<unknown>
	? B extends Array<unknown>
		? [...A, ...B]
		: [...A]
	: B extends Array<unknown>
		? [...B]
		: never[]
