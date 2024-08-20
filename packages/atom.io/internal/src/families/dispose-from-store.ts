import type {
	MoleculeConstructor,
	MoleculeFamilyToken,
	MoleculeKey,
	MoleculeToken,
	ReadableFamilyToken,
	ReadableToken,
} from "atom.io"
import { type Canonical, stringifyJson } from "atom.io/json"

import { disposeAtom } from "../atom"
import { disposeMolecule } from "../molecule/dispose-molecule"
import { disposeSelector } from "../selector"
import type { Store } from "../store"
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
	if (params.length === 1) {
		token = params[0]
	} else {
		const family = params[0]
		const key = params[1]
		const maybeToken =
			family.type === `molecule_family`
				? seekInStore(store, family, key)
				: findInStore(store, family, key)
		if (!maybeToken || `counterfeit` in maybeToken) {
			const disposal = store.disposalTraces.buffer.find(
				(item) => item?.key === key,
			)
			store.logger.error(
				`❗`,
				family.type,
				family.key,
				`tried to dispose of member`,
				stringifyJson(key),
				`but it was not found in store "${store.config.name}".`,
				disposal
					? `This state was previously disposed:\n${disposal.trace}`
					: `No previous disposal trace was found.`,
			)
			return
		}
		token = maybeToken
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
	}
}
