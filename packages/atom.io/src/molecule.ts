import type {
	ActorToolkit,
	Flat,
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
import type { Store, Subject, Transceiver } from "atom.io/internal"
import {
	createMoleculeFamily,
	IMPLICIT,
	makeMoleculeInStore,
	Molecule,
} from "atom.io/internal"
import { type Json, stringifyJson } from "atom.io/json"

export type CtorToolkit<K extends Json.Serializable> = Flat<
	Omit<ActorToolkit, `find`> & {
		bond<T extends Transceiver<any>, J extends Json.Serializable>(
			family: MutableAtomFamilyToken<T, J, K>,
		): MutableAtomToken<T, J>
		bond<T>(family: RegularAtomFamilyToken<T, K>): RegularAtomToken<T>
		bond<T>(family: WritableSelectorFamilyToken<T, K>): WritableSelectorToken<T>
		bond<T>(family: ReadonlySelectorFamilyToken<T, K>): ReadonlySelectorToken<T>
		bond<T>(family: WritableFamilyToken<T, K>): WritableToken<T>
		bond<T>(family: ReadableFamilyToken<T, K>): ReadableToken<T>
		bond<J extends JoinToken<any, any, any, any>>(
			joinToken: J,
			role: {
				as: J extends JoinToken<infer A, infer B, any, any> ? A | B : never
			},
		): J extends JoinToken<any, any, any, infer Content>
			? Content extends null
				? { relatedKeys: ReadonlySelectorToken<string[]> }
				: {
						relatedKeys: ReadonlySelectorToken<string[]>
						relatedEntries: ReadonlySelectorToken<
							[key: string, value: Content][]
						>
					}
			: never

		claim(below: MoleculeToken<any>, options: { exclusive: boolean }): void

		spawn<Key extends Json.Serializable, Ctor extends MoleculeConstructor>(
			family: MoleculeFamilyToken<Ctor>,
			key: Key,
			...params: MoleculeParams<Ctor>
		): MoleculeToken<Ctor>
	}
>
export type MoleculeConstructor = new (
	toolkit: CtorToolkit<any>,
	key: any,
	...params: any
) => any

type Tail<T extends any[]> = T extends [any, ...infer Rest] ? Rest : any[]

export type MoleculeParams<M extends MoleculeConstructor> = Tail<
	Tail<ConstructorParameters<M>>
>

export type MoleculeFamilyOptions<M extends MoleculeConstructor> = {
	key: string
	dependsOn?: `all` | `any`
	new: M
}
export type MoleculeFamilyToken<M extends MoleculeConstructor> = {
	key: string
	type: `molecule_family`
	dependsOn: `all` | `any`
	__M?: M
}
export type MoleculeFamily<M extends MoleculeConstructor> = Flat<
	MoleculeFamilyToken<M> & {
		subject: Subject<MoleculeCreation<M> | MoleculeDisposal>
		dependsOn: `all` | `any`
		new: M
	}
>
export type MoleculeToken<M extends MoleculeConstructor> = {
	key: MK<M>
	type: `molecule`
	family?: MoleculeFamilyToken<M>
	__M?: M
}

export function moleculeFamily<M extends MoleculeConstructor>(
	options: MoleculeFamilyOptions<M>,
): MoleculeFamilyToken<M> {
	return createMoleculeFamily(options, IMPLICIT.STORE)
}

export function makeMolecule<M extends MoleculeConstructor>(
	context: MoleculeToken<any> | MoleculeToken<any>[],
	family: MoleculeFamilyToken<M>,
	key: MoleculeKey<M>,
	...params: MoleculeParams<M>
): MoleculeToken<M> {
	return makeMoleculeInStore(IMPLICIT.STORE, context, family, key, ...params)
}

export type MoleculeType<T extends MoleculeFamilyToken<any>> =
	T extends MoleculeFamilyToken<infer M>
		? M
		: T extends MoleculeToken<infer M>
			? M
			: never
export type MoleculeKey<M extends MoleculeConstructor> = InstanceType<M>[`key`]
export type MK<M extends MoleculeConstructor> = MoleculeKey<M>

export function makeRootMolecule(
	key: string,
	store: Store = IMPLICIT.STORE,
): MoleculeToken<ObjectConstructor> {
	const molecule = new Molecule(undefined, key)
	store.molecules.set(stringifyJson(key), molecule)
	return {
		key,
		type: `molecule`,
	} as const
}
