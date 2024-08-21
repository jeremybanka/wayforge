import type {
	MoleculeConstructor,
	MoleculeFamilyToken,
	MoleculeKey,
	MoleculeToken,
	ReadableFamilyToken,
	ReadableToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"

import { disposeAtom } from "../atom"
import { disposeMolecule } from "../molecule/dispose-molecule"
import { disposeSelector } from "../selector"
import { counterfeit, type Store, withdraw } from "../store"
import { findInStore } from "./find-in-store"
import { seekInStore } from "./seek-in-store"

export function disposeFromStore(
	store: Store,
	token: MoleculeToken<any> | ReadableToken<any>,
): void

export function disposeFromStore<K extends Canonical>(
	store: Store,
	token: ReadableFamilyToken<any, K>,
	key: K,
): void

export function disposeFromStore<M extends MoleculeConstructor>(
	store: Store,
	token: MoleculeFamilyToken<M>,
	key: MoleculeKey<M>,
): void

export function disposeFromStore(
	store: Store,
	...params:
		| [token: MoleculeFamilyToken<any>, key: MoleculeKey<any>]
		| [token: MoleculeToken<any> | ReadableToken<any>]
		| [token: ReadableFamilyToken<any, any>, key: Canonical]
): void {
	let token: MoleculeToken<any> | ReadableToken<any>
	let fullKey: string
	if (params.length === 1) {
		token = params[0]
		fullKey = token.key
	} else {
		const family = params[0]
		const key = params[1]
		const maybeToken =
			family.type === `molecule_family`
				? seekInStore(store, family, key) ?? counterfeit(family, key)
				: findInStore(store, family, key)
		token = maybeToken
	}
	try {
		withdraw(token, store)
	} catch (thrown) {
		const disposal = store.disposalTraces.buffer.find(
			(item) => item?.key === token.key,
		)
		console.log(
			`seeking disposal trace for`,
			token,
			store.disposalTraces.buffer.filter(Boolean),
		)
		store.logger.error(
			`❌`,
			token.type,
			token.key,
			`could not be disposed because it was not found in the store "${store.config.name}".`,
			disposal
				? `\n   This state was most recently disposed\n${disposal.trace}`
				: `No previous disposal trace was found.`,
		)
		return
	}
	switch (token.type) {
		case `atom`:
		case `mutable_atom`:
			disposeAtom(token, store)
			break
		case `selector`:
		case `readonly_selector`:
			disposeSelector(token, store)
			break
		case `molecule`:
			disposeMolecule(token, store)
			break
	}

	const { stack } = new Error()
	if (stack) {
		const trace = stack?.split(`\n`)?.slice(3)?.join(`\n`)
		store.disposalTraces.add({ key: token.key, trace })
		console.log(`added`, token)
	}
}
