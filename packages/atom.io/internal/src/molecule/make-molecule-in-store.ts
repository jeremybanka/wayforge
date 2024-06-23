import type {
	MK,
	MoleculeConstructor,
	MoleculeCreation,
	MoleculeFamilyToken,
	MoleculeKey,
	MoleculeParams,
	MoleculeToken,
	MoleculeTransactors,
	ReadableFamilyToken,
} from "atom.io"
import { getJoin, type JoinToken } from "atom.io/data"
import type { seekState } from "atom.io/immortal"
import { stringifyJson } from "atom.io/json"

import { arbitrary } from "../arbitrary"
import { disposeFromStore, seekInStore } from "../families"
import { getEnvironmentData } from "../get-environment-data"
import { getFromStore } from "../get-state"
import { newest } from "../lineage"
import { getJsonToken } from "../mutable"
import { setIntoStore } from "../set-state"
import type { Store } from "../store"
import { withdraw } from "../store"
import { actUponStore, isChildStore, isRootStore } from "../transaction"
import { growMoleculeInStore } from "./grow-molecule-in-store"
import { Molecule } from "./molecule-internal"

export function makeMoleculeInStore<M extends MoleculeConstructor>(
	store: Store,
	context: MoleculeToken<M> | MoleculeToken<M>[],
	familyToken: MoleculeFamilyToken<M>,
	key: MoleculeKey<M>,
	...params: MoleculeParams<M>
): MoleculeToken<M> {
	const target = newest(store)

	target.moleculeInProgress = key

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
		claim: (below, options) => {
			const { exclusive } = options
			const belowMolecule = newest(store).molecules.get(stringifyJson(below.key))
			if (belowMolecule) {
				if (exclusive) {
					for (const value of belowMolecule.above.values()) {
						value.below.delete(belowMolecule.stringKey)
					}
					belowMolecule.above.clear()
					belowMolecule.above.set(molecule.stringKey, molecule)
					molecule.below.set(belowMolecule.stringKey, belowMolecule)
				} else {
					belowMolecule.above.set(molecule.stringKey, molecule)
					molecule.below.set(belowMolecule.stringKey, belowMolecule)
				}
			}
		},
		join: <J extends JoinToken<any, any, any, any>>(joinToken: J) => {
			const join = getJoin(joinToken, store)
			join.molecules.set(stringifyJson(key), molecule)
			molecule.joins.set(joinToken.key, join)
			return joinToken
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
		family: familyToken,
		context: contextArray,
		params,
	} satisfies MoleculeCreation<M>

	if (isRootStore(target)) {
		family.subject.next(update)
	} else if (
		isChildStore(target) &&
		target.on.transactionApplying.state === null
	) {
		target.transactionMeta.update.updates.push(update)
	}

	target.moleculeInProgress = null

	return token
}
