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
import type { Store, Transceiver } from "atom.io/internal"
import { IMPLICIT } from "atom.io/internal"
import type { Json } from "atom.io/json"

import { initFamilyMember } from "../../internal/src/families/init-family-member"

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
		this.below.push(child)
		return child
	}

	public detach(child: Molecule): void {
		const index = this.below.indexOf(child)
		if (index !== undefined) {
			this.below.splice(index, 1)
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

	private [Symbol.dispose](): void {
		this.clear()
		for (const parent of this.above) {
			parent.detach(this)
		}
	}
	public dispose = this[Symbol.dispose]
}
