import type {
	MoleculeToken,
	ReadableToken,
	StateCreation,
	StateDisposal,
} from "atom.io"
import type { Join } from "atom.io/data"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { Subject } from "../subject"

export class Molecule<K extends Canonical> implements MoleculeToken<K> {
	public readonly type = `molecule`
	public readonly key: K
	public stringKey: string
	public _dependsOn: `all` | `any`
	public get dependsOn(): `all` | `any` {
		return this._dependsOn
	}
	public readonly subject = new Subject<
		StateCreation<any> | StateDisposal<any>
	>()
	public tokens = new Map<string, ReadableToken<any>>()
	public above = new Map<string, Molecule<any>>()
	public below = new Map<string, Molecule<any>>()
	public joins = new Map<string, Join<any, any, any, any, any, any>>()
	public constructor(ctx: Molecule<any>[] | undefined, key: K) {
		this.key = key
		this.stringKey = stringifyJson(key)
		if (ctx) {
			for (const molecule of ctx) {
				this.above.set(molecule.stringKey, molecule)
			}
		}
	}
	public copy(): Molecule<K> {
		const copy = new Molecule([], this.key)
		copy.above = new Map(this.above)
		copy.below = new Map(this.below)
		copy.tokens = new Map(this.tokens)
		return copy
	}
}
