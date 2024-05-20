import * as Internal from "atom.io/internal"
import { type Json, stringifyJson } from "atom.io/json"

import type { MoleculeCreation } from "../../src/transaction"
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
	store.moleculeFamilies.set(options.key, options.new(store))
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
	if (!isTransaction) {
		store.on.moleculeCreationStart.next(token)
	}
	const Formula = store.moleculeFamilies.get(family.key)
	if (!Formula) {
		throw new Error(`No Formula found for key "${family.key}"`)
	}
	const update = {
		type: `molecule_creation`,
		key: family.key,
		subKey: key,
		aboveKeys: [context.key],
	} satisfies MoleculeCreation

	if (isTransaction) {
		target.transactionMeta.update.updates.push(update)
	}
	const molecule = new Formula(context, key, ...params)

	target.molecules.set(stringifyJson(key), molecule)
	if (!isTransaction) {
		store.on.moleculeCreationDone.next(token)
	}
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

export function useMolecule<
	Key extends Json.Serializable,
	Struct extends { [key: string]: any },
	Params extends any[],
>(token: MoleculeToken<Key, Struct, Params>): Molecule<Key> & Struct {
	const store = Internal.IMPLICIT.STORE
	const molecule = store.molecules.get(stringifyJson(token.key))
	if (!molecule) {
		throw new Error(`No molecule found for key "${stringifyJson(token.key)}"`)
	}
	return molecule as Molecule<Key> & Struct
}

export type MoleculeType<M extends MoleculeFamilyToken<any, any, any>> =
	M extends MoleculeFamilyToken<any, infer T, any> ? T : never

const beings = moleculeFamily({
	key: `being`,
	new: (store) =>
		class Being extends Molecule<string> {
			public readonly data: number
			public constructor(
				context: Molecule<any>,
				public readonly id: string,
				data: number,
			) {
				super(store, context, id)
				this.data = data
			}
		},
})

export function createRootMolecule(
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

const world = createRootMolecule(`world`)

const being = makeMolecule(world, beings, `me`, 1)
