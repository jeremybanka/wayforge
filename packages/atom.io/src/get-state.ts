import * as Internal from "atom.io/internal"

import type { MoleculeConstructor, MoleculeToken, ReadableToken } from "."

export function getState<T>(token: ReadableToken<T>): T
export function getState<M extends MoleculeConstructor>(
	token: MoleculeToken<M>,
): InstanceType<M> | undefined
export function getState(token: MoleculeToken<any> | ReadableToken<any>): any {
	return Internal.getFromStore(token, Internal.IMPLICIT.STORE)
}
