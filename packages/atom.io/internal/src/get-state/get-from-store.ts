import type { MoleculeConstructor, MoleculeToken, ReadableToken } from "atom.io"

import type { Store } from "../store"
import { withdraw } from "../store"
import { readOrComputeValue } from "./read-or-compute-value"

export function getFromStore<T>(token: ReadableToken<T>, store: Store): T
export function getFromStore<M extends MoleculeConstructor>(
	token: MoleculeToken<M>,
	store: Store,
): InstanceType<M> | undefined
export function getFromStore<
	T,
	M extends MoleculeConstructor,
	Token extends MoleculeToken<M> | ReadableToken<T>,
>(token: Token, store: Store): InstanceType<M> | T | undefined
export function getFromStore<
	Token extends MoleculeToken<any> | ReadableToken<any>,
>(
	token: Token,
	store: Store,
):
	| (Token extends MoleculeToken<infer M>
			? InstanceType<M>
			: Token extends ReadableToken<infer T>
				? T
				: never)
	| undefined {
	if (token.type === `molecule`) {
		try {
			const molecule = withdraw(token, store)
			return molecule.instance
		} catch (_) {
			return undefined
		}
	}
	const state = withdraw(token, store)
	return readOrComputeValue(state, store)
}
