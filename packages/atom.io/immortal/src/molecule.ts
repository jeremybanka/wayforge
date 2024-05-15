import type {
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
import type { Store, Transceiver } from "atom.io/internal"
import { findInStore, IMPLICIT } from "atom.io/internal"
import type { Json } from "atom.io/json"

export class Molecule {
	public readonly children: Molecule[] = []
	public readonly tokens: ReadableToken<any>[] = []
	public constructor(
		public readonly parent: Molecule,
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
		const state = findInStore(token, key, IMPLICIT.STORE)
		this.tokens.push(state)
		return state
	}

	public spawn(): Molecule {
		const child = new Molecule(this)
		this.children.push(child)
		return child
	}

	private [Symbol.dispose](): void {
		while (this.children.length > 0) {
			this.children.pop()?.[Symbol.dispose]()
		}
		while (this.tokens.length > 0) {
			this.tokens.pop()?.[Symbol.dispose]()
		}
	}
	public dispose = this[Symbol.dispose]
}
