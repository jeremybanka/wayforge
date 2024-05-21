import * as Internal from "atom.io/internal"
import { type Json, stringifyJson } from "atom.io/json"

import type { MoleculeCreation, MoleculeDisposal } from "../../src/transaction"
import { Molecule } from "./molecule"

export type MoleculeFamilyToken<
	Key extends Json.Serializable,
	Struct extends { [key: string]: any },
	Params extends any[],
> = {
	key: string
	type: `molecule_family`
	__K?: Key
	__S?: Struct
	__P?: Params
}
export type MoleculeToken<
	Key extends Json.Serializable,
	Struct extends { [key: string]: any },
	Params extends any[],
> = {
	key: Key
	type: `molecule`
	__S?: Struct
	__P?: Params
}

export type MoleculeFamilyOptions<
	Key extends Json.Serializable,
	Struct extends { [key: string]: any },
	Params extends any[],
> = {
	key: string
	new: (
		store: Internal.Store,
	) => new (
		context: Molecule<any>,
		key: Key,
		...params: Params
	) => Molecule<Key> & Struct
}

export function createMoleculeFamily<
	Key extends Json.Serializable,
	Struct extends { [key: string]: any },
	Params extends any[],
>(
	options: MoleculeFamilyOptions<Key, Struct, Params>,
	store: Internal.Store,
): MoleculeFamilyToken<Key, Struct, Params> {
	const subject = new Internal.Subject<MoleculeCreation | MoleculeDisposal>()
	const family = Object.assign(options.new(store), { subject })
	store.moleculeFamilies.set(options.key, family)
	return {
		key: options.key,
		type: `molecule_family`,
	} as const
}

export function moleculeFamily<
	Key extends Json.Serializable,
	Params extends any[],
	Struct extends { [key: string]: any },
>(
	options: MoleculeFamilyOptions<Key, Struct, Params>,
): MoleculeFamilyToken<Key, Struct, Params> {
	return createMoleculeFamily(options, Internal.IMPLICIT.STORE)
}

export function makeMoleculeInStore<
	Key extends Json.Serializable,
	Struct extends { [key: string]: any },
	Params extends any[],
>(
	store: Internal.Store,
	context: MoleculeToken<any, any, any>,
	family: MoleculeFamilyToken<Key, Struct, Params>,
	key: Key,
	...params: Params
): MoleculeToken<Key, Struct, Params> {
	const target = Internal.newest(store)
	const isTransaction =
		Internal.isChildStore(target) && target.transactionMeta.phase === `building`
	const token = {
		key,
		type: `molecule`,
	} as const

	const owner = store.molecules.get(stringifyJson(context.key))
	if (!owner) {
		throw new Error(`No owner found for key "${family.key}"`)
	}
	const Formula = store.moleculeFamilies.get(family.key)
	if (!Formula) {
		throw new Error(`No Formula found for key "${family.key}"`)
	}
	const molecule = new Formula(owner, key, ...params)

	const update = {
		type: `molecule_creation`,
		key: family.key,
		subKey: key,
		aboveKeys: [context.key],
	} satisfies MoleculeCreation

	if (isTransaction) {
		target.transactionMeta.update.updates.push(update)
	} else {
		Formula.subject.next(update)
	}

	target.molecules.set(stringifyJson(key), molecule)

	return token
}
export function makeMolecule<
	Key extends Json.Serializable,
	Struct extends { [key: string]: any },
	Params extends any[],
>(
	context: MoleculeToken<any, any, any>,
	family: MoleculeFamilyToken<Key, Struct, Params>,
	key: Key,
	...params: Params
): MoleculeToken<Key, Struct, Params> {
	return makeMoleculeInStore(
		Internal.IMPLICIT.STORE,
		context,
		family,
		key,
		...params,
	)
}

export function useMoleculeFromStore<
	Key extends Json.Serializable,
	Struct extends { [key: string]: any },
	Params extends any[],
>(
	token: MoleculeToken<Key, Struct, Params>,
	store: Internal.Store,
): (Molecule<Key> & Struct) | undefined {
	const molecule = store.molecules.get(stringifyJson(token.key))
	return molecule as Molecule<Key> & Struct
}
export function useMolecule<
	Key extends Json.Serializable,
	Struct extends { [key: string]: any },
	Params extends any[],
>(
	token: MoleculeToken<Key, Struct, Params>,
): (Molecule<Key> & Struct) | undefined {
	return useMoleculeFromStore(token, Internal.IMPLICIT.STORE)
}

export type MoleculeType<M extends MoleculeFamilyToken<any, any, any>> =
	M extends MoleculeFamilyToken<any, infer T, any> ? T : never

export function makeRootMolecule(
	key: Json.Serializable,
	store: Internal.Store = Internal.IMPLICIT.STORE,
): MoleculeToken<Json.Serializable, { [key: string]: unknown }, []> {
	const molecule = new Molecule(store, undefined, key)
	store.molecules.set(stringifyJson(key), molecule)
	return {
		key,
		type: `molecule`,
	} as const
}
