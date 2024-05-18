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
import { disposeState } from "atom.io"
import type { Join, JoinToken } from "atom.io/data"
import { getJoin } from "atom.io/data"
import type { Store, Transceiver } from "atom.io/internal"
import { getJsonFamily, IMPLICIT, initFamilyMember } from "atom.io/internal"
import { type Json, stringifyJson } from "atom.io/json"

export class Molecule<Key extends Json.Serializable> {
	public readonly below: Molecule<any>[] = []
	public readonly tokens: ReadableToken<any>[] = []
	public readonly joins: Join<any, any, any, any>[] = []
	public constructor(
		public readonly key: Key,
		public readonly above: Molecule<any>[] = [],
		public readonly store: Store = IMPLICIT.STORE,
	) {
		store.molecules.set(stringifyJson(key), this)
		for (const parent of above) {
			parent.below.push(this)
		}
	}

	public bond<
		T extends Transceiver<any>,
		J extends Json.Serializable,
		K extends string,
	>(token: MutableAtomFamilyToken<T, J, K>): MutableAtomToken<T, J>
	public bond<T, K extends Key>(
		token: RegularAtomFamilyToken<T, K>,
	): RegularAtomToken<T>
	public bond<T, K extends Json.Serializable>(
		token: WritableSelectorFamilyToken<T, K>,
	): WritableSelectorToken<T>
	public bond<T, K extends Json.Serializable>(
		token: ReadonlySelectorFamilyToken<T, K>,
	): ReadonlySelectorToken<T>
	public bond<T, K extends Json.Serializable>(
		token: WritableFamilyToken<T, K>,
	): WritableToken<T>
	public bond<T, K extends Json.Serializable>(
		token: ReadableFamilyToken<T, K>,
	): ReadableToken<T>
	public bond(token: ReadableFamilyToken<any, any>): ReadableToken<any> {
		const state = initFamilyMember(token, this.key, this.store)
		if (token.type === `mutable_atom_family`) {
			const jsonFamily = getJsonFamily(token, this.store)
			const jsonState = initFamilyMember(jsonFamily, this.key, this.store)
			this.tokens.push(jsonState)
		}
		this.tokens.push(state)
		return state
	}

	public spawn<K extends Json.Serializable>(key: K): Molecule<K> {
		const child = new Molecule(key, [this], this.store)
		return child
	}

	public with(molecule: Molecule<any>): (key: string) => Molecule<any> {
		return (key) => {
			const child = new Molecule(key, [this, molecule], this.store)
			return child
		}
	}

	public detach(child: Molecule<any>): void {
		const childIndex = this.below.indexOf(child)
		if (childIndex !== undefined) {
			this.below.splice(childIndex, 1)
		}
		const parentIndex = child.above.indexOf(this)
		if (parentIndex !== undefined) {
			child.above.splice(parentIndex, 1)
		}
	}

	public claim(child: Molecule<any>): void {
		if (child === this) {
			return
		}
		for (const parent of child.above) {
			parent.detach(child)
		}
		this.below.push(child)
		child.above.push(this)
	}

	public clear(): void {
		while (this.below.length > 0) {
			this.below.pop()?.dispose()
		}
		while (this.tokens.length > 0) {
			const token = this.tokens.pop()
			if (token) {
				disposeState(token, this.store)
			}
		}
		while (this.joins.length > 0) {
			const join = this.joins.pop()
			if (join) {
				join.molecules.delete(stringifyJson(this.key))
			}
		}
	}

	public join(token: JoinToken<any, any, any, any>): void {
		const join = getJoin(token, this.store)
		join.molecules.set(stringifyJson(this.key), this)
		this.joins.push(join)
	}

	private [Symbol.dispose](): void {
		this.clear()
		this.store.molecules.delete(stringifyJson(this.key))
		for (const parent of this.above) {
			parent.detach(this)
		}
	}
	public dispose = this[Symbol.dispose]
}
