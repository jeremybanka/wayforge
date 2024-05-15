import {
	disposeState,
	type MutableAtomFamilyToken,
	type MutableAtomToken,
	type ReadableFamilyToken,
	type ReadableToken,
	type ReadonlySelectorFamilyToken,
	type ReadonlySelectorToken,
	type RegularAtomFamilyToken,
	type RegularAtomToken,
	type WritableFamilyToken,
	type WritableSelectorFamilyToken,
	type WritableSelectorToken,
	type WritableToken,
} from "atom.io"
import type { Store, Transceiver } from "atom.io/internal"
import { IMPLICIT } from "atom.io/internal"
import type { Json } from "atom.io/json"

import { initFamilyMember } from "../../internal/src/families/init-family-member"

export class Molecule {
	public readonly children: Molecule[] = []
	public readonly tokens: ReadableToken<any>[] = []
	public constructor(
		public readonly parent: Molecule | null = null,
		public readonly store: Store = IMPLICIT.STORE,
	) {}

	public bond<
		T extends Transceiver<any>,
		J extends Json.Serializable,
		K extends Json.Serializable,
		Key extends K,
	>(token: MutableAtomFamilyToken<T, J, K>, key: Key): MutableAtomToken<T, J>
	public bond<T, K extends Json.Serializable, Key extends K>(
		token: RegularAtomFamilyToken<T, K>,
		key: Key,
	): RegularAtomToken<T>
	public bond<T, K extends Json.Serializable, Key extends K>(
		token: WritableSelectorFamilyToken<T, K>,
		key: Key,
	): WritableSelectorToken<T>
	public bond<T, K extends Json.Serializable, Key extends K>(
		token: ReadonlySelectorFamilyToken<T, K>,
		key: Key,
	): ReadonlySelectorToken<T>
	public bond<T, K extends Json.Serializable, Key extends K>(
		token: WritableFamilyToken<T, K>,
		key: Key,
	): WritableToken<T>
	public bond<T, K extends Json.Serializable, Key extends K>(
		token: ReadableFamilyToken<T, K>,
		key: Key,
	): ReadableToken<T>
	public bond(
		token: ReadableFamilyToken<any, any>,
		key: Json.Serializable,
	): ReadableToken<any> {
		const state = initFamilyMember(token, key, this.store)
		this.tokens.push(state)
		return state
	}

	public spawn(): Molecule {
		const child = new Molecule(this)
		this.children.push(child)
		return child
	}

	public detach(child: Molecule): void {
		const index = this.children.indexOf(child)
		if (index !== undefined) {
			this.children.splice(index, 1)
		}
	}

	public claim(child: Molecule): void {
		if (child === this) {
			return
		}
		child.parent?.detach(child)
		this.children.push(child)
	}

	public clear(): void {
		while (this.children.length > 0) {
			this.children.pop()?.dispose()
		}
		while (this.tokens.length > 0) {
			const token = this.tokens.pop()
			if (token) {
				disposeState(token, this.store)
			}
		}
	}

	private [Symbol.dispose](): void {
		this.clear()
		if (this.parent) {
			this.parent.detach(this)
		}
	}
	public dispose = this[Symbol.dispose]
}
