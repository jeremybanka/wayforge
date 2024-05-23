import type {
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlySelectorFamilyToken,
	ReadonlySelectorToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	StateCreation,
	StateDisposal,
	WritableFamilyToken,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"
import type { Join, JoinToken } from "atom.io/data"
import { getJoin } from "atom.io/data"
import type { Store, Transceiver } from "atom.io/internal"
import {
	disposeFromStore,
	getJsonFamily,
	initFamilyMember,
	Subject,
} from "atom.io/internal"
import { type Json, stringifyJson } from "atom.io/json"

import type { MoleculeFamilyToken, MoleculeToken } from "./make-molecule"

export class Molecule<Key extends Json.Serializable> {
	public readonly type = `molecule`
	public get key(): Key {
		return this.token.key
	}
	public readonly family?: MoleculeFamilyToken<Key, any, any>
	public readonly sponsorship: `all` | `any` = `all`
	public readonly above: Molecule<any>[]
	public readonly below: Molecule<any>[] = []
	public readonly tokens: ReadableToken<any>[] = []
	public readonly joins: Join<any, any, any, any>[] = []
	public readonly subject = new Subject<
		StateCreation<any> | StateDisposal<any>
	>()
	public constructor(
		public readonly store: Store,
		above: Molecule<any> | Molecule<any>[] | undefined,
		public readonly token: MoleculeToken<Key, any, any>,
	) {
		// store.molecules.set(stringifyJson(key), this) // consider removing this
		if (above) {
			if (Array.isArray(above)) {
				this.above = above
				for (const parent of above) {
					parent.below.push(this)
				}
			} else {
				this.above = [above]
				above.below.push(this)
			}
		} else {
			this.above = []
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
		const state = initFamilyMember(token, this.token.key, this.store)
		if (token.type === `mutable_atom_family`) {
			const jsonFamily = getJsonFamily(token, this.store)
			const jsonState = initFamilyMember(jsonFamily, this.token.key, this.store)
			this.tokens.push(jsonState)
		}
		this.tokens.push(state)
		this.subject.next({ type: `state_creation`, token: state })
		return state
	}

	public spawn<K extends Json.Serializable>(key: K): Molecule<K> {
		const child = new Molecule(this.store, this, { key, type: `molecule` })
		return child
	}

	public with(molecule: Molecule<any>): (key: string) => Molecule<any> {
		return (key) => {
			const child = new Molecule(this.store, [this, molecule], {
				key,
				type: `molecule`,
			})
			return child
		}
	}

	public detach(child: Molecule<any>): void {
		const childIndex = this.below.indexOf(child)
		console.log(child.token.key, childIndex)
		if (childIndex !== -1) {
			this.below.splice(childIndex, 1)
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

	public join(token: JoinToken<any, any, any, any>): void {
		const join = getJoin(token, this.store)
		join.molecules.set(stringifyJson(this.token.key), this)
		this.joins.push(join)
	}
}
