import type {
	CtorToolkit,
	MK,
	MoleculeConstructor,
	MoleculeCreation,
	MoleculeFamilyToken,
	MoleculeKey,
	MoleculeParams,
	MoleculeToken,
	ReadableFamilyToken,
} from "atom.io"
import { findRelations, getJoin, type JoinToken } from "atom.io/data"
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

function capitalize<S extends string>(string: S): Capitalize<S> {
	return (string[0].toUpperCase() + string.slice(1)) as Capitalize<S>
}

export function makeMoleculeInStore<M extends MoleculeConstructor>(
	store: Store,
	context: MoleculeToken<M> | MoleculeToken<M>[],
	familyToken: MoleculeFamilyToken<M>,
	key: MoleculeKey<M>,
	...params: MoleculeParams<M>
): MoleculeToken<M> {
	const target = newest(store)

	target.moleculeInProgress = key

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

	const molecule = new Molecule(owners, key, familyToken)
	target.molecules.set(stringifyJson(key), molecule)
	for (const owner of owners) {
		owner.below.set(molecule.stringKey, molecule)
	}

	const toolkit = {
		get: (t) => getFromStore(t, undefined, newest(store)),
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
		bond: ((
			token: JoinToken<any, any, any, any> | ReadableFamilyToken<any, any>,
			maybeRole,
		) => {
			if (token.type === `join`) {
				const { as: role } = maybeRole
				const join = getJoin(token, store)
				join.molecules.set(stringifyJson(key), molecule)
				molecule.joins.set(token.key, join)
				if (role === null) {
					return
				}
				const otherRole = token.a === role ? token.b : token.a
				const relations = findRelations(token, key)
				const relatedKeys =
					relations[
						`${otherRole}KeysOf${capitalize(role)}` as keyof typeof relations
					]
				const relatedEntries =
					relations[
						`${otherRole}EntriesOf${capitalize(role)}` as keyof typeof relations
					]
				let tokens = { relatedKeys }
				if (relatedEntries) {
					tokens = Object.assign(tokens, { relatedEntries })
				}
				return tokens
			}
			return growMoleculeInStore(molecule, withdraw(token, store), newest(store))
		}) as CtorToolkit<MK<M>>[`bond`],
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
		spawn: (f: MoleculeFamilyToken<any>, k: any, ...p: any[]) =>
			makeMoleculeInStore(
				newest(store),
				[molecule],
				withdraw(f, store),
				k,
				...p,
			),
	} satisfies CtorToolkit<MK<M>>

	const family = withdraw(familyToken, store)
	const Constructor = family.new

	molecule.instance = new Constructor(toolkit, key, ...params)

	const token = {
		type: `molecule`,
		key,
		family: familyToken,
	} as const satisfies MoleculeToken<M>

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
