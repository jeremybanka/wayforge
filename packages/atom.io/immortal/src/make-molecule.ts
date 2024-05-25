import type {
	AtomFamily,
	AtomToken,
	Flat,
	MoleculeCreation,
	MoleculeDisposal,
	MutableAtomFamily,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamily,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlySelectorFamily,
	ReadonlySelectorFamilyToken,
	ReadonlySelectorToken,
	RegularAtomFamily,
	RegularAtomFamilyToken,
	RegularAtomToken,
	SelectorFamily,
	SelectorToken,
	TransactorsWithRunAndEnv,
	WritableFamily,
	WritableFamilyToken,
	WritableSelectorFamily,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"
import { getJoin, type JoinToken } from "atom.io/data"
import {
	actUponStore,
	arbitrary,
	deposit,
	disposeFromStore,
	getEnvironmentData,
	getFromStore,
	getJsonToken,
	IMPLICIT,
	initFamilyMemberInStore,
	isChildStore,
	newest,
	seekInStore,
	setIntoStore,
	type Store,
	Subject,
	type Transceiver,
	withdraw,
} from "atom.io/internal"
import { type Json, stringifyJson } from "atom.io/json"

import { Molecule } from "./molecule"
import type { seekState } from "./seek-state"

export type MoleculeTransactors<K extends Json.Serializable> = Flat<
	Omit<TransactorsWithRunAndEnv, `find`> & {
		bond<T extends Transceiver<any>, J extends Json.Serializable>(
			family: MutableAtomFamilyToken<T, J, K>,
		): MutableAtomToken<T, J>
		bond<T>(family: RegularAtomFamilyToken<T, K>): RegularAtomToken<T>
		bond<T>(family: WritableSelectorFamilyToken<T, K>): WritableSelectorToken<T>
		bond<T>(family: ReadonlySelectorFamilyToken<T, K>): ReadonlySelectorToken<T>
		bond<T>(family: WritableFamilyToken<T, K>): WritableToken<T>
		bond<T>(family: ReadableFamilyToken<T, K>): ReadableToken<T>

		join(joinToken: JoinToken<any, any, any, any>): void

		spawn<Key extends Json.Serializable, Ctor extends MoleculeConstructor>(
			family: MoleculeFamilyToken<Ctor>,
			key: Key,
			...params: MoleculeParams<Ctor>
		): MoleculeToken<Ctor>
	}
>
export type MoleculeConstructor = new (
	transactors: MoleculeTransactors<any>,
	key: Json.Serializable,
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

export function growMoleculeInStore<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
>(
	molecule: Molecule<any>,
	family: MutableAtomFamily<T, J, K>,
	store: Store,
): MutableAtomToken<T, J>
export function growMoleculeInStore<T, K extends Json.Serializable>(
	molecule: Molecule<any>,
	family: RegularAtomFamily<T, K>,
	store: Store,
): RegularAtomToken<T>
export function growMoleculeInStore<T, K extends Json.Serializable>(
	molecule: Molecule<any>,
	family: AtomFamily<T, K>,
	store: Store,
): AtomToken<T>
export function growMoleculeInStore<T, K extends Json.Serializable>(
	molecule: Molecule<any>,
	family: WritableSelectorFamily<T, K>,
	store: Store,
): WritableSelectorToken<T>
export function growMoleculeInStore<T, K extends Json.Serializable>(
	molecule: Molecule<any>,
	family: ReadonlySelectorFamily<T, K>,
	store: Store,
): ReadonlySelectorToken<T>
export function growMoleculeInStore<T, K extends Json.Serializable>(
	molecule: Molecule<any>,
	family: SelectorFamily<T, K>,
	store: Store,
): SelectorToken<T>
export function growMoleculeInStore<T, K extends Json.Serializable>(
	molecule: Molecule<any>,
	family: WritableFamily<T, K>,
	store: Store,
): WritableToken<T>
export function growMoleculeInStore<T, K extends Json.Serializable>(
	molecule: Molecule<any>,
	family: ReadableFamily<T, K>,
	store: Store,
): ReadableToken<T>
export function growMoleculeInStore(
	molecule: Molecule<any>,
	family: ReadableFamily<any, any>,
	store: Store,
): ReadableToken<any> {
	const stateToken = initFamilyMemberInStore(family, molecule.key, store)
	molecule.tokens.set(stateToken.key, stateToken)
	const isTransaction =
		isChildStore(store) && store.transactionMeta.phase === `building`
	if (isTransaction) {
		store.transactionMeta.update.updates.push({
			type: `state_creation`,
			token: stateToken,
		})
	} else {
		molecule.subject.next({ type: `state_creation`, token: stateToken })
	}
	return stateToken
}

export function createMoleculeFamily<M extends MoleculeConstructor>(
	options: MoleculeFamilyOptions<M>,
	store: Store,
): MoleculeFamilyToken<M> {
	const subject = new Subject<MoleculeCreation<M>>()

	const token = {
		type: `molecule_family`,
		key: options.key,
		dependsOn: options.dependsOn ?? `all`,
	} as const satisfies MoleculeFamilyToken<M>
	const family = {
		...token,
		subject,
		new: options.new,
	} satisfies MoleculeFamily<M>
	store.moleculeFamilies.set(options.key, family)
	return token
}

export function moleculeFamily<M extends MoleculeConstructor>(
	options: MoleculeFamilyOptions<M>,
): MoleculeFamilyToken<M> {
	return createMoleculeFamily(options, IMPLICIT.STORE)
}

export function makeMoleculeInStore<M extends MoleculeConstructor>(
	store: Store,
	context: MoleculeToken<M> | MoleculeToken<M>[],
	familyToken: MoleculeFamilyToken<M>,
	key: MK<M>,
	...params: MoleculeParams<M>
): MoleculeToken<M> {
	const target = newest(store)

	const token = {
		type: `molecule`,
		key,
		family: familyToken,
	} as const satisfies MoleculeToken<M>

	const contextArray = Array.isArray(context) ? context : [context]
	const owners = contextArray.map<Molecule<M>>((ctx) => {
		if (ctx instanceof Molecule) {
			return ctx
		}
		const stringKey = stringifyJson(ctx.key)
		const molecule = store.molecules.get(stringKey)

		if (!molecule) {
			throw new Error(
				`Molecule ${stringKey} not found in store "${store.config.name}"`,
			)
		}
		return molecule
	})

	const family = withdraw(familyToken, store)
	const molecule = new Molecule(owners, key, family)
	target.molecules.set(stringifyJson(key), molecule)
	for (const owner of owners) {
		owner.below.set(molecule.stringKey, molecule)
	}

	const transactors = {
		get: (t) => getFromStore(t, newest(store)),
		set: (t, newValue) => {
			setIntoStore(t, newValue, newest(store))
		},
		seek: ((t, k) => seekInStore(t, k, newest(store))) as typeof seekState,
		json: (t) => getJsonToken(t, newest(store)),
		run: (t, i = arbitrary()) => actUponStore(t, i, newest(store)),
		make: (ctx, f, k, ...args) =>
			makeMoleculeInStore(newest(store), ctx, f, k, ...args),
		dispose: (t) => {
			disposeFromStore(t, newest(store))
		},
		env: () => getEnvironmentData(newest(store)),
		bond: ((f: ReadableFamilyToken<any, any>) =>
			growMoleculeInStore(
				molecule,
				withdraw(f, store),
				newest(store),
			)) as MoleculeTransactors<MK<M>>[`bond`],
		join: (joinToken: JoinToken<any, any, any, any>) => {
			const join = getJoin(joinToken, store)
			join.molecules.set(stringifyJson(key), molecule)
			molecule.joins.set(joinToken.key, join)
		},
		spawn: (f: MoleculeFamilyToken<any>, k: any, ...p: any[]) =>
			makeMoleculeInStore(
				newest(store),
				[molecule],
				withdraw(f, store),
				k,
				...p,
			),
	} satisfies MoleculeTransactors<MK<M>>
	const Constructor = family.new

	molecule.instance = new Constructor(transactors, token.key, ...params)

	const update = {
		type: `molecule_creation`,
		token,
		family,
		context: contextArray,
		params,
	} satisfies MoleculeCreation<M>

	const isTransaction =
		isChildStore(target) && target.transactionMeta.phase === `building`
	if (isTransaction) {
		target.transactionMeta.update.updates.push(update)
	} else {
		family.subject.next(update)
	}

	return token
}
export function makeMolecule<M extends MoleculeConstructor>(
	context: MoleculeToken<any> | MoleculeToken<any>[],
	family: MoleculeFamilyToken<M>,
	key: MoleculeKey<M>,
	...params: MoleculeParams<M>
): MoleculeToken<M> {
	return makeMoleculeInStore(IMPLICIT.STORE, context, family, key, ...params)
}

export function useMoleculeFromStore<M extends MoleculeConstructor>(
	token: MoleculeToken<M>,
	store: Store,
): InstanceType<M> | undefined {
	const molecule = store.molecules.get(stringifyJson(token.key))
	return molecule?.instance
}
export function useMolecule<M extends MoleculeConstructor>(
	token: MoleculeToken<M>,
): InstanceType<M> | undefined {
	return useMoleculeFromStore(token, IMPLICIT.STORE)
}

export function disposeMolecule<M extends MoleculeConstructor>(
	token: MoleculeToken<M>,
	store: Store,
): void {
	const stringKey = stringifyJson(token.key)
	let molecule: Molecule<M>
	try {
		molecule = withdraw(token, store)
	} catch (thrown) {
		if (thrown instanceof Error) {
			store.logger.error(
				`🐞`,
				`molecule`,
				stringKey,
				`Failed to dispose molecule, because it was not found in the store.`,
				thrown.message,
			)
		}
		return
	}
	const { family } = token
	if (family) {
		const Formula = withdraw(family, store)
		const disposalEvent: MoleculeDisposal = {
			type: `molecule_disposal`,
			token,
			family,
			context: [...molecule.above.values()].map((m) => deposit(m)),
			familyKeys: [...molecule.tokens.values()]
				.map((t) => t.family?.key)
				.filter((k): k is string => typeof k === `string`),
		}
		if (token.family) {
			disposalEvent.family = token.family
		}
		const isTransaction =
			isChildStore(store) && store.transactionMeta.phase === `building`
		if (isTransaction) {
			store.transactionMeta.update.updates.push(disposalEvent)
		} else {
			Formula.subject.next(disposalEvent)
		}
		store.molecules.delete(stringifyJson(token.key))
	}

	for (const state of molecule.tokens.values()) {
		disposeFromStore(state, store)
	}
	for (const child of molecule.below.values()) {
		if (child.family?.dependsOn === `all`) {
			disposeMolecule(child, store)
		} else {
			child.above.delete(stringifyJson(molecule.key))
			if (child.above.size === 0) {
				disposeMolecule(child, store)
			}
		}
	}
	for (const join of molecule.joins.values()) {
		join.molecules.delete(stringifyJson(token.key))
	}
	for (const parent of molecule.above.values()) {
		parent.below.delete(stringifyJson(molecule.key))
	}
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
