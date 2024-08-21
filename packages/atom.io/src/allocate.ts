import type {
	ActorToolkit,
	MoleculeCreation,
	MoleculeDisposal,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlySelectorFamilyToken,
	ReadonlySelectorToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	WritableFamilyToken,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"
import type { JoinToken } from "atom.io/data"
import type { Flat, Store, Subject, Transceiver } from "atom.io/internal"
import {
	createMoleculeFamily,
	IMPLICIT,
	makeMoleculeInStore,
	Molecule,
} from "atom.io/internal"
import type { Canonical, Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

export type CtorToolkit<K extends Canonical> = Flat<
	Omit<ActorToolkit, `find`> & {
		claim(below: MoleculeToken<any>, options: { exclusive: boolean }): void

		spawn<Key extends Canonical, Ctor extends MoleculeConstructor>(
			family: MoleculeFamilyToken<Ctor>,
			key: Key,
			...params: MoleculeParams<Ctor>
		): MoleculeToken<Ctor>
	}
>

export type Hierarch = Bond<Canonical, Canonical[]>[] | Canonical[]

export type Bond<K extends Canonical, H extends Hierarch> = {
	bond: [K, H]
}

export type Ent<K extends Canonical> = {
	key: K
	type: `molecule`
}

export type Claim<K extends Canonical, H extends Hierarch> = Bond<K, H> & Ent<K>

export type GamePlayer = Bond<
	[`game`, string],
	[[`game`, string], [`player`, string]]
>

export function allocateWithinStore<K extends Canonical>(
	provenance: `root`,
	key: K,
	store: Store,
): Claim<K, [`root`]>
export function allocateWithinStore<
	K extends Canonical,
	H extends Claim<Canonical, Canonical[]>[],
>(provenance: H, key: K, store: Store): Claim<K, H>
export function allocateWithinStore<
	K extends Canonical,
	H extends Claim<Canonical, Canonical[]>[],
>(
	provenance: H | `root`,
	key: K,
	store: Store = IMPLICIT.STORE,
): Claim<K, H | [`root`]> {
	const molecule = new Molecule(undefined, key)
	store.molecules.set(stringifyJson(key), molecule)
	const higher =
		provenance === `root` ? ([provenance] satisfies [`root`]) : provenance

	return {
		key,
		type: `molecule`,
		bond: [key, higher],
	}
}

const gameKey = [`game`, `xxx`] as [`game`, string]
const userKey = [`user`, `yyy`] as [`user`, string]
const playerKey = [
	[`type`, `player`],
	[`game`, `xxx`],
	[`user`, `yyy`],
] as [[`type`, `player`], [`game`, string], [`user`, string]]
const gameClaim = allocateWithinStore(`root`, gameKey, IMPLICIT.STORE)
const userClaim = allocateWithinStore(`root`, userKey, IMPLICIT.STORE)
const playerClaim = allocateWithinStore(
	[gameClaim, userClaim],
	playerKey,
	IMPLICIT.STORE,
)
const itemKey = [`item`, `xxx`] as [`item`, string]
const itemClaim = allocateWithinStore([playerClaim], itemKey, IMPLICIT.STORE)

export function bondWithinStore<K extends Canonical,
	provenance: H | `root`,
	key: K,
	store: Store = IMPLICIT.STORE,
) {}

export function deallocateWithinStore<K extends Canonical>() {}

type MergeArrays<A, B> = A extends Array<unknown>
	? B extends Array<unknown>
		? [...A, ...B]
		: [...A]
	: B extends Array<unknown>
		? [...B]
		: never[]
