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
import { getJoin, type JoinToken } from "atom.io/data"
import type { Store, Transceiver } from "atom.io/internal"
import { IMPLICIT, initFamilyMember } from "atom.io/internal"
import type { Json } from "atom.io/json"

export function compositeKey(...keys: string[]): string {
	return keys.sort().join(`:`)
}

export class Molecule {
	public readonly below: Molecule[] = []
	public readonly tokens: ReadableToken<any>[] = []
	public constructor(
		public readonly key: string,
		public readonly above: Molecule[] = [],
		public readonly store: Store = IMPLICIT.STORE,
	) {
		for (const parent of above) {
			parent.below.push(this)
		}
	}

	public bond<
		T extends Transceiver<any>,
		J extends Json.Serializable,
		K extends string,
	>(token: MutableAtomFamilyToken<T, J, K>): MutableAtomToken<T, J>
	public bond<T, K extends string>(
		token: RegularAtomFamilyToken<T, K>,
	): RegularAtomToken<T>
	public bond<T, K extends string>(
		token: WritableSelectorFamilyToken<T, K>,
	): WritableSelectorToken<T>
	public bond<T, K extends string>(
		token: ReadonlySelectorFamilyToken<T, K>,
	): ReadonlySelectorToken<T>
	public bond<T, K extends string>(
		token: WritableFamilyToken<T, K>,
	): WritableToken<T>
	public bond<T, K extends string>(
		token: ReadableFamilyToken<T, K>,
	): ReadableToken<T>
	public bond(token: ReadableFamilyToken<any, any>): ReadableToken<any> {
		const state = initFamilyMember(token, this.key, this.store)
		this.tokens.push(state)
		return state
	}

	public spawn(key: string): Molecule {
		const child = new Molecule(key, [this])
		return child
	}

	public detach(child: Molecule): void {
		const childIndex = this.below.indexOf(child)
		if (childIndex !== undefined) {
			this.below.splice(childIndex, 1)
		}
		const parentIndex = child.above.indexOf(this)
		if (parentIndex !== undefined) {
			child.above.splice(parentIndex, 1)
		}
	}

	public claim(child: Molecule): void {
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
	}

	public join(token: JoinToken<any, any, any, any>): void {
		const join = getJoin(token, this.store)
		join.molecules.set(this.key, this)
	}

	private [Symbol.dispose](): void {
		this.clear()
		for (const parent of this.above) {
			parent.detach(this)
		}
	}
	public dispose = this[Symbol.dispose]
}
