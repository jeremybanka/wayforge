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

export function allocateIntoStore<K extends Canonical>(
	store: Store = IMPLICIT.STORE,
	provenance: Claim<Canonical> | Claim<Canonical>[] | `root`,
	key: K,
): Claim<K> {
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

const gameKey = [`game`, `xxx`] as [`game`, string]
const userKey = [`user`, `yyy`] as [`user`, string]
const playerKey = [
	[`type`, `player`],
	[`game`, `xxx`],
	[`user`, `yyy`],
] as [[`type`, `player`], [`game`, string], [`user`, string]]
const gameClaim = allocateIntoStore(IMPLICIT.STORE, `root`, gameKey)
const userClaim = allocateIntoStore(IMPLICIT.STORE, `root`, userKey)
const playerClaim = allocateIntoStore(
	IMPLICIT.STORE,
	[gameClaim, userClaim],
	playerKey,
)
const itemKey = [`item`, `xxx`] as [`item`, string]
const itemClaim = allocateIntoStore(
	IMPLICIT.STORE
	playerClaim, 
	itemKey, 
)

export function bondWithinStore<K extends Canonical>(
	provenance: Claim<Canonical> | Claim<Canonical>[] | `root`,
	key: K,
	store: Store = IMPLICIT.STORE,
) {}

export function deallocateFromStore<K extends Canonical>() {}

type MergeArrays<A, B> = A extends Array<unknown>
	? B extends Array<unknown>
		? [...A, ...B]
		: [...A]
	: B extends Array<unknown>
		? [...B]
		: never[]
